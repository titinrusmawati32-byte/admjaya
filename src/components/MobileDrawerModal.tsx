import React, { useState } from "react";
import { 
  X, 
  ChevronRight, 
  Search, 
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
  HelpCircle, 
  GraduationCap,
  UserCog
} from "lucide-react";

interface MobileDrawerModalProps {
  isOpen: boolean;
  activeCategory: "akademik" | "more" | null;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onClose: () => void;
  onOpenBantuan: () => void;
  currentUser?: any;
}

interface DrawerItem {
  id: string;
  label: string;
  desc: string;
  icon: any;
  isAction?: boolean;
  dangerous?: boolean;
}

export const MobileDrawerModal: React.FC<MobileDrawerModalProps> = ({
  isOpen,
  activeCategory,
  activeTab,
  onSelectTab,
  onClose,
  onOpenBantuan,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === "admin";

  const sistemItems: DrawerItem[] = [
    { id: "laporan", label: "Pusat Laporan", desc: "Rekap absensi, leger nilai, jurnal & cetak PDF", icon: Printer },
  ];

  if (isAdmin) {
    sistemItems.push({
      id: "manajemen_akun",
      label: "Manajemen Akun",
      desc: "Kelola akun guru, password sementara & audit",
      icon: UserCog
    });
  }

  sistemItems.push({ id: "pengaturan", label: "Pengaturan", desc: "Profil guru, nama sekolah, NIP & kop surat", icon: Settings });
  sistemItems.push({ id: "bantuan", label: "Bantuan", desc: "Panduan pemakaian dan pusat bantuan", icon: HelpCircle, isAction: true });


  const allSections = [
    {
      category: "utama",
      group: "UTAMA",
      items: [
        { id: "dashboard", label: "Dashboard", desc: "Statistik, jadwal & aktivitas harian guru", icon: PieChart },
      ]
    },
    {
      category: "data",
      group: "DATA",
      items: [
        { id: "siswa", label: "Kelola Siswa", desc: "Data murid, NISN, rombel & import Excel", icon: Users },
        { id: "kartu", label: "Cetak Kartu QR", desc: "Cetak kartu pelajar barcode & QR code", icon: IdCard },
        { id: "mapel", label: "Kelola Mapel", desc: "Mata pelajaran, alokasi jam & semester", icon: BookOpen },
      ]
    },
    {
      category: "akademik",
      group: "AKADEMIK",
      items: [
        { id: "jadwal", label: "Jadwal Mengajar", desc: "Jadwal tatap muka kelas & ruang belajar", icon: Clock },
        { id: "absensi", label: "Input Absensi", desc: "Pencatatan presensi harian & scan QR kamera", icon: ClipboardCheck },
        { id: "penilaian", label: "Input Penilaian", desc: "Nilai formatif, sumatif & leger akademik", icon: Star },
        { id: "agenda", label: "Agenda Mengajar", desc: "Jurnal kegiatan belajar harian guru", icon: Calendar },
        { id: "bimbingan", label: "Bimbingan Guru Wali", desc: "Catatan bimbingan & konseling siswa", icon: HeartHandshake },
      ]
    },
    {
      category: "sistem",
      group: "SISTEM",
      items: sistemItems
    }
  ];

  // Filter sections depending on category
  const filteredSections = allSections.filter((section) => {
    if (activeCategory === "akademik") return section.category === "akademik";
    return true; // "more" or hamburger menu shows all
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden select-none animate-in fade-in duration-200">
      {/* Dark backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative bg-white dark:bg-[#14243A] rounded-t-3xl border-t border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] p-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col pb-24 transition-colors duration-300">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-[#203650] rounded-full mx-auto mb-3 shrink-0" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] mb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F1E36] dark:bg-[#101B2D] border border-[#F4B400]/40 dark:border-[#F6C453]/40 text-[#F4B400] dark:text-[#F6C453] flex items-center justify-center font-bold">
              {activeCategory === "akademik" ? (
                <GraduationCap className="w-5 h-5 text-[#F4B400] dark:text-[#F6C453]" />
              ) : (
                <PieChart className="w-5 h-5 text-[#F4B400] dark:text-[#F6C453]" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F1E36] dark:text-white tracking-tight">
                {activeCategory === "akademik" ? "Modul Administrasi Akademik" : "Semua Menu Aplikasi"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A5B9CF] font-normal">
                Pilih modul kerja yang ingin Anda buka
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-[#0F1E36] dark:hover:text-white bg-slate-100 dark:bg-[#192B43] min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input for quick lookup if showing more */}
        {activeCategory === "more" && (
          <div className="relative mb-3 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari fitur (misal: Absensi, Siswa, Penilaian)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-normal rounded-xl bg-[#F8FBFE] dark:bg-[#192B43] border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] text-[#0F1E36] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
            />
          </div>
        )}

        {/* Sections and Items */}
        <div className="space-y-4 flex-1">
          {filteredSections.map((sec, idx) => {
            const visibleItems = sec.items.filter((item) =>
              searchTerm ? item.label.toLowerCase().includes(searchTerm.toLowerCase()) || item.desc.toLowerCase().includes(searchTerm.toLowerCase()) : true
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1.5">
                <p className="text-[10px] font-bold text-[#627D98] dark:text-[#6B829E] uppercase tracking-wider px-1">
                  {sec.group}
                </p>
                <div className="space-y-1.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if ((item as any).isAction && item.id === "bantuan") {
                            onClose();
                            onOpenBantuan();
                          } else {
                            onSelectTab(item.id);
                            onClose();
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-180 active:scale-[0.99] cursor-pointer ${
                          isActive
                            ? "bg-[#E8F5FF] dark:bg-[#1D405D] border-[rgba(91,182,249,0.4)] dark:border-[rgba(103,199,255,0.25)] text-[#0F1E36] dark:text-white font-bold"
                            : (item as any).dangerous
                            ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 font-medium"
                            : "bg-[#F8FBFE] dark:bg-[#192B43] border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] text-[#0F1E36] dark:text-[#F0F6FC] font-medium hover:bg-[#EEF7FF] dark:hover:bg-[#203650]"
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-[#F4B400] dark:bg-[#F6C453] text-[#0F1E36]"
                              : (item as any).dangerous
                              ? "bg-red-100 dark:bg-red-900/40 text-red-600"
                              : "bg-white dark:bg-[#14243A] text-slate-600 dark:text-[#A5B9CF] shadow-2xs border border-[rgba(120,160,200,0.2)] dark:border-[rgba(150,200,240,0.15)]"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs sm:text-sm truncate ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
                              {(item as any).badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FFF8E8] text-[#9A6700] dark:bg-[#203650] dark:text-[#F6C453] font-semibold border border-[#FFD66B]/50 dark:border-[#F6C453]/30">
                                  {(item as any).badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal truncate">{item.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-[#F4B400] dark:text-[#F6C453]" : "text-slate-400"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
