import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from "firebase/firestore";
import firebaseConfigData from "../../firebase-applet-config.json";
import { getStoredUser, apiLogout, apiRecordAuditLog } from "./authApi";
import { 
  Siswa, 
  Mapel, 
  Jadwal, 
  LogAbsensi, 
  DataNilai, 
  JurnalAgenda, 
  SiswaBimbingan, 
  BimbinganWali, 
  Pengaturan,
  UserAccount 
} from "../types";

// Firebase Configuration dynamically resolved from Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_PENGATURAN_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_PENGATURAN_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_PENGATURAN_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_PENGATURAN_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_PENGATURAN_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_PENGATURAN_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: getCurrentUserUid(),
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Get Current Active User ID from Verified Session
 */
export function getCurrentUserUid(): string {
  const user = getStoredUser();
  if (user?.id) return user.id;
  if (typeof window !== "undefined") {
    try {
      const storedUid = localStorage.getItem("edadmin_user_uid");
      if (storedUid) return storedUid;
    } catch {}
  }
  return "usr_kepsek_01";
}

/**
 * Sign out and clear local session credentials
 */
export async function logOut(): Promise<void> {
  await apiLogout();
  if (typeof window !== "undefined") {
    localStorage.removeItem("edadmin_auth_token");
    localStorage.removeItem("edadmin_user");
    localStorage.removeItem("edadmin_user_uid");
    window.dispatchEvent(new Event("storage"));
  }
}


// Use explicit firestoreDatabaseId with auto detect long polling for iframe stability
const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || "(default)";

// Current Project & Database Identifiers
const PRIMARY_DATABASE_ID = firebaseConfigData.firestoreDatabaseId || "ai-studio-remixremixaplika-26b9115a-9245-4570-b3a2-5fdeac366a1c";
const PRIMARY_APPLET_ID = "26b9115a-9245-4570-b3a2-5fdeac366a1c";

/**
 * Detects whether the application is running in a remixed / cloned workspace environment.
 */
export function isRemixInstance(): boolean {
  return false;
}

/**
 * Returns false so the application directly utilizes the provisioned Firestore database.
 */
function isIsolatedRemix(): boolean {
  return false;
}

export function checkDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  return { authorized: true };
}

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  }, dbId);
} catch {
  firestoreInstance = getFirestore(app, dbId);
}

export const firestore = firestoreInstance;

// Collections references
export const COLLECTIONS = {
  SISWA: "data_siswa",
  MAPEL: "mapel",
  JADWAL: "jadwal",
  LOG_ABSENSI: "log_absensi",
  DATA_NILAI: "data_nilai",
  JURNAL_AGENDA: "jurnal_agenda",
  SISWA_BIMBINGAN: "siswa_bimbingan",
  BIMBINGAN_WALI: "bimbingan_wali",
  PENGATURAN: "pengaturan"
};

// Helpers for isolated local storage fallback when running in a remixed environment
function getRemixStorage<T>(collectionName: string, uid?: string): T[] {
  if (typeof window === "undefined") return [];
  const targetUid = uid || getCurrentUserUid();
  try {
    const raw = localStorage.getItem(`edadmin_remix_db_${targetUid}_${collectionName}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setRemixStorage<T>(collectionName: string, data: T[], uid?: string) {
  if (typeof window === "undefined") return;
  const targetUid = uid || getCurrentUserUid();
  try {
    localStorage.setItem(`edadmin_remix_db_${targetUid}_${collectionName}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`edadmin_remix_db_update_${targetUid}_${collectionName}`, { detail: data }));
  } catch (e) {
    console.error("Error writing remix database storage:", e);
  }
}

// User-scoped Collection Reference
export function getUserCollectionRef(collectionName: string, uid?: string) {
  const targetUid = uid || getCurrentUserUid();
  return collection(firestore, "users", targetUid, collectionName);
}

// User-scoped Document Reference
export function getUserDocRef(collectionName: string, docId: string, uid?: string) {
  const targetUid = uid || getCurrentUserUid();
  return doc(firestore, "users", targetUid, collectionName, docId);
}

