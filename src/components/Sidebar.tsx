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
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const navItems: NavSection[] = [
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
      items: [
        { id: "laporan", label: "Pusat Laporan", icon: Printer },
        { id: "pengaturan", label: "Pengaturan", icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-white dark:bg-[#080D18] text-slate-800 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-all duration-300 select-none ${
          isCollapsed ? "md:w-20" : "md:w-68"
        } ${
          isOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className={`flex items-center space-x-3 overflow-hidden ${isCollapsed ? "md:justify-center md:w-full" : ""}`}>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
                  Aplikasi Guru
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal block mt-1">Administrasi Guru Terpadu</span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button 
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95 transition-all md:hidden cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup Sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse toggle button on desktop */}
          <button
            className="hidden md:flex text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 items-center justify-center transition-colors shrink-0 cursor-pointer"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar pb-safe">
          {navItems.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 active:scale-[0.98] min-h-[42px] relative group/btn cursor-pointer ${
                      isCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md font-semibold tracking-tight"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive 
                        ? "text-white" 
                        : "text-slate-400 dark:text-slate-400 group-hover/btn:text-slate-700 dark:group-hover/btn:text-slate-200"
                    }`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}

                    {/* Tooltip when collapsed on desktop */}
                    {isCollapsed && (
                      <div className="hidden md:block absolute left-full ml-2 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-700">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Brand footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 text-center text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/40 space-y-1 shrink-0 font-normal">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Aplikasi Guru</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
              Created by <span className="font-semibold text-slate-800 dark:text-slate-200">Yefri Haryanto</span>
            </p>
            <a
              href="https://www.yefriharyanto.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors font-numeric font-medium tracking-tight"
            >
              www.yefriharyanto.id
            </a>
          </div>
        )}
      </aside>
    </>
  );
};
