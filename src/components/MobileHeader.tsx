import React, { useState } from "react";
import { 
  Menu, 
  GraduationCap, 
  CloudCheck, 
  CloudOff, 
  Sun, 
  Moon, 
  Monitor,
  LogOut, 
  ShieldCheck, 
  HelpCircle,
  X
} from "lucide-react";
import { Pengaturan } from "../types";
import { useTheme } from "../context/ThemeContext";

interface MobileHeaderProps {
  activeTab: string;
  onOpenMenu: () => void;
  isDarkMode?: boolean;
  onSetDarkMode?: (isDark: boolean) => void;
  isConnected: boolean;
  currentUser: any;
  config: Pengaturan;
  onLogout: () => void;
  onOpenBantuan: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  onOpenMenu,
  onSetDarkMode,
  isConnected,
  currentUser,
  config,
  onLogout,
  onOpenBantuan
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#14243A]/95 backdrop-blur-md border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] transition-colors duration-300 shadow-2xs">
      <div className="flex items-center justify-between h-14 px-3">
        {/* Left: Hamburger menu + Logo */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-xl text-[#0F1E36] dark:text-[#F0F6FC] hover:bg-slate-100 dark:hover:bg-[#192B43] min-w-[38px] min-h-[38px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 bg-[#0F1E36] dark:bg-[#101B2D] border border-[#F4B400]/40 dark:border-[#F6C453]/40 rounded-lg flex items-center justify-center text-[#F4B400] dark:text-[#F6C453] font-extrabold shrink-0 shadow-xs">
              <GraduationCap className="w-4 h-4 text-[#F4B400] dark:text-[#F6C453]" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-extrabold text-[#0F1E36] dark:text-white text-sm tracking-tight truncate">
                Aplikasi Guru
              </span>
              <span className="text-[10px] text-[#0284C7] dark:text-[#67C7FF] font-semibold truncate capitalize">
                {activeTab === "dashboard" ? "Dashboard" : activeTab.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Status Badge + Theme toggle + Profile Avatar */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Connection status indicator */}
          <div 
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
              isConnected
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
            }`}
            title={isConnected ? "Firebase Realtime Terhubung" : "Menghubungkan..."}
          >
            {isConnected ? <CloudCheck className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
          </div>

          {/* Theme Quick Toggle Button */}
          <button
            type="button"
            onClick={() => {
              toggleTheme();
              onSetDarkMode?.(!isDark);
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isDark
                ? "bg-[#1D405D] border border-[#67C7FF]/30 text-[#67C7FF]"
                : "bg-[#FFF8E8] border border-[#FFD66B]/60 text-[#9A6700]"
            }`}
            title={isDark ? "Ganti ke Tema Terang" : "Ganti ke Tema Gelap"}
            aria-label="Ganti Tema"
          >
            {isDark ? <Moon className="w-4 h-4 text-[#F6C453]" /> : <Sun className="w-4 h-4 text-[#F4B400]" />}
          </button>

          {/* Profile Role & Dropdown Trigger */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`relative w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer active:scale-95 transition-all ${
              currentUser?.role === "admin"
                ? "bg-[#FFF8E8] text-[#9A6700] border-[#FFD66B]/60 dark:bg-[#203650] dark:text-[#F6C453] dark:border-[#F6C453]/30"
                : "bg-[#E8F5FF] text-[#0284C7] border-[#8DD3FF]/60 dark:bg-[#1D405D] dark:text-[#8DD8FF] dark:border-[#67C7FF]/30"
            }`}
            aria-label="Profil Pengguna"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>

        {/* Profile / Quick Actions Popover on Mobile */}
        {showProfileMenu && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs" 
              onClick={() => setShowProfileMenu(false)} 
            />
            <div className="absolute top-14 right-3 z-50 w-72 bg-white dark:bg-[#192B43] rounded-2xl border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-2.5 pb-2.5 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  currentUser?.role === "admin"
                    ? "bg-[#FFF8E8] text-[#9A6700] border border-[#FFD66B]/60 dark:bg-[#203650] dark:text-[#F6C453] dark:border-[#F6C453]/30"
                    : "bg-[#E8F5FF] text-[#0284C7] border border-[#8DD3FF]/60 dark:bg-[#1D405D] dark:text-[#8DD8FF] dark:border-[#67C7FF]/30"
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0F1E36] dark:text-white truncate">
                    {currentUser?.nama || currentUser?.name || config.Nama_Guru || "Pengguna"}
                  </p>
                  <p className={`text-[10px] font-semibold truncate ${
                    currentUser?.role === "admin" ? "text-[#9A6700] dark:text-[#F6C453]" : "text-[#0284C7] dark:text-[#67C7FF]"
                  }`}>
                    {currentUser?.role === "admin" ? "Kepala Sekolah (Admin)" : "Guru Pengajar"} {currentUser?.username ? `(@${currentUser.username})` : ""}
                  </p>
                </div>
              </div>

              {/* Theme Mode Segmented Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-[#A5B9CF] uppercase tracking-wider block">
                  Mode Tampilan
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#EEF7FF] dark:bg-[#101B2D] rounded-xl border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.15)]">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme("light");
                      onSetDarkMode?.(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
                      theme === "light"
                        ? "bg-[#F4B400] text-[#0F1E36] shadow-xs font-bold ring-1 ring-[#F4B400]/50"
                        : "text-slate-600 dark:text-[#A5B9CF] hover:text-[#0F1E36] font-medium"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Terang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTheme("dark");
                      onSetDarkMode?.(true);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                      theme === "dark"
                        ? "bg-[#1D405D] text-[#67C7FF] shadow-xs ring-1 ring-[#67C7FF]/40"
                        : "text-slate-600 dark:text-[#A5B9CF] hover:text-white"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Gelap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTheme("system");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                      theme === "system"
                        ? "bg-white dark:bg-[#192B43] text-[#0F1E36] dark:text-[#F0F6FC] shadow-xs"
                        : "text-slate-600 dark:text-[#A5B9CF] hover:text-white"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenBantuan();
                  }}
                  className="w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  <span>Bantuan & Panduan</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