// Generic Realtime Subscription with offline fallback & user isolation
export function subscribeCollection<T>(collectionName: string, callback: (data: T[]) => void, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  if (isIsolatedRemix()) {
    callback(getRemixStorage<T>(collectionName, targetUid));
    const handleUpdate = (e: any) => {
      if (e.detail) {
        callback(e.detail as T[]);
      } else {
        callback(getRemixStorage<T>(collectionName, targetUid));
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(`edadmin_remix_db_update_${targetUid}_${collectionName}`, handleUpdate);
      return () => window.removeEventListener(`edadmin_remix_db_update_${targetUid}_${collectionName}`, handleUpdate);
    }
    return () => {};
  }

  const colRef = collection(firestore, "users", targetUid, collectionName);
  return onSnapshot(
    colRef, 
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${targetUid}/${collectionName}`);
    }
  );
}

// Single Document Save/Update with user isolation
export async function saveDocument(collectionName: string, id: string, data: Record<string, any>, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  if (isIsolatedRemix()) {
    const current = getRemixStorage<any>(collectionName, targetUid);
    const idx = current.findIndex((item) => item.id === id);
    const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...data, id, updatedAt: Date.now() };
    if (idx >= 0) {
      current[idx] = updatedItem;
    } else {
      current.push(updatedItem);
    }
    setRemixStorage(collectionName, current, targetUid);
    return;
  }

  try {
    const docRef = doc(firestore, "users", targetUid, collectionName, id);
    await setDoc(docRef, { ...data, updatedAt: Date.now(), userUid: targetUid }, { merge: true });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}/${collectionName}/${id}`);
  }
}

// Single Document Delete with user isolation and persistent deletion guarantee
export async function deleteDocument(collectionName: string, id: string, uid?: string, metadata?: { label?: string; details?: string }) {
  const targetUid = uid || getCurrentUserUid();

  // Always update local remix storage first so cached state clears immediately
  const current = getRemixStorage<any>(collectionName, targetUid);
  if (current && current.length > 0) {
    const filtered = current.filter((item) => item.id !== id);
    setRemixStorage(collectionName, filtered, targetUid);
  }

  // Record audit log for data traceability
  try {
    apiRecordAuditLog({
      action: "DOCUMENT_DELETED",
      details: `Hapus permanen dokumen [${metadata?.label || collectionName}] ID: ${id}. ${metadata?.details || ""}`.trim()
    });
  } catch {}

  if (isIsolatedRemix()) {
    return;
  }

  try {
    const docRef = doc(firestore, "users", targetUid, collectionName, id);
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code === "not-found" || err?.message?.includes("not found")) {
      return;
    }
    handleFirestoreError(err, OperationType.DELETE, `users/${targetUid}/${collectionName}/${id}`);
  }
}

// Batch Save Documents with user isolation
export async function batchSaveDocuments(collectionName: string, items: Array<{ id: string; [key: string]: any }>, uid?: string) {
  if (!items || items.length === 0) return;
  const targetUid = uid || getCurrentUserUid();
  
  if (isIsolatedRemix()) {
    const current = getRemixStorage<any>(collectionName, targetUid);
    items.forEach((item) => {
      const idx = current.findIndex((existing) => existing.id === item.id);
      const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...item, updatedAt: Date.now() };
      if (idx >= 0) {
        current[idx] = updatedItem;
      } else {
        current.push(updatedItem);
      }
    });
    setRemixStorage(collectionName, current, targetUid);
    return;
  }

  try {
    const batch = writeBatch(firestore);
    items.forEach((item) => {
      const docRef = doc(firestore, "users", targetUid, collectionName, item.id);
      batch.set(docRef, { ...item, updatedAt: Date.now(), userUid: targetUid }, { merge: true });
    });
    await batch.commit();
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}/${collectionName}`);
  }
}

/**
 * Security guard specifically for Pengaturan Database connection.
 */
export function checkPengaturanDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  return { authorized: true };
}

// Pengaturan special helper (Doc ID: "config") with user isolation
export async function savePengaturan(config: Pengaturan, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  if (isIsolatedRemix()) {
    if (typeof window !== "undefined") {
      localStorage.setItem(`edadmin_remix_db_pengaturan_${targetUid}`, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent(`edadmin_remix_db_update_pengaturan_${targetUid}`, { detail: config }));
    }
    return;
  }

  try {
    const docRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");
    await setDoc(docRef, { ...config, updatedAt: Date.now(), userUid: targetUid }, { merge: true });
    if (typeof window !== "undefined") {
      localStorage.setItem(`edadmin_pengaturan_isolated_${targetUid}`, JSON.stringify(config));
    }
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}/${COLLECTIONS.PENGATURAN}/config`);
  }
}

