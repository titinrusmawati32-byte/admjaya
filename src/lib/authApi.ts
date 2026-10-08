import { AuthSessionUser, UserAccount, AuditLogEntry } from "../types";
import { getUserProfileFromFirestore } from "./firebase";

const TOKEN_KEY = "edadmin_auth_token";
const USER_KEY = "edadmin_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): AuthSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthSessionUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function getApiBaseUrl(): string {
  // Allow overriding with VITE_API_URL in all environments (development and production)
  if (typeof window !== "undefined") {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl && typeof envUrl === "string" && envUrl.startsWith("http")) {
      return envUrl.replace(/\/+$/, "");
    }
  }
  // In production (Vercel) and local development, default to empty string for relative paths on same origin
  return "";
}


function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function apiLogin(username: string, password: string, rememberMe = false): Promise<{
  success: boolean;
  user?: AuthSessionUser;
  token?: string;
  message?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/auth/login`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, rememberMe })
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.warn("Unexpected non-JSON response from auth endpoint:", res.status, res.statusText);
      return {
        success: false,
        message: res.status === 404
          ? "Endpoint autentikasi tidak ditemukan (404). Pastikan deployment Vercel telah selesai dan server aktif."
          : `Server autentikasi merespons tidak terduga (${res.status}). Silakan muat ulang halaman.`
      };
    }

    const data = await res.json();
    if (res.ok && data.status === "success") {
      setStoredToken(data.token);
      setStoredUser(data.user);

      // Requirement 5: Read authoritative user profile from Firestore after authentication
      try {
        const fsProfile = await getUserProfileFromFirestore(data.user.id);
        if (fsProfile) {
          const syncedUser: AuthSessionUser = {
            id: fsProfile.id || data.user.id,
            userId: fsProfile.userId || data.user.userId,
            username: fsProfile.username || data.user.username,
            nama: fsProfile.nama || data.user.nama,
            role: (fsProfile.role as any) || data.user.role,
            createdBy: fsProfile.createdBy || data.user.createdBy,
            mustChangePassword: Boolean(fsProfile.mustChangePassword),
            nip: fsProfile.nip || data.user.nip || ""
          };
          setStoredUser(syncedUser);
          return { success: true, user: syncedUser, token: data.token };
        }
      } catch (fsErr) {
        // Fallback to validated session user
      }

      return { success: true, user: data.user, token: data.token };
    }
    return { success: false, message: data.message || "Gagal masuk." };
  } catch (err: any) {
    console.error("Login request error:", err);
    return { 
      success: false, 
      message: "Gagal terhubung ke server autentikasi. Pastikan koneksi internet stabil dan server backend telah aktif." 
    };
  }
}

export async function apiVerifySession(): Promise<{
  valid: boolean;
  user?: AuthSessionUser;
}> {
  const token = getStoredToken();
  if (!token) return { valid: false };

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/verify`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (res.ok && data.status === "success" && data.valid) {
        setStoredUser(data.user);
        return { valid: true, user: data.user };
      }
    }
    // Token is invalid
    setStoredToken(null);
    setStoredUser(null);
    return { valid: false };
  } catch {
    // If offline, check if token exists to allow offline work
    const cachedUser = getStoredUser();
    if (cachedUser) {
      return { valid: true, user: cachedUser };
    }
    return { valid: false };
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders()
    });
  } catch {
    // Ignore network error on logout
  } finally {
    setStoredToken(null);
    setStoredUser(null);
  }
}

export async function apiChangePassword(params: {
  currentPassword?: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      const u = getStoredUser();
      if (u) {
        u.mustChangePassword = false;
        setStoredUser(u);
      }
      return { success: true, message: data.message || "Password berhasil diubah." };
    }
    return { success: false, message: data.message || "Gagal mengubah password." };
  } catch {
    return { success: false, message: "Koneksi ke server gagal." };
  }
}

// Admin management APIs
export async function apiGetUsers(): Promise<UserAccount[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/admin/users`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.users || [];
  } catch {
    return [];
  }
}

export async function apiCreateUser(payload: {
  nama: string;
  nip?: string;
  username?: string;
  customPassword?: string;
}): Promise<{
  success: boolean;
  message?: string;
  user?: UserAccount & { temporaryPassword: string };
}> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/admin/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      return { success: true, user: data.user, message: data.message };
    }
    return { success: false, message: data.message || "Gagal membuat akun." };
  } catch {
    return { success: false, message: "Koneksi server gagal." };
  }
}

export async function apiToggleUserStatus(
  id: string,
  status: "active" | "inactive" | "ACTIVE" | "INACTIVE"
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiResetUserPassword(
  id: string
): Promise<{ success: boolean; temporaryPassword?: string; message?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${id}/reset-password`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      return { success: true, temporaryPassword: data.temporaryPassword };
    }
    return { success: false, message: data.message || "Gagal reset password." };
  } catch {
    return { success: false, message: "Koneksi server gagal." };
  }
}

export async function apiToggleForceChangePassword(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${id}/force-change-password`, {
      method: "PATCH",
      headers: getAuthHeaders()
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiDeleteUser(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return { success: res.ok, message: data.message };
  } catch {
    return { success: false, message: "Koneksi server gagal." };
  }
}

export async function apiGetAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/admin/audit-logs`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.logs || [];
  } catch {
    return [];
  }
}

export async function apiRecordAuditLog(payload: {
  action: AuditLogEntry["action"];
  details: string;
  targetUsername?: string;
}): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/api/audit/log-action`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
  } catch {
    // Non-blocking background log
  }
}
