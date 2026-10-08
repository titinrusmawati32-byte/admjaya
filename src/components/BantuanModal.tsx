import React from "react";
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  MessageCircleQuestion 
} from "lucide-react";

interface BantuanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BantuanModal: React.FC<BantuanModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#14243A] rounded-3xl border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] transition-colors duration-300">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex items-center justify-between shrink-0 bg-[#F8FBFE] dark:bg-[#101B2D]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF8E8] dark:bg-[#203650] border border-[#FFD66B]/50 dark:border-[#F6C453]/30 text-[#F4B400] dark:text-[#F6C453] flex items-center justify-center shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#0F1E36] dark:text-white tracking-tight">
                Pusat Bantuan & Panduan Guru
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A5B9CF] font-normal">
                Petunjuk penggunaan Aplikasi Administrasi Guru Kurikulum Merdeka
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-[#0F1E36] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#192B43] transition-colors cursor-pointer"
            aria-label="Tutup Bantuan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm text-[#334E68] dark:text-[#A5B9CF]">
          {/* Section 1: Cara Penggunaan */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#0F1E36] dark:text-white flex items-center gap-2 text-sm tracking-tight">
              <BookOpen className="w-4 h-4 text-[#0284C7] dark:text-[#67C7FF]" />
              Alur Kerja Administrasi Guru
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F8FBFE] dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-1">
                <p className="font-semibold text-xs text-[#0F1E36] dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#0284C7] dark:bg-[#0284C7] text-white text-[10px] flex items-center justify-center font-numeric font-bold">1</span>
                  Kelola Data Siswa & Mapel
                </p>
                <p className="text-xs text-slate-500 dark:text-[#A5B9CF] font-normal">
                  Masukkan data master siswa dan mata pelajaran Anda atau gunakan fitur import Excel.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FBFE] dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-1">
                <p className="font-semibold text-xs text-[#0F1E36] dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#0284C7] dark:bg-[#0284C7] text-white text-[10px] flex items-center justify-center font-numeric font-bold">2</span>
                  Kartu Pelajar & Presensi QR
                </p>
                <p className="text-xs text-slate-500 dark:text-[#A5B9CF] font-normal">
                  Cetak kartu QR untuk setiap murid, dan gunakan kamera HP/laptop untuk scan kehadiran cepat.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FBFE] dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-1">
                <p className="font-semibold text-xs text-[#0F1E36] dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#0284C7] dark:bg-[#0284C7] text-white text-[10px] flex items-center justify-center font-numeric font-bold">3</span>
                  Jadwal & Agenda Harian
                </p>
                <p className="text-xs text-slate-500 dark:text-[#A5B9CF] font-normal">
                  Catat jurnal pembelajaran harian, capaian materi, dan kendala kelas dengan rapi.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FBFE] dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-1">
                <p className="font-semibold text-xs text-[#0F1E36] dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#0284C7] dark:bg-[#0284C7] text-white text-[10px] flex items-center justify-center font-numeric font-bold">4</span>
                  Pusat Cetak Laporan PDF
                </p>
                <p className="text-xs text-slate-500 dark:text-[#A5B9CF] font-normal">
                  Ekspor rekapitulasi kehadiran, leger nilai, dan jurnal KBM resmi lengkap dengan kop sekolah.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Kontak & Pengembang */}
          <div className="p-4 rounded-2xl bg-[#F8FBFE] dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#0F1E36] dark:text-white tracking-tight">Aplikasi Administrasi Guru</p>
              <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal">
                Dikembangkan oleh <span className="font-semibold text-[#0F1E36] dark:text-white">Yefri Haryanto</span>
              </p>
            </div>
            <a
              href="https://www.yefriharyanto.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Kunjungi Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] bg-[#F8FBFE] dark:bg-[#101B2D] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#F4B400] hover:bg-[#FFD66B] dark:bg-[#F6C453] dark:hover:bg-[#FFD978] text-[#0F1E36] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
