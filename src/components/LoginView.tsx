import React, { useState } from "react";
import { 
  GraduationCap, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sun, 
  Moon, 
  ArrowRight,
  ShieldAlert,
  Info
} from "lucide-react";
import { apiLogin } from "../lib/authApi";
import { AuthSessionUser } from "../types";

interface LoginViewProps {
  onLoginSuccess: (user: AuthSessionUser) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Silakan masukkan username dan password Anda.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await apiLogin(username.trim(), password.trim(), rememberMe);
    setIsLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.message || "Username atau password yang Anda masukkan tidak sesuai.");
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between text-[#0F1E36] dark:text-[#F0F6FC] p-4 sm:p-6 transition-all duration-350 font-sans relative overflow-hidden select-none"
      style={{
        background: isDarkMode
          ? "radial-gradient(circle at 15% 20%, rgba(91, 182, 249, 0.12), transparent 35%), radial-gradient(circle at 85% 80%, rgba(244, 180, 0, 0.10), transparent 35%), linear-gradient(135deg, #101B2D 0%, #162B45 55%, #26334A 100%)"
          : "radial-gradient(circle at 15% 20%, rgba(91, 182, 249, 0.15), transparent 35%), radial-gradient(circle at 85% 80%, rgba(244, 180, 0, 0.12), transparent 35%), linear-gradient(135deg, #EEF7FF 0%, #FFFFFF 55%, #FFF8E8 100%)"
      }}
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F1E36] dark:bg-[#14243A] text-[#F4B400] dark:text-[#F6C453] border border-[#F4B400]/30 dark:border-[#F6C453]/40 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5 text-[#F4B400] dark:text-[#F6C453]" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-[#0F1E36] dark:text-[#F0F6FC] tracking-tight block">
              Aplikasi Administrasi Guru
            </span>
            <span className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-medium">
              Sistem Terpadu Lingkungan Sekolah
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/90 dark:bg-[#192B43] border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] text-[#0F1E36] dark:text-[#F0F6FC] hover:bg-slate-50 dark:hover:bg-[#203650] transition-all shadow-xs flex items-center space-x-2 text-xs font-semibold cursor-pointer"
          aria-label="Toggle Tema"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-[#F6C453]" />
              <span className="hidden sm:inline">Tema Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#0F1E36]" />
              <span className="hidden sm:inline">Tema Gelap</span>
            </>
          )}
        </button>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto z-10 my-auto py-8">
        <div className="bg-white/95 dark:bg-[#192B43] rounded-[24px] p-7 sm:p-9 border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] shadow-xl dark:shadow-[0_20px_45px_-15px_rgba(5,12,24,0.6)] space-y-6 transition-all duration-350">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0F1E36] dark:bg-[#14243A] text-[#F4B400] dark:text-[#F6C453] border border-[#F4B400]/40 dark:border-[#F6C453]/40 shadow-sm mb-1">
              <GraduationCap className="w-7 h-7 text-[#F4B400] dark:text-[#F6C453]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              Selamat Datang
            </h1>

            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-[#0284C7] dark:text-[#67C7FF] tracking-tight">
                Portal Administrasi Guru
              </p>
              <p className="text-xs text-slate-500 dark:text-[#A5B9CF] font-normal">
                Masuk untuk mengakses ruang kerja Anda.
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start space-x-2.5 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label 
                htmlFor="username" 
                className="block text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.28)] dark:border-[rgba(150,200,240,0.2)] rounded-xl text-[#0F1E36] dark:text-[#F0F6FC] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F4B400] dark:focus:ring-[#F6C453] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label 
                htmlFor="password" 
                className="block text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.28)] dark:border-[rgba(150,200,240,0.2)] rounded-xl text-[#0F1E36] dark:text-[#F0F6FC] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F4B400] dark:focus:ring-[#F6C453] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-[#A5B9CF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F4B400] border-slate-300 dark:border-slate-700 focus:ring-[#F4B400] cursor-pointer"
                />
                <span>Ingat perangkat ini</span>
              </label>

              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-[11px] text-slate-400 hover:text-[#0284C7] dark:hover:text-[#F6C453] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>Bantuan Akun</span>
              </button>
            </div>

            {/* Helper Hint Drawer */}
            {showHint && (
              <div className="p-3 bg-[#EEF7FF] dark:bg-[#14243A] border border-[rgba(120,160,200,0.25)] dark:border-[rgba(150,200,240,0.18)] rounded-xl text-[11px] text-slate-700 dark:text-[#A5B9CF] space-y-1.5 animate-in fade-in">
                <div className="font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
                  Kredensial Bawaan Sekolah:
                </div>
                <div className="space-y-0.5 font-mono text-[10px]">
                  <div>&bull; <strong className="text-[#9A6700] dark:text-[#F6C453]">Kepala Sekolah (Admin):</strong> <code className="bg-white/80 dark:bg-[#192B43] px-1 py-0.5 rounded border border-amber-200/50 dark:border-amber-500/20">admin</code> / <code className="bg-white/80 dark:bg-[#192B43] px-1 py-0.5 rounded border border-amber-200/50 dark:border-amber-500/20">123</code> <span className="text-[9px] text-slate-400 dark:text-slate-500">(atau admin123)</span></div>
                  <div>&bull; <strong className="text-[#0284C7] dark:text-[#67C7FF]">Guru (User):</strong> <code className="bg-white/80 dark:bg-[#192B43] px-1 py-0.5 rounded border border-blue-200/50 dark:border-blue-500/20">guru.yefri</code> / <code className="bg-white/80 dark:bg-[#192B43] px-1 py-0.5 rounded border border-blue-200/50 dark:border-blue-500/20">Guru123!</code></div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                  Akun Guru baru dapat dibuat oleh Kepala Sekolah melalui menu Manajemen Akun.
                </p>
              </div>
            )}

            {/* Primary Submit Button: GOLD + DARK NAVY TEXT */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#F4B400] hover:bg-[#FFD66B] dark:bg-[#F6C453] dark:hover:bg-[#FFD978] text-[#0F1E36] font-bold text-sm rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-180 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0F1E36] border-t-transparent rounded-full animate-spin" />
                  <span>Memvalidasi kredensial...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4 text-[#0F1E36] group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Official Access Badge / Footer */}
          <div className="pt-3 border-t border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] text-center">
            <span className="text-xs text-slate-500 dark:text-[#A5B9CF] font-medium inline-flex items-center gap-1.5">
              <span>🔐</span>
              <span>Akses resmi Kepala Sekolah & Guru</span>
            </span>
          </div>
        </div>
      </main>

      {/* Clean Footer Credit */}
      <footer className="w-full max-w-md mx-auto text-center z-10 py-3 space-y-1">
        <p className="text-xs font-normal text-slate-600 dark:text-[#A5B9CF]">
          Aplikasi Administrasi Guru &bull; Lingkungan Sekolah Terpadu
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Sistem Autentikasi Internal Sekolah Terproteksi
        </p>
      </footer>
    </div>
  );
};
