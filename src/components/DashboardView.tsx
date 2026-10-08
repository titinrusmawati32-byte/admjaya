import React from "react";
import {
  Users,
  School,
  BookOpen,
  ClipboardCheck,
  Calendar,
  Star,
  TrendingUp,
  GraduationCap,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Layers,
  Printer
} from "lucide-react";
import { Siswa, Mapel, LogAbsensi, DataNilai, Jadwal, JurnalAgenda, Pengaturan } from "../types";

interface DashboardViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  absensiList: LogAbsensi[];
  nilaiList: DataNilai[];
  jadwalList: Jadwal[];
  agendaList?: JurnalAgenda[];
  currentUser?: any;
  config?: Pengaturan;
  onNavigate: (tab: string) => void;
}

const INDONESIAN_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const DashboardView: React.FC<DashboardViewProps> = ({
  siswaList,
  mapelList,
  absensiList,
  nilaiList,
  jadwalList,
  agendaList = [],
  currentUser,
  config,
  onNavigate
}) => {
  // Current Date in Indonesian
  const now = new Date();
  const currentDayName = INDONESIAN_DAYS[now.getDay()];
  const todayDateStr = now.toISOString().split("T")[0];

  const currentDateFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now);

  // 1. Statistics
  const totalSiswa = siswaList.length;
  const kelasSet = new Set(siswaList.map((s) => s.kelas).filter(Boolean));
  const totalKelas = kelasSet.size;

  const todayAbsensi = absensiList.filter((a) => a.waktu === todayDateStr || a.tanggal === todayDateStr);
  let attendancePercentage = 0;
  if (todayAbsensi.length > 0) {
    const hadirCount = todayAbsensi.filter((a) => a.status === "Hadir").length;
    attendancePercentage = Math.round((hadirCount / todayAbsensi.length) * 100);
  }

  // Today's schedule
  const todayJadwalList = jadwalList.filter(
    (j) => j.hari?.trim().toLowerCase() === currentDayName.toLowerCase()
  );
  const todayJadwalCount = todayJadwalList.length;

  // Assessments / Nilai
  const totalTugasDanNilai = nilaiList.length;

  // 7-day attendance trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const attendanceTrend = last7Days.map((date) => {
    const dayRecords = absensiList.filter((a) => a.waktu === date || a.tanggal === date);
    if (dayRecords.length === 0) return { date: date.slice(5), pct: 0 };
    const hadir = dayRecords.filter((a) => a.status === "Hadir").length;
    return {
      date: date.slice(5),
      pct: Math.round((hadir / dayRecords.length) * 100)
    };
  });

  // Recent activities aggregated from real data
  const recentActivities: Array<{
    id: string;
    type: "absensi" | "nilai" | "agenda";
    title: string;
    desc: string;
    badge: string;
    color: string;
  }> = [];

  // Recent absensi
  if (absensiList.length > 0) {
    const latestAbsensi = absensiList.slice(-2).reverse();
    latestAbsensi.forEach((item, idx) => {
      recentActivities.push({
        id: `abs-${idx}-${item.id || idx}`,
        type: "absensi",
        title: `Presensi: ${item.nama}`,
        desc: `Kelas ${item.kelas || "-"} • Status: ${item.status || "Hadir"}`,
        badge: item.status || "Hadir",
        color: item.status === "Hadir" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400" : "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400"
      });
    });
  }

  // Recent nilai
  if (nilaiList.length > 0) {
    const latestNilai = nilaiList.slice(-2).reverse();
    latestNilai.forEach((item, idx) => {
      recentActivities.push({
        id: `nil-${idx}-${item.id || idx}`,
        type: "nilai",
        title: `Nilai: ${item.namaSiswa}`,
        desc: `${item.mapel} • Skor: ${item.nilai} (${item.tipe || "Formatif"})`,
        badge: `${item.nilai}`,
        color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400"
      });
    });
  }

  // Recent agenda
  if (agendaList.length > 0) {
    const latestAgenda = agendaList.slice(-2).reverse();
    latestAgenda.forEach((item, idx) => {
      recentActivities.push({
        id: `age-${idx}-${item.id || idx}`,
        type: "agenda",
        title: `Jurnal: ${item.materi || item.mapel}`,
        desc: `Kelas ${item.kelas} • Jam ke-${item.jamKe || "1"}`,
        badge: "KBM",
        color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400"
      });
    });
  }

  // Teacher Name from auth or config
  const teacherName = currentUser?.name || config?.Nama_Guru || "Bapak/Ibu Guru";

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none">
      {/* ================================================== */}
      {/* ================================================== */}
      {/* A. Welcome Section */}
      {/* ================================================== */}
      <div className="bg-gradient-to-r from-[#EEF7FF] via-[#FFFFFF] to-[#FFF8E8] dark:from-[#14243A] dark:via-[#192B43] dark:to-[#203650] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-300">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#0284C7] dark:text-[#67C7FF] bg-[#E8F5FF] dark:bg-[#1D405D] px-3 py-1 rounded-full border border-[rgba(91,182,249,0.3)] dark:border-[rgba(103,199,255,0.2)]">
            <Calendar className="w-3.5 h-3.5 text-[#F4B400] dark:text-[#F6C453]" />
            <span className="font-numeric">{currentDateFormatted}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
            Selamat datang kembali, {teacherName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#334E68] dark:text-[#A5B9CF] font-normal">
            {config?.Nama_Sekolah || "SMP NEGERI 3 KERINCI"} &bull; Kurikulum Merdeka & Administrasi Digital Terpadu
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate("penilaian")}
            className="bg-[#F4B400] hover:bg-[#FFD66B] dark:bg-[#F6C453] dark:hover:bg-[#FFD978] text-[#0F1E36] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-transform active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <Star className="w-4 h-4 text-[#0F1E36]" />
            <span>Input Nilai Siswa</span>
          </button>
          <button
            onClick={() => onNavigate("absensi")}
            className="bg-[#E8F5FF] hover:bg-[#D9EFFF] dark:bg-[#1D405D] dark:hover:bg-[#20486D] text-[#0284C7] dark:text-[#8DD8FF] border border-[rgba(91,182,249,0.3)] dark:border-[rgba(103,199,255,0.25)] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-transform active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-[#0284C7] dark:text-[#8DD8FF]" />
            <span>Presensi Hari Ini</span>
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* B. Statistics Cards (4 Desktop, 2 Tablet & Mobile) */}
      {/* ================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Siswa */}
        <div className="bg-white/95 dark:bg-[#192B43] p-4 sm:p-5 rounded-2xl shadow-xs border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#627D98] dark:text-[#A5B9CF] uppercase tracking-wider">Total Siswa</span>
            <div className="w-9 h-9 bg-[#E8F5FF] dark:bg-[#1D405D] text-[#0284C7] dark:text-[#67C7FF] rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h3 className="font-numeric font-extrabold text-2xl sm:text-3xl text-[#0F1E36] dark:text-white tracking-tight">{totalSiswa}</h3>
            <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal mt-0.5">
              <span className="font-numeric font-semibold">{totalKelas}</span> Rombel / Kelas Aktif
            </p>
          </div>
        </div>

        {/* Kehadiran */}
        <div className="bg-white/95 dark:bg-[#192B43] p-4 sm:p-5 rounded-2xl shadow-xs border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#627D98] dark:text-[#A5B9CF] uppercase tracking-wider">Kehadiran</span>
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h3 className="font-numeric font-extrabold text-2xl sm:text-3xl text-[#0F1E36] dark:text-white tracking-tight">{attendancePercentage}%</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal mt-0.5">
              {todayAbsensi.length > 0 ? (
                <>
                  <span className="font-numeric font-semibold">{todayAbsensi.length}</span> siswa diabsen
                </>
              ) : (
                "Belum ada presensi"
              )}
            </p>
          </div>
        </div>

        {/* Jadwal Hari Ini */}
        <div className="bg-white/95 dark:bg-[#192B43] p-4 sm:p-5 rounded-2xl shadow-xs border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#627D98] dark:text-[#A5B9CF] uppercase tracking-wider">Jadwal Hari Ini</span>
            <div className="w-9 h-9 bg-[#FFF8E8] dark:bg-[#203650] text-[#F4B400] dark:text-[#F6C453] rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h3 className="font-numeric font-extrabold text-2xl sm:text-3xl text-[#0F1E36] dark:text-white tracking-tight">{todayJadwalCount}</h3>
            <p className="text-[11px] text-[#9A6700] dark:text-[#F6C453] font-normal mt-0.5">
              {todayJadwalCount > 0 ? `Sesi KBM hari ${currentDayName}` : `Hari ${currentDayName} libur / bebas`}
            </p>
          </div>
        </div>

        {/* Tugas / Penilaian */}
        <div className="bg-white/95 dark:bg-[#192B43] p-4 sm:p-5 rounded-2xl shadow-xs border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#627D98] dark:text-[#A5B9CF] uppercase tracking-wider">Penilaian</span>
            <div className="w-9 h-9 bg-[#FFF8E8] dark:bg-[#203650] text-[#F4B400] dark:text-[#F6C453] rounded-xl flex items-center justify-center shrink-0">
              <Star className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h3 className="font-numeric font-extrabold text-2xl sm:text-3xl text-[#0F1E36] dark:text-white tracking-tight">{totalTugasDanNilai}</h3>
            <p className="text-[11px] text-[#9A6700] dark:text-[#F6C453] font-normal mt-0.5">Entri Nilai Akademik</p>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* ================================================== */}
      {/* C. Quick Actions (Horizontal Scroll on Mobile) */}
      {/* ================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Aksi Cepat Guru
          </h3>
          <span className="text-[11px] text-slate-400 font-normal">Pintasan sekali sentuh</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 custom-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
          <button
            onClick={() => onNavigate("siswa")}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] hover:border-[#5BB6F9] dark:hover:border-[#67C7FF] text-[#0F1E36] dark:text-[#F0F6FC] font-semibold text-xs whitespace-nowrap shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-[#0284C7] dark:text-[#67C7FF]" />
            <span>Tambah Siswa</span>
          </button>

          <button
            onClick={() => onNavigate("absensi")}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] hover:border-emerald-400 dark:hover:border-emerald-600 text-[#0F1E36] dark:text-[#F0F6FC] font-semibold text-xs whitespace-nowrap shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Input Absensi</span>
          </button>

          <button
            onClick={() => onNavigate("penilaian")}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] hover:border-[#F4B400] dark:hover:border-[#F6C453] text-[#0F1E36] dark:text-[#F0F6FC] font-semibold text-xs whitespace-nowrap shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Star className="w-4 h-4 text-[#F4B400] dark:text-[#F6C453]" />
            <span>Input Nilai</span>
          </button>

          <button
            onClick={() => onNavigate("jadwal")}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] hover:border-[#5BB6F9] dark:hover:border-[#67C7FF] text-[#0F1E36] dark:text-[#F0F6FC] font-semibold text-xs whitespace-nowrap shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Clock className="w-4 h-4 text-[#0284C7] dark:text-[#67C7FF]" />
            <span>Jadwal Mengajar</span>
          </button>

          <button
            onClick={() => onNavigate("laporan")}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] hover:border-[#5BB6F9] dark:hover:border-[#67C7FF] text-[#0F1E36] dark:text-[#F0F6FC] font-semibold text-xs whitespace-nowrap shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4 text-[#0284C7] dark:text-[#67C7FF]" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* MAIN TWO-COLUMN CONTENT GRID (Desktop: 2 Cols) */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Jadwal Mengajar & Tren Kehadiran (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* D. Jadwal Mengajar Hari Ini */}
          <div className="bg-white/95 dark:bg-[#192B43] p-5 sm:p-6 rounded-3xl shadow-xs border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8F5FF] dark:bg-[#1D405D] text-[#0284C7] dark:text-[#67C7FF] flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F1E36] dark:text-white tracking-tight">
                    Jadwal Mengajar Hari Ini ({currentDayName})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal">
                    Sesi tatap muka kelas aktif
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("jadwal")}
                className="text-xs font-semibold text-[#0284C7] dark:text-[#67C7FF] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayJadwalList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] text-center space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 dark:text-[#6B829E] mx-auto" />
                <p className="text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
                  Tidak ada jadwal mengajar pada hari {currentDayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal max-w-sm mx-auto">
                  Gunakan waktu luang Anda untuk memeriksa data presensi, menyusun agenda pembelajaran, atau mempersiapkan materi kelas berikutnya.
                </p>
                <button
                  onClick={() => onNavigate("jadwal")}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#192B43] border border-[rgba(120,160,200,0.22)] dark:border-[rgba(150,200,240,0.18)] text-xs font-semibold text-[#0284C7] dark:text-[#67C7FF] shadow-2xs hover:bg-[#EEF7FF] transition-colors cursor-pointer"
                >
                  <span>Atur Jadwal Mingguan</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayJadwalList.map((j, idx) => (
                  <div
                    key={j.id || idx}
                    className="p-4 bg-[#F8FBFE] dark:bg-[#14243A] rounded-2xl border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex items-center justify-between transition-all hover:bg-slate-100/70 dark:hover:bg-[#1D405D]/50"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#E8F5FF] dark:bg-[#1D405D] text-[#0284C7] dark:text-[#8DD8FF] flex items-center justify-center font-numeric font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-[#0F1E36] dark:text-white truncate">
                          {j.mapel}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-[#A5B9CF] flex items-center gap-2 mt-0.5 font-normal">
                          <span>Kelas: <strong className="font-semibold">{j.kelas}</strong></span>
                          <span>&bull;</span>
                          <span className="font-numeric font-semibold text-[#0284C7] dark:text-[#67C7FF]">{j.jam}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate("absensi")}
                      className="px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold shrink-0 transition-transform active:scale-95 cursor-pointer"
                    >
                      Absen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tren Kehadiran Siswa (7 Hari) */}
          <div className="bg-white/95 dark:bg-[#192B43] p-5 sm:p-6 rounded-3xl shadow-xs border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-[#0F1E36] dark:text-white tracking-tight">Tren Kehadiran (7 Hari)</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal">Persentase kehadiran harian siswa secara keseluruhan</p>
              </div>
              <span className="text-sm font-numeric font-bold text-[#0284C7] dark:text-[#67C7FF] bg-[#E8F5FF] dark:bg-[#1D405D] px-3 py-1 rounded-xl border border-[rgba(91,182,249,0.3)] dark:border-[rgba(103,199,255,0.25)]">
                {attendancePercentage}%
              </span>
            </div>

            <div className="h-36 flex items-end justify-between gap-2 pt-4 pb-1 border-b border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)]">
              {attendanceTrend.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                  <span className="font-numeric font-semibold text-[10px] text-slate-500 dark:text-[#A5B9CF]">
                    {item.pct}%
                  </span>
                  <div className="w-full bg-[#F8FBFE] dark:bg-[#14243A] rounded-t-lg h-24 flex items-end overflow-hidden p-0.5">
                    <div
                      className="w-full bg-[#5BB6F9] dark:bg-[#67C7FF] rounded-t-md transition-all duration-300 group-hover:bg-[#F4B400] dark:group-hover:bg-[#F6C453]"
                      style={{ height: `${Math.max(item.pct, 6)}%` }}
                    />
                  </div>
                  <span className="font-numeric text-[10px] text-slate-400 dark:text-[#6B829E] truncate max-w-full">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Perlu Perhatian & Aktivitas Terbaru (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* F. Perlu Perhatian (Pending / Action Needed) */}
          <div className="bg-white/95 dark:bg-[#192B43] p-5 sm:p-6 rounded-3xl shadow-xs border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFF8E8] dark:bg-[#203650] text-[#F4B400] dark:text-[#F6C453] flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0F1E36] dark:text-white tracking-tight">
                  Perlu Perhatian
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal">
                  Tugas administrasi yang perlu diselesaikan
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Checklist 1: Absensi */}
              <div className="p-3.5 rounded-2xl bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    todayAbsensi.length > 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-[#FFF8E8] text-[#9A6700] dark:bg-[#203650] dark:text-[#F6C453]"
                  }`}>
                    {todayAbsensi.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-[#0F1E36] dark:text-white truncate">
                      {todayAbsensi.length > 0 ? "Presensi Hari Ini Selesai" : "Presensi Belum Lengkap"}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal truncate">
                      {todayAbsensi.length > 0 ? (
                        <>
                          <span className="font-numeric font-semibold">{todayAbsensi.length}</span> siswa telah diabsen
                        </>
                      ) : (
                        "Input presensi kelas aktif Anda"
                      )}
                    </p>
                  </div>
                </div>

                {todayAbsensi.length === 0 && (
                  <button
                    onClick={() => onNavigate("absensi")}
                    className="px-2.5 py-1 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                  >
                    Isi
                  </button>
                )}
              </div>

              {/* Checklist 2: Penilaian */}
              <div className="p-3.5 rounded-2xl bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    nilaiList.length > 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-[#FFF8E8] text-[#9A6700] dark:bg-[#203650] dark:text-[#F6C453]"
                  }`}>
                    {nilaiList.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-[#0F1E36] dark:text-white truncate">
                      {nilaiList.length > 0 ? "Rekap Penilaian Aktif" : "Penilaian Belum Terdata"}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal truncate">
                      {nilaiList.length > 0 ? (
                        <>
                          <span className="font-numeric font-semibold">{nilaiList.length}</span> nilai formatif/sumatif
                        </>
                      ) : (
                        "Input nilai tugas harian siswa"
                      )}
                    </p>
                  </div>
                </div>

                {nilaiList.length === 0 && (
                  <button
                    onClick={() => onNavigate("penilaian")}
                    className="px-2.5 py-1 rounded-lg bg-[#F4B400] hover:bg-[#FFD66B] text-[#0F1E36] text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    Input
                  </button>
                )}
              </div>

              {/* Checklist 3: Jurnal Mengajar */}
              <div className="p-3.5 rounded-2xl bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F5FF] text-[#0284C7] dark:bg-[#1D405D] dark:text-[#8DD8FF] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-[#0F1E36] dark:text-white truncate">
                      Jurnal Agenda KBM
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal truncate">
                      Catat progres materi & keterlaksanaan
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate("agenda")}
                  className="px-2.5 py-1 rounded-lg bg-[#E8F5FF] dark:bg-[#1D405D] text-[#0284C7] dark:text-[#8DD8FF] text-[11px] font-semibold shrink-0 hover:bg-[#D9EFFF] cursor-pointer"
                >
                  Tulis
                </button>
              </div>
            </div>
          </div>

          {/* E. Aktivitas Terbaru */}
          <div className="bg-white/95 dark:bg-[#192B43] p-5 sm:p-6 rounded-3xl shadow-xs border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8F5FF] dark:bg-[#1D405D] text-[#0284C7] dark:text-[#67C7FF] flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F1E36] dark:text-white tracking-tight">
                    Aktivitas Terbaru
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal">
                    Catatan sinkronisasi data real-time
                  </p>
                </div>
              </div>
            </div>

            {recentActivities.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#F8FBFE] dark:bg-[#14243A] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] text-center space-y-1.5">
                <p className="text-xs font-semibold text-[#0F1E36] dark:text-[#F0F6FC]">
                  Belum ada aktivitas baru
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#A5B9CF] font-normal">
                  Mulai dengan menginput presensi siswa atau mencatat nilai kelas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                        {act.desc}
                      </p>
                    </div>

                    <span className={`text-[10px] font-numeric font-bold px-2 py-0.5 rounded-full shrink-0 ${act.color}`}>
                      {act.badge}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
