import React from "react";
import { 
  CloudCheck, 
  CloudOff, 
  Moon, 
  Sun, 
  Monitor,
  ShieldCheck, 
  LogOut,
  HelpCircle
} from "lucide-react";
import { Pengaturan } from "../types";
import { useTheme } from "../context/ThemeContext";

interface DesktopHeaderProps {
  activeTab: string;
  isDarkMode?: boolean;
  onSetDarkMode?: (isDark: boolean) => void;
  isConnected: boolean;
  config: Pengaturan;
  currentUser: any;
  onLogout: () => void;
  onOpenBantuan: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: "Dashboard Utama",
  siswa: "Kelola Master Data Siswa",
  kartu: "Cetak Kartu Pelajar QR Code",
  mapel: "Kelola Mata Pelajaran",
  jadwal: "Jadwal Mengajar Guru",
  absensi: "Input Presensi Harian & QR Scanner",
  penilaian: "Input Nilai Akademik Siswa",
  agenda: "Jurnal Agenda Mengajar",
  bimbingan: "Catatan Bimbingan Guru Wali",
  laporan: "Pusat Cetak Laporan PDF",
  manajemen_akun: "Manajemen Akun Guru & Hak Akses",
  pengaturan: "Pengaturan Profil & Kop Surat",
  resetdb: "Kosongkan & Hapus Seluruh Isi Database"
};


export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  activeTab,
  onSetDarkMode,
  isConnected,
  config,
  currentUser,
  onLogout,
  onOpenBantuan
}) => {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <header className="hidden md:flex sticky top-0 h-16 bg-white/95 dark:bg-[#14243A]/95 backdrop-blur-md border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] items-center justify-between px-6 shrink-0 z-30 transition-colors duration-300 shadow-xs select-none">
      {/* Left: Active Tab Title & Breadcrumb */}
      <div className="flex items-center space-x-3 min-w-0">
        <div>
          <h2 className="text-base font-bold text-[#0F1E36] dark:text-white tracking-tight flex items-center gap-2">
            <span>{TAB_TITLES[activeTab] || "Aplikasi Administrasi Guru"}</span>
          </h2>
          <p className="text-[11px] text-[#334E68] dark:text-[#A5B9CF] font-normal">
            {config.Nama_Sekolah || "SMP NEGERI 3 KERINCI"} &bull; {config.Tempat_Tanda_Tangan || "Kerinci"}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Firebase Live Status Badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            isConnected
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          }`}
          title={isConnected ? "Database terhubung realtime ke Firestore" : "Menghubungkan ke database..."}
        >
          {isConnected ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Firebase Live</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Menghubungkan...</span>
            </>
          )}
        </div>

        {/* Bantuan Button */}
        <button
          onClick={onOpenBantuan}
          className="p-2 rounded-xl text-[#334E68] dark:text-[#A5B9CF] hover:text-[#0F1E36] dark:hover:text-white hover:bg-[#EEF7FF] dark:hover:bg-[#192B43] transition-colors cursor-pointer"
          title="Pusat Bantuan & Panduan"
          aria-label="Bantuan"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Toggle Segment (Sun / Moon / System) */}
        <div 
          className="flex items-center bg-[#EEF7FF] dark:bg-[#101B2D] p-1 rounded-xl border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.15)] space-x-0.5"
          title={`Tema saat ini: ${theme === "light" ? "Terang" : theme === "dark" ? "Gelap" : "Otomatis (Sistem)"}`}
        >
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              onSetDarkMode?.(false);
            }}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              theme === "light"
                ? "bg-[#F4B400] text-[#0F1E36] shadow-xs font-bold ring-1 ring-[#F4B400]/50"
                : "text-slate-500 hover:text-[#0F1E36] dark:text-[#A5B9CF] dark:hover:text-[#F6C453] hover:bg-white/80 dark:hover:bg-[#192B43] font-medium"
            }`}
            title="Tema Terang (Light Mode)"
            aria-label="Tema Terang"
          >
            <Sun className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              onSetDarkMode?.(true);
            }}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              theme === "dark"
                ? "bg-[#1D405D] text-[#67C7FF] shadow-xs font-bold ring-1 ring-[#67C7FF]/40"
                : "text-slate-500 hover:text-[#0F1E36] dark:text-[#A5B9CF] dark:hover:text-[#67C7FF] hover:bg-white/80 dark:hover:bg-[#192B43] font-medium"
            }`}
            title="Tema Gelap (Dark Mode)"
            aria-label="Tema Gelap"
          >
            <Moon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("system");
            }}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              theme === "system"
                ? "bg-white dark:bg-[#192B43] text-[#0F1E36] dark:text-[#F0F6FC] shadow-xs font-semibold ring-1 ring-[rgba(120,160,200,0.3)]"
                : "text-slate-500 hover:text-[#0F1E36] dark:text-[#A5B9CF] hover:bg-white/80 dark:hover:bg-[#192B43] font-medium"
            }`}
            title="Mode Otomatis (Mengikuti Sistem OS)"
            aria-label="Ikuti Sistem"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Official User Role & Identity Badge */}
        <div className="flex items-center space-x-2.5 bg-white/90 dark:bg-[#192B43] px-3 py-1.5 rounded-xl border border-[rgba(120,160,200,0.2)] dark:border-[rgba(150,200,240,0.15)] shadow-2xs">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
            currentUser?.role === "admin"
              ? "bg-[#FFF8E8] text-[#9A6700] border border-[#FFD66B]/60 dark:bg-[#203650] dark:text-[#F6C453] dark:border-[#F6C453]/30"
              : "bg-[#E8F5FF] text-[#0284C7] border border-[#8DD3FF]/60 dark:bg-[#1D405D] dark:text-[#8DD8FF] dark:border-[#67C7FF]/30"
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-[#0F1E36] dark:text-white max-w-[140px] truncate leading-tight">
              {currentUser?.nama || currentUser?.name || config.Nama_Guru || "Pengguna"}
            </span>
            <span className={`text-[10px] font-semibold leading-tight ${
              currentUser?.role === "admin" ? "text-[#9A6700] dark:text-[#F6C453]" : "text-[#0284C7] dark:text-[#67C7FF]"
            }`}>
              {currentUser?.role === "admin" ? "Kepala Sekolah (Admin)" : "Guru Pengajar"}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
          title="Keluar dari Aplikasi"
          aria-label="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
