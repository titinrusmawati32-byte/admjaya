import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  RefreshCw, 
  Trash2, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  Search, 
  AlertCircle, 
  ShieldAlert, 
  Clock, 
  History, 
  Sparkles, 
  CheckCircle2, 
  X,
  FileText
} from "lucide-react";
import { UserAccount, AuditLogEntry } from "../types";
import { 
  apiGetUsers, 
  apiCreateUser, 
  apiToggleUserStatus, 
  apiResetUserPassword, 
  apiToggleForceChangePassword, 
  apiDeleteUser, 
  apiGetAuditLogs 
} from "../lib/authApi";
import { showSuccess, showError, showConfirm } from "../lib/swal";

export const ManajemenAkunView: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "must_change">("all");
  const [isLoading, setIsLoading] = useState(false);

  // Modal: Tambah Akun
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formNama, setFormNama] = useState("");
  const [formNip, setFormNip] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Dialog Akun Guru Berhasil Dibuat
  const [createdUserCredential, setCreatedUserCredential] = useState<{
    nama: string;
    username: string;
    temporaryPassword: string;
  } | null>(null);

  // Modal: Dialog Reset Password
  const [resetCredential, setResetCredential] = useState<{
    nama: string;
    username: string;
    temporaryPassword: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Fetch users & logs
  const loadData = async () => {
    setIsLoading(true);
    const [fetchedUsers, fetchedLogs] = await Promise.all([
      apiGetUsers(),
      apiGetAuditLogs()
    ]);
    setUsers(fetchedUsers);
    setAuditLogs(fetchedLogs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to generate temporary password in UI
  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormPassword(pwd);
  };

  // Helper to generate username from name
  const handleGenerateUsername = () => {
    if (!formNama.trim()) return;
    const clean = formNama
      .toLowerCase()
      .replace(/^(drs\.|dr\.|dra\.|h\.|hj\.)/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 10);
    const randNum = Math.floor(10 + Math.random() * 90);
    setFormUsername(`guru.${clean || "guru"}${randNum}`);
  };

  // Submit create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      showError("Nama Guru wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const res = await apiCreateUser({
      nama: formNama.trim(),
      nip: formNip.trim(),
      username: formUsername.trim(),
      customPassword: formPassword.trim()
    });
    setIsSubmitting(false);

    if (res.success && res.user) {
      setIsAddModalOpen(false);
      setCreatedUserCredential({
        nama: res.user.nama,
        username: res.user.username,
        temporaryPassword: res.user.temporaryPassword
      });
      // Reset form
      setFormNama("");
      setFormNip("");
      setFormUsername("");
      setFormPassword("");
      loadData();
    } else {
      showError(res.message || "Gagal membuat akun guru.");
    }
  };

  // Toggle status
  const handleToggleStatus = async (user: UserAccount) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    const confirmText = nextStatus === "inactive" 
      ? `Nonaktifkan akun guru ${user.nama}? Guru tidak akan dapat login.`
      : `Aktifkan kembali akun guru ${user.nama}?`;

    const ok = await showConfirm(
      nextStatus === "inactive" ? "Nonaktifkan Akun?" : "Aktifkan Akun?",
      confirmText,
      nextStatus === "inactive" ? "Ya, Nonaktifkan" : "Ya, Aktifkan"
    );
    if (!ok) return;

    const success = await apiToggleUserStatus(user.id, nextStatus);
    if (success) {
      showSuccess(nextStatus === "inactive" ? "Akun dinonaktifkan." : "Akun diaktifkan.");
      loadData();
    } else {
      showError("Gagal memperbarui status akun.");
    }
  };

  // Reset password
  const handleResetPassword = async (user: UserAccount) => {
    const ok = await showConfirm(
      "Reset Password Guru?",
      `Sistem akan menghasilkan password sementara baru untuk ${user.nama}. Guru wajib mengganti password pada saat login berikutnya.`,
      "Ya, Reset Password"
    );
    if (!ok) return;

    const res = await apiResetUserPassword(user.id);
    if (res.success && res.temporaryPassword) {
      setResetCredential({
        nama: user.nama,
        username: user.username,
        temporaryPassword: res.temporaryPassword
      });
      loadData();
    } else {
      showError(res.message || "Gagal reset password.");
    }
  };

  // Toggle force change password
  const handleToggleForceChangePassword = async (user: UserAccount) => {
    const willForce = !user.mustChangePassword;
    const ok = await showConfirm(
      willForce ? "Paksa Ganti Password?" : "Batalkan Paksa Ganti Password?",
      willForce 
        ? `Guru @${user.username} akan diminta mengganti password pada saat login berikutnya.` 
        : `Batalkan kewajiban ganti password untuk @${user.username}?`,
      "Ya, Konfirmasi"
    );
    if (!ok) return;

    const success = await apiToggleForceChangePassword(user.id);
    if (success) {
      showSuccess(willForce ? "Wajib ganti password diaktifkan." : "Wajib ganti password dinonaktifkan.");
      loadData();
    } else {
      showError("Gagal memperbarui pengaturan.");
    }
  };

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Delete user
  const handleDeleteUser = async (user: UserAccount) => {
    if (user.role === "admin") {
      showError("Akun Kepala Sekolah (Admin Utama) tidak dapat dihapus.");
      return;
    }
    if (deletingUserId) return;

    const ok = await showConfirm(
      "Hapus Akun Guru?",
      `Hapus permanen akun ${user.nama} (@${user.username})? Seluruh kredensial dan sesi aktif guru ini akan dihapus secara permanen dari server database. Tindakan ini tidak dapat dibatalkan.`,
      "Ya, Hapus Permanen"
    );
    if (!ok) return;

    setDeletingUserId(user.id);
    try {
      const res = await apiDeleteUser(user.id);
      if (res.success) {
        // Optimistically remove user from state immediately without full page reload
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        showSuccess("Akun guru berhasil dihapus permanen dari server.");
        // Re-sync audit logs
        apiGetAuditLogs().then(setAuditLogs).catch(() => {});
      } else {
        showError(res.message || "Gagal menghapus akun dari server.");
      }
    } catch {
      showError("Terjadi kesalahan saat menghubungi server.");
    } finally {
      setDeletingUserId(null);
    }
  };

  // Copy credential helper
  const handleCopy = (nama: string, uName: string, pwd: string) => {
    const text = `KREDENSIAL PORTAL GURU\nNama: ${nama}\nUsername: ${uName}\nPassword Sementara: ${pwd}\n\n*Bagikan kredensial ini hanya kepada Guru yang bersangkutan. Pada login pertama, Guru wajib mengganti password.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nip && u.nip.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterStatus === "active") return u.status === "active";
    if (filterStatus === "inactive") return u.status === "inactive";
    if (filterStatus === "must_change") return Boolean(u.mustChangePassword);
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none">
      {/* Header Banner */}
      <div className="bg-white/95 dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#9A6700] dark:text-[#F6C453] bg-[#FFF8E8] dark:bg-[#203650] px-3 py-1 rounded-full border border-[#FFD66B]/60 dark:border-[#F6C453]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hak Akses: Kepala Sekolah (Admin Utama)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
            Manajemen Akun Guru
          </h1>
          <p className="text-xs text-[#334E68] dark:text-[#A5B9CF] font-normal">
            Kelola akun, generate password sementara, atur status aktif, dan pantau log audit keamanan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-2xl border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] bg-white dark:bg-[#14243A] hover:bg-slate-50 dark:hover:bg-[#203650] text-[#334E68] dark:text-[#A5B9CF] text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#0284C7] dark:text-[#67C7FF]" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setFormNama("");
              setFormNip("");
              setFormUsername("");
              setFormPassword("");
              handleGeneratePassword();
              setIsAddModalOpen(true);
            }}
            className="bg-[#F4B400] hover:bg-[#FFD66B] dark:bg-[#F6C453] dark:hover:bg-[#FFD978] text-[#0F1E36] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#0F1E36]" />
            <span>Tambah Akun Guru</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Daftar Akun vs Audit Log */}
      <div className="flex items-center space-x-2 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === "users"
              ? "bg-[#0F1E36] text-[#F4B400] dark:bg-[#203650] dark:text-[#F6C453] border border-[#F4B400]/40 dark:border-[#F6C453]/40 shadow-xs"
              : "text-[#334E68] dark:text-[#A5B9CF] hover:bg-slate-100 dark:hover:bg-[#192B43]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Akun Guru ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#0F1E36] text-[#F4B400] dark:bg-[#203650] dark:text-[#F6C453] border border-[#F4B400]/40 dark:border-[#F6C453]/40 shadow-xs"
              : "text-[#334E68] dark:text-[#A5B9CF] hover:bg-slate-100 dark:hover:bg-[#192B43]"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Aktivitas Akun ({auditLogs.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DAFTAR AKUN GURU */}
      {/* ======================================================== */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="bg-white/95 dark:bg-[#192B43] p-4 rounded-2xl border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari guru berdasarkan nama, username, atau NIP..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] rounded-xl text-[#0F1E36] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">Status:</span>
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  filterStatus === "all" ? "bg-[#0F1E36] text-white dark:bg-[#203650] dark:text-[#F6C453]" : "bg-slate-100 dark:bg-[#14243A] text-slate-600 dark:text-slate-300"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  filterStatus === "active" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-[#14243A] text-slate-600 dark:text-slate-300"
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("inactive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  filterStatus === "inactive" ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-[#14243A] text-slate-600 dark:text-slate-300"
                }`}
              >
                Nonaktif
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("must_change")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  filterStatus === "must_change" ? "bg-[#F4B400] text-[#0F1E36]" : "bg-slate-100 dark:bg-[#14243A] text-slate-600 dark:text-slate-300"
                }`}
              >
                Wajib Ganti Password
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white/95 dark:bg-[#192B43] rounded-2xl border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FBFE] dark:bg-[#14243A] border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama & Identitas</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4">Waktu Login Terakhir</th>
                    <th className="py-3 px-4 text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada data akun guru yang sesuai kriteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {user.nama}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {user.nip ? (
                              <span className="text-[11px] text-slate-400 font-mono">
                                NIP: {user.nip}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Tanpa NIP</span>
                            )}
                            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" title="ID Unik Akun Internal">
                              {user.userId || user.id}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            @{user.username}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Otoritas: {user.createdBy === "SYSTEM_ROOT" ? "ROOT ADMIN (Sistem)" : "KEPALA SEKOLAH"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Kepala Sekolah</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                              <span>Guru (User)</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            {user.status === "active" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>Nonaktif</span>
                              </span>
                            )}

                            {user.mustChangePassword && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-medium border border-amber-300 dark:border-amber-700/60">
                                Wajib Ganti Password
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {user.lastLogin ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(user.lastLogin).toLocaleString("id-ID")}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belum pernah login</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => handleResetPassword(user)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                              title="Reset Password Guru"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Force change password */}
                            {user.role !== "admin" && (
                              <button
                                type="button"
                                onClick={() => handleToggleForceChangePassword(user)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  user.mustChangePassword
                                    ? "text-amber-600 bg-amber-50 dark:bg-amber-950"
                                    : "text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                }`}
                                title={user.mustChangePassword ? "Batalkan Wajib Ganti Password" : "Paksa Ganti Password saat Login"}
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}

                            {/* Toggle active / inactive */}
                            {user.role !== "admin" && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  user.status === "active"
                                    ? "text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                                    : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                }`}
                                title={user.status === "active" ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                              >
                                {user.status === "active" ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Delete */}
                            {user.role !== "admin" && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                disabled={deletingUserId === user.id}
                                className={`p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors ${
                                  deletingUserId === user.id ? "opacity-50 cursor-not-allowed animate-pulse" : "cursor-pointer"
                                }`}
                                title="Hapus Akun Guru Permanen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: AUDIT LOG AKTIVITAS */}
      {/* ======================================================== */}
      {activeTab === "audit" && (
        <div className="bg-white/95 dark:bg-[#192B43] rounded-2xl border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#0F1E36] dark:text-white">
                Log Audit Keamanan Akun
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A5B9CF]">
                Pencatatan riwayat login, kegagalan kredensial, perubahan password, dan pembuatan akun.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FBFE] dark:bg-[#14243A] sticky top-0 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aksi / Event</th>
                  <th className="py-3 px-4">Pengguna (Actor)</th>
                  <th className="py-3 px-4">Target / Keterangan</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada catatan aktivitas keamanan.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 px-4">
                        {log.action === "LOGIN_SUCCESS" && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            LOGIN BERHASIL
                          </span>
                        )}
                        {log.action === "LOGIN_FAILED" && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                            LOGIN GAGAL
                          </span>
                        )}
                        {log.action === "ACCOUNT_LOCKED" && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px]">
                            AKUN TERKUNCI
                          </span>
                        )}
                        {log.action === "USER_CREATED" && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                            AKUN DIBUAT
                          </span>
                        )}
                        {log.action === "PASSWORD_CHANGED" && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                            GANTI PASSWORD
                          </span>
                        )}
                        {log.action === "STATUS_CHANGED" && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold text-[10px]">
                            STATUS DIUBAH
                          </span>
                        )}
                        {log.action === "USER_DELETED" && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 font-bold text-[10px]">
                            AKUN DIHAPUS
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        @{log.actorUsername}
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH AKUN GURU */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in select-none">
          <div className="w-full max-w-lg bg-white dark:bg-[#192B43] rounded-3xl p-6 border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xl space-y-5 transition-all duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF8E8] dark:bg-[#203650] text-[#F4B400] dark:text-[#F6C453] border border-[#FFD66B]/50 dark:border-[#F6C453]/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#F4B400] dark:text-[#F6C453]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Tambah Akun Guru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Akun resmi yang akan diserahkan kepada Guru pengajar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
                  Nama Lengkap Guru & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Dra. Siti Rahmawati, M.Pd."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] rounded-xl text-[#0F1E36] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
                  NIP Guru (Opsional)
                </label>
                <input
                  type="text"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  placeholder="19870101 201201 2 001"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] rounded-xl text-[#0F1E36] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                />
              </div>

              {/* Username with Generate Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
                    Username Guru
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateUsername}
                    className="text-[11px] text-[#0284C7] dark:text-[#67C7FF] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Sparkles className="w-3 h-3 text-[#F4B400]" />
                    <span>Generate Otomatis</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                    placeholder="guru.nama"
                    className="w-full pl-8 pr-3.5 py-2.5 text-xs font-mono bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] rounded-xl text-[#0F1E36] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Hanya huruf kecil, angka, titik, atau underscore.</p>
              </div>

              {/* Temporary Password with Generate Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
                    Password Sementara
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-[#0284C7] dark:text-[#67C7FF] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-500" />
                    <span>Acak Password Baru</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Password sementara"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] rounded-xl text-[#0F1E36] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                />
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  Guru wajib mengganti password ini dengan password pribadi pada saat pertama kali login.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F4B400] hover:bg-[#FFD66B] dark:bg-[#F6C453] dark:hover:bg-[#FFD978] text-[#0F1E36] cursor-pointer shadow-md disabled:opacity-60 active:scale-[0.98]"
                >
                  {isSubmitting ? "Menyimpan Akun..." : "Buat Akun Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DIALOG RESMI: AKUN GURU BERHASIL DIBUAT */}
      {/* ======================================================== */}
      {createdUserCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in select-none">
          <div className="w-full max-w-md bg-white dark:bg-[#192B43] rounded-3xl p-6 sm:p-7 border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xl space-y-5 transition-all duration-300">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F1E36] dark:text-white tracking-tight">
                Akun Guru Berhasil Dibuat
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A5B9CF]">
                Kredensial resmi telah siap untuk diserahkan kepada Guru.
              </p>
            </div>

            {/* Credential Card Display */}
            <div className="p-4 bg-[#F8FBFE] dark:bg-[#14243A] rounded-2xl border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)]">
                <span className="text-slate-500 dark:text-[#A5B9CF]">Nama:</span>
                <span className="font-bold text-[#0F1E36] dark:text-white">{createdUserCredential.nama}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)]">
                <span className="text-slate-500 dark:text-[#A5B9CF]">Username:</span>
                <span className="font-mono font-bold text-[#0284C7] dark:text-[#67C7FF]">@{createdUserCredential.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-[#A5B9CF]">Password sementara:</span>
                <span className="font-mono font-extrabold text-[#9A6700] dark:text-[#F6C453] bg-[#FFF8E8] dark:bg-[#203650] px-2 py-0.5 rounded border border-[#FFD66B]/50 dark:border-[#F6C453]/30">
                  {createdUserCredential.temporaryPassword}
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start space-x-2.5 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">
                Bagikan kredensial ini hanya kepada Guru yang bersangkutan.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleCopy(
                  createdUserCredential.nama,
                  createdUserCredential.username,
                  createdUserCredential.temporaryPassword
                )}
                className="flex-1 py-2.5 px-4 bg-[#F4B400] hover:bg-[#FFD66B] dark:bg-[#F6C453] dark:hover:bg-[#FFD978] text-[#0F1E36] font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-[#0F1E36]" /> : <Copy className="w-4 h-4 text-[#0F1E36]" />}
                <span>{copied ? "Kredensial Tersalin!" : "Salin Kredensial"}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedUserCredential(null)}
                className="py-2.5 px-4 rounded-xl border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC] hover:bg-slate-100 dark:hover:bg-[#203650] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DIALOG RESET PASSWORD SUKSES */}
      {/* ======================================================== */}
      {resetCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in select-none">
          <div className="w-full max-w-md bg-white dark:bg-[#192B43] rounded-3xl p-6 border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xl space-y-4 transition-all duration-300">
            <div className="text-center space-y-1">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF8E8] dark:bg-[#203650] border border-[#FFD66B]/50 dark:border-[#F6C453]/30 text-[#9A6700] dark:text-[#F6C453] flex items-center justify-center mx-auto shadow-xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F1E36] dark:text-white">
                Password Guru Berhasil Direset
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A5B9CF]">
                Password sementara baru untuk {resetCredential.nama} (@{resetCredential.username}):
              </p>
            </div>

            <div className="p-3.5 bg-[#F8FBFE] dark:bg-[#14243A] rounded-xl border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-[#A5B9CF]">Password Baru:</span>
              <span className="font-mono font-extrabold text-sm text-[#9A6700] dark:text-[#F6C453] bg-[#FFF8E8] dark:bg-[#203650] px-2.5 py-0.5 rounded border border-[#FFD66B]/50 dark:border-[#F6C453]/30">
                {resetCredential.temporaryPassword}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF]">
              Guru wajib mengganti password ini saat login berikutnya.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopy(resetCredential.nama, resetCredential.username, resetCredential.temporaryPassword)}
                className="flex-1 py-2 px-3 bg-[#F4B400] hover:bg-[#FFD66B] dark:bg-[#F6C453] dark:hover:bg-[#FFD978] text-[#0F1E36] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-[#0F1E36]" /> : <Copy className="w-4 h-4 text-[#0F1E36]" />}
                <span>{copied ? "Tersalin!" : "Salin Password"}</span>
              </button>
              <button
                type="button"
                onClick={() => setResetCredential(null)}
                className="px-4 py-2 border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] text-[#0F1E36] dark:text-[#F0F6FC] rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[#203650]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
