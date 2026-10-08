import React from "react";
import { 
  PieChart, 
  Users, 
  IdCard, 
  BookOpen, 
  Clock, 
  ClipboardCheck, 
  Star, 
  Calendar, 
  HeartHandshake, 
  Printer, 
  Settings, 
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  UserCog
} from "lucide-react";

interface DesktopSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenBantuan: () => void;
  currentUser?: any;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  isAction?: boolean;
  dangerous?: boolean;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  onOpenBantuan,
  currentUser
}) => {
  const isAdmin = currentUser?.role === "admin";

  const sistemItems: NavItem[] = [
    { id: "laporan", label: "Pusat Laporan", icon: Printer },
  ];

  if (isAdmin) {
    sistemItems.push({ id: "manajemen_akun", label: "Manajemen Akun", icon: UserCog });
  }

  sistemItems.push({ id: "pengaturan", label: "Pengaturan", icon: Settings });
  sistemItems.push({ id: "bantuan", label: "Bantuan", icon: HelpCircle, isAction: true });

  const navSections: NavSection[] = [
    {
      group: "UTAMA",
      items: [
        { id: "dashboard", label: "Dashboard", icon: PieChart },
      ]
    },
    {
      group: "DATA",
      items: [
        { id: "siswa", label: "Kelola Siswa", icon: Users },
        { id: "kartu", label: "Cetak Kartu QR", icon: IdCard },
        { id: "mapel", label: "Kelola Mapel", icon: BookOpen },
      ]
    },
    {
      group: "AKADEMIK",
      items: [
        { id: "jadwal", label: "Jadwal Mengajar", icon: Clock },
        { id: "absensi", label: "Input Absensi", icon: ClipboardCheck },
        { id: "penilaian", label: "Input Penilaian", icon: Star },
        { id: "agenda", label: "Agenda Mengajar", icon: Calendar },
        { id: "bimbingan", label: "Bimbingan Guru Wali", icon: HeartHandshake },
      ]
    },
    {
      group: "SISTEM",
      items: sistemItems
    }
  ];

  return (
    <aside
      className={`hidden md:flex flex-col sticky top-0 h-screen bg-white dark:bg-[#14243A] text-[#0F1E36] dark:text-[#F0F6FC] border-r border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] select-none transition-colors duration-300 shrink-0 z-40 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shrink-0">
        <div className={`flex items-center space-x-3 overflow-hidden ${isCollapsed ? "justify-center w-full" : ""}`}>
          <div className="w-9 h-9 bg-[#0F1E36] dark:bg-[#101B2D] border border-[#F4B400]/40 dark:border-[#F6C453]/40 rounded-xl flex items-center justify-center text-[#F4B400] dark:text-[#F6C453] font-extrabold shadow-xs shrink-0">
            <GraduationCap className="w-5 h-5 text-[#F4B400] dark:text-[#F6C453]" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-extrabold text-base tracking-tight text-[#0F1E36] dark:text-white block leading-none">
                Aplikasi Guru
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#A5B9CF] font-normal block mt-1">Administrasi Guru Terpadu</span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-slate-400 hover:text-[#0F1E36] dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#192B43] transition-colors cursor-pointer"
            title="Ciutkan Sidebar"
            aria-label="Ciutkan Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* When collapsed, show expand button at top */}
      {isCollapsed && (
        <div className="px-2 pt-2 pb-0 flex justify-center">
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-slate-400 hover:text-[#0F1E36] dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#192B43] transition-colors w-full flex items-center justify-center cursor-pointer"
            title="Bentangkan Sidebar"
            aria-label="Bentangkan Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-[#627D98] dark:text-[#6B829E] uppercase tracking-wider mb-2">
                {sec.group}
              </p>
            )}
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isAction && item.id === "bantuan") {
                      onOpenBantuan();
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-180 active:scale-[0.98] min-h-[42px] relative group/btn cursor-pointer ${
                    isCollapsed ? "justify-center px-0" : ""
                  } ${
                    isActive
                      ? "bg-[#E8F5FF] dark:bg-[#1D405D] text-[#0F1E36] dark:text-white font-bold shadow-xs before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#F4B400] dark:before:bg-[#F6C453] before:rounded-r-full"
                      : "text-[#334E68] dark:text-[#A5B9CF] hover:bg-[#EEF7FF] dark:hover:bg-[#192B43] hover:text-[#0F1E36] dark:hover:text-[#F0F6FC] font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive 
                      ? "text-[#F4B400] dark:text-[#F6C453]" 
                      : "text-slate-400 dark:text-[#6B829E] group-hover/btn:text-[#0F1E36] dark:group-hover/btn:text-[#F0F6FC]"
                  }`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}

                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#0F1E36] dark:bg-[#101B2D] text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-50 border border-[rgba(120,160,200,0.3)]">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] text-center text-[11px] text-slate-500 dark:text-[#A5B9CF] bg-[#F8FBFE] dark:bg-[#101B2D]/50 space-y-1 shrink-0 font-normal">
          <p className="font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">Aplikasi Guru</p>
          <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal">
            Created by <span className="font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">sdhebatjaya</span>
          </p>
          <a
            href="sdhebatjaya.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] text-[#0284C7] dark:text-[#67C7FF] hover:underline transition-colors font-numeric font-medium tracking-tight"
          >
            tiadaharitanpaprestasi
          </a>
        </div>
      )}
    </aside>
  );
};
