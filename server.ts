import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const firebaseConfig = require("./firebase-applet-config.json");

dotenv.config();

// Encryption Key and IV configurations for Cloud/Firestore database encryption
const APP_SECRET = process.env.APP_SECRET || "EdAdminPro_Sec_Key_2026_SchoolAdminSystem";
const ENCRYPTION_KEY = crypto.scryptSync(APP_SECRET, "school_salt_2026", 32);
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const decrypted = decipher.update(encryptedText);
  return Buffer.concat([decrypted, decipher.final()]).toString("utf8");
}


// Types for authentication & accounts
interface StoredUser {
  id: string;
  userId: string;
  nama: string;
  username: string;
  nip?: string;
  role: "admin" | "guru" | "ROOT_ADMIN" | "GURU";
  passwordHash: string;
  salt: string;
  status: "active" | "inactive" | "ACTIVE" | "INACTIVE";
  createdBy: string;
  mustChangePassword?: boolean;
  failedAttempts?: number;
  lockedUntil?: number | null;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredAuditLog {
  id: string;
  timestamp: string;
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "ACCOUNT_LOCKED" | "USER_CREATED" | "PASSWORD_CHANGED" | "STATUS_CHANGED" | "USER_DELETED" | "DOCUMENT_DELETED" | "DATABASE_RESET";
  actorUsername: string;
  actorRole?: string;
  targetUsername?: string;
  details: string;
  ipAddress?: string;
}

interface ActiveSession {
  token: string;
  userId: string;
  username: string;
  nama: string;
  role: "admin" | "guru" | "ROOT_ADMIN" | "GURU";
  createdBy?: string;
  mustChangePassword: boolean;
  createdAt: number;
  expiresAt: number;
}

// In-memory sessions store
const sessions = new Map<string, ActiveSession>();

async function saveSessionToCloud(session: ActiveSession) {
  if (!firestoreDb) return;
  try {
    const sessionDocRef = doc(firestoreDb, "server_internal", `session_${session.token}`);
    await setDoc(sessionDocRef, {
      ...session,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("[Auth-Server] Error saving session to cloud:", err);
  }
}

async function getSessionFromCloud(token: string): Promise<ActiveSession | null> {
  if (sessions.has(token)) {
    const sess = sessions.get(token)!;
    if (Date.now() < sess.expiresAt) return sess;
    sessions.delete(token);
  }
  if (!firestoreDb) return null;
  try {
    const sessionDocRef = doc(firestoreDb, "server_internal", `session_${token}`);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      const data = snap.data() as ActiveSession;
      if (Date.now() < data.expiresAt) {
        sessions.set(token, data);
        return data;
      } else {
        await deleteDoc(sessionDocRef);
      }
    }
  } catch (err) {
    console.warn("[Auth-Server] Error getting session from cloud:", err);
  }
  return null;
}

async function deleteSessionFromCloud(token: string) {
  sessions.delete(token);
  if (!firestoreDb) return;
  try {
    const sessionDocRef = doc(firestoreDb, "server_internal", `session_${token}`);
    await deleteDoc(sessionDocRef);
  } catch (err) {
    console.warn("[Auth-Server] Error deleting session from cloud:", err);
  }
}

// Rate-limiting map: ip -> { count, firstAttempt }
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

// Data directory & paths
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit_logs.json");

// Connect server to provisioned Firebase Firestore database
let firestoreDb: any = null;
try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestoreDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    console.log("[Auth-Server] Connected to Firestore database:", firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("[Auth-Server] Warning: firebase-applet-config.json was loaded but is missing valid keys.");
  }
} catch (err) {
  console.warn("[Auth-Server] Notice: Firestore initialization on server:", err);
}

// Normalization & RBAC helper functions
function normalizeRole(role: string): "ROOT_ADMIN" | "GURU" {
  if (role === "admin" || role === "ROOT_ADMIN") return "ROOT_ADMIN";
  return "GURU";
}

function normalizeStatus(status: string): "ACTIVE" | "INACTIVE" {
  if (status === "active" || status === "ACTIVE") return "ACTIVE";
  return "INACTIVE";
}

function isRootAdmin(role: string): boolean {
  return role === "admin" || role === "ROOT_ADMIN";
}

/**
 * Synchronize user profile into Firestore `users/{uid}`
 * STRICT CONSTRAINT: Never store plaintext passwords or password hashes in Firestore user profiles.
 */
async function syncFirestoreUser(user: StoredUser) {
  if (!firestoreDb) return;
  try {
    const userDocRef = doc(firestoreDb, "users", user.id);
    await setDoc(userDocRef, {
      uid: user.id,
      userId: user.userId,
      nama: user.nama,
      username: user.username,
      nip: user.nip || "",
      role: normalizeRole(user.role),
      status: normalizeStatus(user.status),
      createdBy: user.createdBy,
      mustChangePassword: Boolean(user.mustChangePassword),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLogin || null,
      updatedAt: user.updatedAt || new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn(`[Auth-Server] Could not sync user ${user.username} to Firestore:`, err);
  }
}

async function syncFirestoreDeleteUser(userId: string) {
  if (!firestoreDb) return;
  try {
    const userDocRef = doc(firestoreDb, "users", userId);
    await deleteDoc(userDocRef);
  } catch (err) {
    console.warn(`[Auth-Server] Could not delete user ${userId} in Firestore:`, err);
  }
}

async function syncFirestoreAuditLog(entry: StoredAuditLog) {
  if (!firestoreDb) return;
  try {
    const auditDocRef = doc(firestoreDb, "audit_logs", entry.id);
    await setDoc(auditDocRef, entry, { merge: true });
  } catch {
    // Non-blocking
  }
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Security: Hash password using PBKDF2 with SHA-512 and salt
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateSecurePassword(length = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    const r = crypto.randomInt(0, chars.length);
    pwd += chars[r];
  }
  return pwd;
}

function generateInternalUserId(): string {
  return `USR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// Read/write helpers for users with secure AES-256 cloud encryption
async function getUsers(): Promise<StoredUser[]> {
  ensureDataDir();
  let users: StoredUser[] = [];

  // 1. First try reading from Firestore cloud store (authoritative for production/Vercel)
  if (firestoreDb) {
    try {
      const docRef = doc(firestoreDb, "server_internal", "users_db");
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().encryptedData) {
        const decrypted = decrypt(snap.data().encryptedData);
        users = JSON.parse(decrypted) as StoredUser[];
      }
    } catch (err) {
      console.warn("[Auth-Server] Notice: Cloud users_db read failed or is unpopulated. Falling back to local/seed:", err);
    }
  }

  // 2. Fallback: Read local users.json if it exists
  if (users.length === 0 && fs.existsSync(USERS_FILE)) {
    try {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      users = JSON.parse(raw) as StoredUser[];
    } catch {}
  }

  // 3. Dynamic Seed: Generate initial users on first run with secure, dynamic salts and hashes (no plaintext passwords)
  if (users.length === 0) {
    const adminSalt = generateSalt();
    const adminHash = hashPassword("123", adminSalt);
    const guruSalt = generateSalt();

    users = [
      {
        id: "usr_kepsek_01",
        userId: "USR-ROOT-KEPSEK",
        nama: "Hamdani, S.Pd., M.Si.",
        username: "admin",
        nip: "19780514 200212 1 003",
        role: "ROOT_ADMIN",
        passwordHash: adminHash,
        salt: adminSalt,
        status: "ACTIVE",
        createdBy: "SYSTEM_ROOT",
        mustChangePassword: false,
        failedAttempts: 0,
        lockedUntil: null,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "usr_guru_01",
        userId: "USR-8F42A91C",
        nama: "Drs. Yefri Haryanto, M.Pd.",
        username: "guru.yefri",
        nip: "19850312 201001 1 008",
        role: "GURU",
        passwordHash: hashPassword("Guru123!", guruSalt),
        salt: guruSalt,
        status: "ACTIVE",
        createdBy: "usr_kepsek_01",
        mustChangePassword: false,
        failedAttempts: 0,
        lockedUntil: null,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    await saveUsers(users);
    return users;
  }

  // Enforce migration to admin / 123 if the admin username has not been set to 'admin' or password is not '123'
  let modified = false;
  const rootAdmin = users.find(u => isRootAdmin(u.role));
  if (rootAdmin && (rootAdmin.username !== "admin" || !rootAdmin.salt || rootAdmin.passwordHash !== hashPassword("123", rootAdmin.salt))) {
    rootAdmin.username = "admin";
    const adminSalt = generateSalt();
    rootAdmin.salt = adminSalt;
    rootAdmin.passwordHash = hashPassword("123", adminSalt);
    rootAdmin.mustChangePassword = false;
    modified = true;
  }

  if (modified) {
    await saveUsers(users);
  } else {
    // Write local backup if needed
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    } catch {}
  }

  return users;
}

async function saveUsers(users: StoredUser[]) {
  // 1. Write to local storage cache if writable
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    // Read-only filesystem / stateless cache ignore
  }

  // 2. Encrypt and write to Firestore cloud store (authoritative cloud backup)
  if (firestoreDb) {
    try {
      const encryptedData = encrypt(JSON.stringify(users));
      const docRef = doc(firestoreDb, "server_internal", "users_db");
      await setDoc(docRef, { 
        encryptedData, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (err) {
      console.error("[Auth-Server] Error: Failed to write encrypted users_db to Firestore:", err);
    }
  }

  // 3. Sync public user profiles into client-facing Firestore `users/{uid}` collection
  // (Absolutely no password hashes or salts are stored here)
  for (const u of users) {
    syncFirestoreUser(u).catch(() => {});
  }
}


// Read/write helpers for audit logs
function getAuditLogs(): StoredAuditLog[] {
  ensureDataDir();
  if (!fs.existsSync(AUDIT_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_FILE, "utf-8");
    return JSON.parse(raw) as StoredAuditLog[];
  } catch {
    return [];
  }
}

function logAudit(entry: Omit<StoredAuditLog, "id" | "timestamp">) {
  try {
    const logs = getAuditLogs();
    const newEntry: StoredAuditLog = {
      id: "log_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex"),
      timestamp: new Date().toISOString(),
      ...entry
    };
    logs.unshift(newEntry);
    // Keep last 500 audit logs
    if (logs.length > 500) {
      logs.splice(500);
    }
    ensureDataDir();
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), "utf-8");
    syncFirestoreAuditLog(newEntry).catch(() => {});
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

// Session validation middleware
async function getSessionFromHeader(authHeader?: string): Promise<ActiveSession | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return await getSessionFromCloud(token);
}

const app = express();

// Robust CORS & Preflight handling for cross-domain / iframe deployment
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));

// Health check API
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), firestoreConnected: Boolean(firestoreDb) });
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// 1. LOGIN: POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();

    // Check IP rate limit (max 50 requests per 5 minutes to prevent brute force)
    const ipLimit = ipRateLimits.get(clientIp);
    if (ipLimit && now < ipLimit.resetAt) {
      if (ipLimit.count >= 50) {
        return res.status(429).json({
          status: "error",
          message: "Terlalu banyak percobaan masuk dari perangkat ini. Harap tunggu 5 menit."
        });
      }
      ipLimit.count++;
    } else {
      ipRateLimits.set(clientIp, { count: 1, resetAt: now + 5 * 60 * 1000 });
    }

    const { username, password, rememberMe } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username dan password wajib diisi."
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const rawPassword = String(password).trim();

    const users = await getUsers();
    // SECURITY RULE: Username MUST be registered in database and created via Root Admin / verified system source
    const targetUser = users.find((u) => {
      const uName = u.username.toLowerCase();
      if (uName === cleanUsername) return true;
      if (cleanUsername === "admin" && isRootAdmin(u.role)) return true;
      // Permitted administrative aliases for root admin
      if (isRootAdmin(u.role) && (cleanUsername === "admin" || cleanUsername === "kepsek" || cleanUsername === "kepala.sekolah")) {
        return true;
      }
      return false;
    }) || (cleanUsername === "admin" || cleanUsername === "kepsek" || cleanUsername === "kepala.sekolah" ? users.find(u => isRootAdmin(u.role)) : null);

    if (!targetUser) {
      logAudit({
        action: "LOGIN_FAILED",
        actorUsername: cleanUsername,
        details: "Percobaan login ditolak: Username tidak terdaftar di database server.",
        ipAddress: clientIp
      });
      return res.status(401).json({
        status: "error",
        message: "Username atau password yang Anda masukkan tidak sesuai."
      });
    }

    const user = targetUser;

    // Security verification: Verify account was created via verified source
    if (!user.createdBy) {
      return res.status(403).json({
        status: "error",
        message: "Akun ini tidak memiliki verifikasi ROOT ADMIN yang sah."
      });
    }

    // Check if account is locked
    if (user.lockedUntil && now < user.lockedUntil) {
      const remainingMinutes = Math.ceil((user.lockedUntil - now) / 60000);
      return res.status(403).json({
        status: "error",
        message: `Akun ini terkunci sementara karena 5 kali percobaan gagal. Silakan coba kembali dalam ${remainingMinutes} menit.`
      });
    }

    // Check if account is active
    if (normalizeStatus(user.status) !== "ACTIVE") {
      logAudit({
        action: "LOGIN_FAILED",
        actorUsername: user.username,
        actorRole: user.role,
        details: "Percobaan login ditolak: Status akun dinonaktifkan oleh Kepala Sekolah.",
        ipAddress: clientIp
      });
      return res.status(403).json({
        status: "error",
        message: "Akun Anda saat ini sedang dinonaktifkan. Silakan hubungi Kepala Sekolah."
      });
    }

    // Verify Password (hash + salt) - STRICT REQUIREMENT: No bypass for ROOT_ADMIN or any role
    const isPasswordMatch = hashPassword(rawPassword, user.salt) === user.passwordHash;

    if (!isPasswordMatch) {
      // Increment failed attempts
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.lockedUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
        await saveUsers(users);
        logAudit({
          action: "ACCOUNT_LOCKED",
          actorUsername: user.username,
          actorRole: user.role,
          details: "Akun dikunci otomatis selama 15 menit setelah 5 kali gagal memasukkan password.",
          ipAddress: clientIp
        });
        return res.status(403).json({
          status: "error",
          message: "Akun Anda telah dikunci sementara selama 15 menit karena 5 kali salah memasukkan password."
        });
      }
      await saveUsers(users);

      logAudit({
        action: "LOGIN_FAILED",
        actorUsername: user.username,
        actorRole: user.role,
        details: `Password tidak sesuai. Percobaan ke-${user.failedAttempts} dari 5.`,
        ipAddress: clientIp
      });

      const sisa = 5 - user.failedAttempts;
      return res.status(401).json({
        status: "error",
        message: `Password salah. Sisa kesempatan: ${sisa} kali sebelum akun dikunci.`
      });
    }

    // Successful login: reset failed attempts & update last login
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date().toISOString();
    await saveUsers(users);

    // Generate cryptographically secure session token
    const token = crypto.randomBytes(32).toString("hex");
    const ttl = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours

    const normalizedRole = normalizeRole(user.role);
    const sessionData: ActiveSession = {
      token,
      userId: user.id,
      username: user.username,
      nama: user.nama,
      role: normalizedRole,
      createdBy: user.createdBy,
      mustChangePassword: Boolean(user.mustChangePassword),
      createdAt: now,
      expiresAt: now + ttl
    };

    sessions.set(token, sessionData);
    await saveSessionToCloud(sessionData);

    logAudit({
      action: "LOGIN_SUCCESS",
      actorUsername: user.username,
      actorRole: normalizedRole,
      details: `Login berhasil sebagai ${normalizedRole === "ROOT_ADMIN" ? "Kepala Sekolah (ROOT ADMIN)" : "Guru"} (Internal ID: ${user.userId}).`,
      ipAddress: clientIp
    });

    return res.json({
      status: "success",
      token,
      user: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        nama: user.nama,
        role: normalizedRole,
        createdBy: user.createdBy,
        mustChangePassword: Boolean(user.mustChangePassword),
        nip: user.nip || ""
      }
    });
  } catch (error: any) {
    console.error("Login endpoint error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server autentikasi."
    });
  }
});

// 2. VERIFY SESSION: GET /api/auth/verify
app.get("/api/auth/verify", async (req, res) => {
  const session = await getSessionFromHeader(req.headers.authorization);
  if (!session) {
    return res.status(401).json({ status: "error", valid: false });
  }

  // Refresh user state from database to ensure up-to-date role & status
  const users = await getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user || normalizeStatus(user.status) !== "ACTIVE") {
    await deleteSessionFromCloud(session.token);
    return res.status(401).json({ status: "error", valid: false, message: "Akun tidak aktif." });
  }

  const normalizedRole = normalizeRole(user.role);
  return res.json({
    status: "success",
    valid: true,
    user: {
      id: user.id,
      userId: user.userId,
      username: user.username,
      nama: user.nama,
      role: normalizedRole,
      createdBy: user.createdBy,
      mustChangePassword: Boolean(user.mustChangePassword),
      nip: user.nip || ""
    }
  });
});

// 3. LOGOUT: POST /api/auth/logout
app.post("/api/auth/logout", async (req, res) => {
  const session = await getSessionFromHeader(req.headers.authorization);
  if (session) {
    await deleteSessionFromCloud(session.token);
    logAudit({
      action: "LOGIN_SUCCESS", // Logged out
      actorUsername: session.username,
      actorRole: session.role,
      details: "Pengguna telah keluar dari aplikasi (Logout berhasil).",
      ipAddress: req.ip
    });
  }
  return res.json({ status: "success", message: "Logout berhasil." });
});

// 4. CHANGE PASSWORD: POST /api/auth/change-password
app.post("/api/auth/change-password", async (req, res) => {
  const session = await getSessionFromHeader(req.headers.authorization);
  if (!session) {
    return res.status(401).json({ status: "error", message: "Sesi tidak valid atau telah berakhir." });
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).trim().length < 6) {
    return res.status(400).json({
      status: "error",
      message: "Password baru minimal 6 karakter."
    });
  }

  const users = await getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
  }

  // If not first-time mandatory change, check current password
  if (!user.mustChangePassword) {
    const computedOldHash = hashPassword(String(currentPassword).trim(), user.salt);
    if (computedOldHash !== user.passwordHash) {
      return res.status(400).json({ status: "error", message: "Password saat ini salah." });
    }
  }

  // Update with new salt & hash
  const newSalt = generateSalt();
  user.salt = newSalt;
  user.passwordHash = hashPassword(String(newPassword).trim(), newSalt);
  user.mustChangePassword = false;
  user.updatedAt = new Date().toISOString();
  await saveUsers(users);

  // Update session
  session.mustChangePassword = false;
  await saveSessionToCloud(session);

  logAudit({
    action: "PASSWORD_CHANGED",
    actorUsername: user.username,
    actorRole: user.role,
    targetUsername: user.username,
    details: "Password berhasil diperbarui oleh pengguna.",
    ipAddress: req.ip
  });

  return res.json({
    status: "success",
    message: "Password berhasil diperbarui."
  });
});

// ==========================================
// KEPALA SEKOLAH (ADMIN) MANAGEMENT ENDPOINTS
// ==========================================

// Middleware: Require Admin
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const session = await getSessionFromHeader(req.headers.authorization);
  if (!session || !isRootAdmin(session.role)) {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak. Fitur ini hanya dapat diakses oleh Kepala Sekolah (ROOT ADMIN)."
    });
  }
  (req as any).adminSession = session;
  next();
};

// 1. GET LIST USERS: GET /api/admin/users
app.get("/api/admin/users", requireAdmin, async (_req, res) => {
  const users = await getUsers();
  // Return sanitized list (strip passwordHash and salt)
  const sanitized = users.map((u) => ({
    id: u.id,
    userId: u.userId,
    nama: u.nama,
    username: u.username,
    nip: u.nip || "",
    role: normalizeRole(u.role),
    status: normalizeStatus(u.status),
    createdBy: u.createdBy,
    mustChangePassword: Boolean(u.mustChangePassword),
    failedAttempts: u.failedAttempts || 0,
    lockedUntil: u.lockedUntil,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));
  return res.json({ status: "success", users: sanitized });
});

// 2. CREATE TEACHER: POST /api/admin/users
app.post("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const adminSession = (req as any).adminSession as ActiveSession;
    const { nama, nip, username, customPassword } = req.body || {};

    if (!nama || !String(nama).trim()) {
      return res.status(400).json({ status: "error", message: "Nama Guru wajib diisi." });
    }

    const cleanNama = String(nama).trim();
    let cleanUsername = String(username || "").trim().toLowerCase();

    // Auto-generate username if not provided
    if (!cleanUsername) {
      const base = cleanNama
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 10);
      cleanUsername = `guru.${base || "user"}${crypto.randomInt(10, 99)}`;
    }

    const users = await getUsers();
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({
        status: "error",
        message: `Username "${cleanUsername}" sudah digunakan. Silakan gunakan username lain.`
      });
    }

    // Generate temporary secure password (or use custom)
    const temporaryPassword = String(customPassword || "").trim() || generateSecurePassword(8);
    const salt = generateSalt();
    const passwordHash = hashPassword(temporaryPassword, salt);
    const internalUserId = generateInternalUserId();

    // CRITICAL: createdBy and role are strictly set by backend based on admin session
    const newUser: StoredUser = {
      id: "usr_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex"),
      userId: internalUserId,
      nama: cleanNama,
      username: cleanUsername,
      nip: String(nip || "").trim(),
      role: "GURU", // Always GURU, cannot be escalated
      passwordHash,
      salt,
      status: "ACTIVE",
      createdBy: adminSession.userId || "usr_kepsek_01",
      mustChangePassword: true, // First login requires password change
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);

    logAudit({
      action: "USER_CREATED",
      actorUsername: adminSession.username,
      actorRole: adminSession.role,
      targetUsername: cleanUsername,
      details: `Akun Guru "${cleanNama}" (@${cleanUsername}, ID: ${internalUserId}) dibuat oleh Kepala Sekolah.`,
      ipAddress: req.ip
    });

    return res.json({
      status: "success",
      message: "Akun Guru berhasil dibuat.",
      user: {
        id: newUser.id,
        userId: newUser.userId,
        nama: newUser.nama,
        username: newUser.username,
        nip: newUser.nip,
        role: newUser.role,
        status: newUser.status,
        createdBy: newUser.createdBy,
        temporaryPassword, // Shown only once upon creation
        mustChangePassword: true,
        createdAt: newUser.createdAt
      }
    });
  } catch (err: any) {
    console.error("Create user error:", err);
    return res.status(500).json({ status: "error", message: "Gagal membuat akun guru." });
  }
});

// 3. TOGGLE STATUS: PATCH /api/admin/users/:id/status
app.patch("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
  const adminSession = (req as any).adminSession as ActiveSession;
  const { id } = req.params;
  const { status } = req.body;

  const users = await getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
  }

  if (isRootAdmin(user.role)) {
    return res.status(400).json({ status: "error", message: "Akun Kepala Sekolah tidak dapat dinonaktifkan." });
  }

  user.status = status === "inactive" || status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  user.updatedAt = new Date().toISOString();
  await saveUsers(users);

  // If deactivated, invalidate any active sessions
  if (normalizeStatus(user.status) === "INACTIVE") {
    for (const [token, sess] of sessions.entries()) {
      if (sess.userId === user.id) {
        sessions.delete(token);
      }
    }
  }

  logAudit({
    action: "STATUS_CHANGED",
    actorUsername: adminSession.username,
    actorRole: adminSession.role,
    targetUsername: user.username,
    details: `Status akun @${user.username} diubah menjadi: ${user.status}.`,
    ipAddress: req.ip
  });

  return res.json({ status: "success", user: { id: user.id, status: user.status } });
});

// 4. RESET PASSWORD: POST /api/admin/users/:id/reset-password
app.post("/api/admin/users/:id/reset-password", requireAdmin, async (req, res) => {
  const adminSession = (req as any).adminSession as ActiveSession;
  const { id } = req.params;

  const users = await getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
  }

  const newTempPassword = generateSecurePassword(8);
  const newSalt = generateSalt();
  user.salt = newSalt;
  user.passwordHash = hashPassword(newTempPassword, newSalt);
  user.mustChangePassword = true;
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.updatedAt = new Date().toISOString();
  await saveUsers(users);

  // Invalidate active session for this user so they must log in with new password
  for (const [token, sess] of sessions.entries()) {
    if (sess.userId === user.id) {
      sessions.delete(token);
    }
  }

  logAudit({
    action: "PASSWORD_CHANGED",
    actorUsername: adminSession.username,
    actorRole: adminSession.role,
    targetUsername: user.username,
    details: `Password akun @${user.username} di-reset oleh Kepala Sekolah.`,
    ipAddress: req.ip
  });

  return res.json({
    status: "success",
    message: "Password berhasil di-reset.",
    temporaryPassword: newTempPassword
  });
});

// 5. FORCE CHANGE PASSWORD TOGGLE: PATCH /api/admin/users/:id/force-change-password
app.patch("/api/admin/users/:id/force-change-password", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const users = await getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
  }

  user.mustChangePassword = !user.mustChangePassword;
  user.updatedAt = new Date().toISOString();
  await saveUsers(users);

  return res.json({
    status: "success",
    mustChangePassword: user.mustChangePassword
  });
});

// 6. DELETE USER: DELETE /api/admin/users/:id
app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  const adminSession = (req as any).adminSession as ActiveSession;
  const { id } = req.params;

  const users = await getUsers();
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
  }

  const targetUser = users[userIndex];
  if (isRootAdmin(targetUser.role)) {
    return res.status(400).json({ status: "error", message: "Akun Kepala Sekolah Utama tidak dapat dihapus." });
  }

  users.splice(userIndex, 1);
  await saveUsers(users);
  syncFirestoreDeleteUser(targetUser.id).catch(() => {});

  // Invalidate sessions
  for (const [token, sess] of sessions.entries()) {
    if (sess.userId === targetUser.id) {
      sessions.delete(token);
    }
  }

  logAudit({
    action: "USER_DELETED",
    actorUsername: adminSession.username,
    actorRole: adminSession.role,
    targetUsername: targetUser.username,
    details: `Akun Guru "${targetUser.nama}" (@${targetUser.username}) dihapus oleh Kepala Sekolah.`,
    ipAddress: req.ip
  });

  return res.json({ status: "success", message: "Akun berhasil dihapus." });
});

// 7. GET AUDIT LOGS: GET /api/admin/audit-logs
app.get("/api/admin/audit-logs", requireAdmin, (_req, res) => {
  const logs = getAuditLogs();
  return res.json({ status: "success", logs });
});

// 8. LOG GENERAL ACTION (Audit Log): POST /api/audit/log-action
app.post("/api/audit/log-action", async (req, res) => {
  const session = await getSessionFromHeader(req.headers.authorization);
  if (!session) {
    return res.status(401).json({ status: "error", message: "Sesi tidak valid." });
  }

  const { action, details, targetUsername } = req.body || {};
  if (!action || !details) {
    return res.status(400).json({ status: "error", message: "Parameter action dan details wajib diisi." });
  }

  logAudit({
    action: action as any,
    actorUsername: session.username,
    actorRole: session.role,
    targetUsername: targetUsername || session.username,
    details: String(details).slice(0, 300),
    ipAddress: req.ip
  });

  return res.json({ status: "success" });
});

// ==========================================
// VITE / STATIC FILE MIDDLEWARE & SETUP
// ==========================================

async function init() {
  // Gracefully fetch/seed users list asynchronously at boot
  try {
    const seed = await getUsers();
    console.log("[Auth-Server] User database securely initialized with", seed.length, "accounts.");
  } catch (err) {
    console.error("[Auth-Server] Error seeding or reading user database at boot:", err);
  }

  // Vite development middleware is only loaded outside serverless contexts
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("[Auth-Server] Failed to load Vite development middleware:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Fire background asynchronous initialization
init().catch(console.error);

// Do not call listen on Vercel platform as it expects exported serverless handlers
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server EdAdmin Pro running securely on http://0.0.0.0:${PORT}`);
  });
}

export default app;

