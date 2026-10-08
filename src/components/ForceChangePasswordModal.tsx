import React, { useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { apiChangePassword } from "../lib/authApi";

interface ForceChangePasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  username: string;
}

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  isOpen,
  onSuccess,
  username
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg("Password baru minimal terdiri dari 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok dengan password baru.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await apiChangePassword({ newPassword });
    setIsLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.message || "Gagal memperbarui password.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#192B43] rounded-3xl p-6 sm:p-7 border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xl space-y-5 transition-all duration-300">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8E8] dark:bg-[#203650] border border-[#FFD66B]/50 dark:border-[#F6C453]/30 text-[#9A6700] dark:text-[#F6C453] flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-[#0F1E36] dark:text-white tracking-tight">
            Ganti Password Wajib
          </h3>

          <p className="text-xs text-slate-500 dark:text-[#A5B9CF] leading-relaxed font-normal">
            Akun Guru (<strong className="font-semibold text-[#0F1E36] dark:text-slate-200">@{username}</strong>) saat ini menggunakan password sementara dari Kepala Sekolah. Demi keamanan, Anda wajib membuat password baru pribadi sebelum mengakses aplikasi.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start space-x-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
              Password Baru (Minimal 6 karakter)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru Anda"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.25)] dark:border-[rgba(150,200,240,0.18)] rounded-xl text-[#0F1E36] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F4B400] dark:focus:ring-[#F6C453]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
              Konfirmasi Password Baru
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru Anda"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.25)] dark:border-[rgba(150,200,240,0.18)] rounded-xl text-[#0F1E36] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F4B400] dark:focus:ring-[#F6C453]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#F4B400] hover:bg-[#FFD66B] dark:bg-[#F6C453] dark:hover:bg-[#FFD978] text-[#0F1E36] font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              {isLoading ? (
                <span>Menyimpan password baru...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Simpan & Masuk ke Aplikasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
