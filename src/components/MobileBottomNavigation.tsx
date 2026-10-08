import React from "react";
import { 
  PieChart, 
  Users, 
  GraduationCap, 
  Printer, 
  LayoutGrid 
} from "lucide-react";

interface MobileBottomNavigationProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenCategory: (category: "akademik" | "more") => void;
}

const AKADEMIK_TABS = ["jadwal", "absensi", "penilaian", "agenda", "bimbingan"];

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  onNavigate,
  onOpenCategory
}) => {
  const isAkademikActive = AKADEMIK_TABS.includes(activeTab);
  const isLaporanActive = activeTab === "laporan";
  const isDashboardActive = activeTab === "dashboard";
  const isSiswaActive = activeTab === "siswa";

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#14243A]/95 backdrop-blur-lg border-t border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] pb-safe shadow-lg select-none transition-colors duration-300"
      aria-label="Navigasi Bawah Mobile"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16">
        {/* 1. Dashboard */}
        <button
          onClick={() => onNavigate("dashboard")}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            isDashboardActive
              ? "text-[#0284C7] dark:text-[#67C7FF] font-bold"
              : "text-[#627D98] dark:text-[#A5B9CF] hover:text-[#0F1E36] dark:hover:text-white font-medium"
          }`}
        >
          <PieChart className={`w-5 h-5 ${isDashboardActive ? "scale-110 text-[#F4B400] dark:text-[#F6C453]" : ""}`} />
          <span className="text-[10px] mt-1 tracking-tight">Dashboard</span>
        </button>

        {/* 2. Siswa */}
        <button
          onClick={() => onNavigate("siswa")}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            isSiswaActive
              ? "text-[#0284C7] dark:text-[#67C7FF] font-bold"
              : "text-[#627D98] dark:text-[#A5B9CF] hover:text-[#0F1E36] dark:hover:text-white font-medium"
          }`}
        >
          <Users className={`w-5 h-5 ${isSiswaActive ? "scale-110 text-[#F4B400] dark:text-[#F6C453]" : ""}`} />
          <span className="text-[10px] mt-1 tracking-tight">Siswa</span>
        </button>

        {/* 3. Akademik */}
        <button
          onClick={() => onOpenCategory("akademik")}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            isAkademikActive
              ? "text-[#0284C7] dark:text-[#67C7FF] font-bold"
              : "text-[#627D98] dark:text-[#A5B9CF] hover:text-[#0F1E36] dark:hover:text-white font-medium"
          }`}
        >
          <GraduationCap className={`w-5 h-5 ${isAkademikActive ? "scale-110 text-[#F4B400] dark:text-[#F6C453]" : ""}`} />
          <span className="text-[10px] mt-1 tracking-tight">Akademik</span>
        </button>

        {/* 4. Laporan */}
        <button
          onClick={() => onNavigate("laporan")}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            isLaporanActive
              ? "text-[#0284C7] dark:text-[#67C7FF] font-bold"
              : "text-[#627D98] dark:text-[#A5B9CF] hover:text-[#0F1E36] dark:hover:text-white font-medium"
          }`}
        >
          <Printer className={`w-5 h-5 ${isLaporanActive ? "scale-110 text-[#F4B400] dark:text-[#F6C453]" : ""}`} />
          <span className="text-[10px] mt-1 tracking-tight">Laporan</span>
        </button>

        {/* 5. More */}
        <button
          onClick={() => onOpenCategory("more")}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            !isDashboardActive && !isSiswaActive && !isAkademikActive && !isLaporanActive
              ? "text-[#0284C7] dark:text-[#67C7FF] font-bold"
              : "text-[#627D98] dark:text-[#A5B9CF] hover:text-[#0F1E36] dark:hover:text-white font-medium"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