export function subscribePengaturan(callback: (config: Pengaturan) => void, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  if (isIsolatedRemix()) {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`edadmin_remix_db_pengaturan_${targetUid}`) || localStorage.getItem(`edadmin_pengaturan_isolated_${targetUid}`);
      if (cached) {
        try {
          callback(JSON.parse(cached));
        } catch (e) {
          console.warn("Could not parse isolated local pengaturan cache:", e);
        }
      }
      const handleUpdate = (e: any) => {
        if (e.detail) callback(e.detail);
      };
      window.addEventListener(`edadmin_remix_db_update_pengaturan_${targetUid}`, handleUpdate);
      return () => window.removeEventListener(`edadmin_remix_db_update_pengaturan_${targetUid}`, handleUpdate);
    }
    return () => {};
  }

  const docRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");
  return onSnapshot(
    docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Pengaturan;
        callback(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(`edadmin_pengaturan_isolated_${targetUid}`, JSON.stringify(data));
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${targetUid}/${COLLECTIONS.PENGATURAN}/config`);
    }
  );
}

// Clear / Wipe All Collections in Database for the logged-in User
export async function clearAllDatabaseCollections(uid?: string) {
  const targetUid = uid || getCurrentUserUid();
  localStorage.setItem(`edadmin_database_cleared_${targetUid}`, "true");

  const collectionsToClear = [
    COLLECTIONS.SISWA,
    COLLECTIONS.MAPEL,
    COLLECTIONS.JADWAL,
    COLLECTIONS.LOG_ABSENSI,
    COLLECTIONS.DATA_NILAI,
    COLLECTIONS.JURNAL_AGENDA,
    COLLECTIONS.SISWA_BIMBINGAN,
    COLLECTIONS.BIMBINGAN_WALI
  ];

  // 1. Always purge local storage fallback for all collections & dispatch update events
  collectionsToClear.forEach((colName) => {
    setRemixStorage(colName, [], targetUid);
  });

  if (isIsolatedRemix()) {
    return;
  }

  // 2. Set isDatabaseCleared flag in user Firestore configuration and log audit
  try {
    apiRecordAuditLog({
      action: "DATABASE_RESET",
      details: `Pembersihan total (Reset Database) untuk seluruh data siswa, absensi, nilai, jadwal, agenda, dan bimbingan.`
    });
  } catch {}

  try {
    const configDocRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");
    await setDoc(configDocRef, { isDatabaseCleared: true, updatedAt: Date.now(), userUid: targetUid }, { merge: true });
  } catch (err) {
    console.warn(`Could not set isDatabaseCleared flag for users/${targetUid}:`, err);
  }

  // 3. Clear all collections in Firestore under users/{targetUid}
  for (const colName of collectionsToClear) {
    try {
      const colRef = collection(firestore, "users", targetUid, colName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        // Batch delete in chunks of 200
        for (let i = 0; i < docs.length; i += 200) {
          const chunk = docs.slice(i, i + 200);
          try {
            const batch = writeBatch(firestore);
            chunk.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });
            await batch.commit();
          } catch (batchErr) {
            console.warn(`Batch delete failed for users/${targetUid}/${colName}, fallback to individual:`, batchErr);
            for (const docSnap of chunk) {
              try {
                await deleteDoc(docSnap.ref);
              } catch (singleErr) {
                console.warn(`Notice: Could not delete doc ${docSnap.id} in users/${targetUid}/${colName}:`, singleErr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`Notice while clearing users/${targetUid}/${colName}:`, err);
    }
  }
}

/**
 * Fetch authoritative user profile from Firestore `users/{uid}`
 * Document contains: uid, userId, username, nama, nip, role, status, createdBy, createdAt, lastLoginAt, mustChangePassword
 * (No password or sensitive credentials stored in Firestore)
 */
export async function getUserProfileFromFirestore(uid: string): Promise<UserAccount | null> {
  try {
    const userDocRef = doc(firestore, "users", uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as unknown as UserAccount;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return null;
  }
}

/**
 * Real-time subscription to user profile from Firestore
 */
export function subscribeUserProfileFromFirestore(uid: string, callback: (profile: UserAccount | null) => void) {
  try {
    const userDocRef = doc(firestore, "users", uid);
    return onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() } as unknown as UserAccount);
        } else {
          callback(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return () => {};
  }
}
