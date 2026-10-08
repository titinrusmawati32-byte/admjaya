import React, { useState, useEffect } from "react";
import { 
  PieChart, 
  GraduationCap, 
  Printer,
  Clock, 
  ClipboardCheck, 
  Star, 
  Calendar, 
  HeartHandshake, 
  Settings,
  ChevronRight,
  X,
  SlidersHorizontal
} from "lucide-react";
import { AppShell } from "./components/AppShell";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./components/DashboardView";
import { KelolaSiswaView } from "./components/KelolaSiswaView";
import { CetakKartuQRView } from "./components/CetakKartuQRView";
import { KelolaMapelView } from "./components/KelolaMapelView";
import { JadwalMengajarView } from "./components/JadwalMengajarView";
import { InputAbsensiView } from "./components/InputAbsensiView";
import { InputPenilaianView } from "./components/InputPenilaianView";
import { AgendaMengajarView } from "./components/AgendaMengajarView";
import { BimbinganWaliView } from "./components/BimbinganWaliView";
import { PusatLaporanView } from "./components/PusatLaporanView";
import { PengaturanView } from "./components/PengaturanView";
import { ResetDatabaseView } from "./components/ResetDatabaseView";
import { LoginView } from "./components/LoginView";
import { ManajemenAkunView } from "./components/ManajemenAkunView";
import { ForceChangePasswordModal } from "./components/ForceChangePasswordModal";
import { useTheme } from "./context/ThemeContext";
import { apiVerifySession, getStoredUser, setStoredUser } from "./lib/authApi";

import { 
  subscribeCollection, 
  subscribePengaturan, 
  batchSaveDocuments, 
  savePengaturan,
  logOut,
  getCurrentUserUid,
  COLLECTIONS 
} from "./lib/firebase";


import { 
  Siswa, 
  Mapel, 
  Jadwal, 
  LogAbsensi, 
  DataNilai, 
  JurnalAgenda, 
  SiswaBimbingan, 
  BimbinganWali, 
  Pengaturan 
} from "./types";

const DEFAULT_CONFIG: Pengaturan = {
  Nama_Guru: "Drs. Yefri Haryanto, M.Pd.",
  NIP_Guru: "19850312 201001 1 008",
  Pemerintah: "PEMERINTAH PROVINSI JAMBI",
  Nama_Sekolah: "SMP NEGERI 3 KERINCI",
  Alamat_Sekolah: "Jalan Raya Lintas Sungai Penuh, Telp: (0748) 21102",
  Nama_Kepsek: "Hamdani, S.Pd., M.Si.",
  NIP_Kepsek: "19780514 200212 1 003",
  Tempat_Tanda_Tangan: "Kerinci",
  Logo_Kiri: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
  Logo_Kanan: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU"
};

// Sub-Menu Categories Definitions for Complete Android Navigation
const AKADEMIK_ITEMS = [
  { id: "jadwal", label: "Jadwal Mengajar", icon: Clock, desc: "Kelola & cetak jadwal pelajaran" },
  { id: "absensi", label: "Input Absensi", icon: ClipboardCheck, desc: "Pencatatan kehadiran harian siswa" },
  { id: "penilaian", label: "Input Penilaian", icon: Star, desc: "Rekap & input nilai formatif/sumatif" },
  { id: "agenda", label: "Agenda Mengajar", icon: Calendar, desc: "Jurnal kegiatan belajar harian guru" },
  { id: "bimbingan", label: "Bimbingan Guru Wali", icon: HeartHandshake, desc: "Catatan bimbingan & konseling wali kelas" },
];

const LAPORAN_ITEMS = [
  { id: "laporan", label: "Pusat Laporan", icon: Printer, desc: "Cetak Rekap Absensi, Leger & Jurnal PDF" },
  { id: "pengaturan", label: "Pengaturan Profil & Kop", icon: Settings, desc: "Atur data guru, sekolah & kop dokumen" },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("edadmin_auth_token"));
  });
  const [currentUid, setCurrentUid] = useState<string>(() => getCurrentUserUid());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeCategorySheet, setActiveCategorySheet] = useState<"akademik" | "laporan" | null>(null);
  const { isDark, toggleTheme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);

  // Firestore Data Collections
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [absensiList, setAbsensiList] = useState<LogAbsensi[]>([]);
  const [nilaiList, setNilaiList] = useState<DataNilai[]>([]);
  const [agendaList, setAgendaList] = useState<JurnalAgenda[]>([]);
  const [siswaBimbinganList, setSiswaBimbinganList] = useState<SiswaBimbingan[]>([]);
  const [bimbinganList, setBimbinganList] = useState<BimbinganWali[]>([]);
  const [config, setConfig] = useState<Pengaturan>(DEFAULT_CONFIG);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("edadmin_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Verify session on startup
  useEffect(() => {
    const verify = async () => {
      const res = await apiVerifySession();
      if (res.valid && res.user) {
        setIsAuthenticated(true);
        setCurrentUser(res.user);
        setCurrentUid(res.user.id);
      } else {
        const cachedUser = getStoredUser();
        if (cachedUser && localStorage.getItem("edadmin_auth_token")) {
          setIsAuthenticated(true);
          setCurrentUser(cachedUser);
          setCurrentUid(cachedUser.id);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      }
    };
    verify();
  }, []);

  // Subscribe to Firebase real-time collections for the active user account ID

  useEffect(() => {
    if (!isAuthenticated || !currentUid) return;

    // Reset current lists while switching / fetching user database
    setSiswaList([]);
    setMapelList([]);
    setJadwalList([]);
    setAbsensiList([]);
    setNilaiList([]);
    setAgendaList([]);
    setSiswaBimbinganList([]);
    setBimbinganList([]);

    let unsubs: Array<() => void> = [];

    unsubs.push(subscribeCollection<Siswa>(COLLECTIONS.SISWA, (data) => {
      setSiswaList(data);
      setIsConnected(true);
    }, currentUid));

    unsubs.push(subscribeCollection<Mapel>(COLLECTIONS.MAPEL, (data) => {
      setMapelList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<Jadwal>(COLLECTIONS.JADWAL, (data) => {
      setJadwalList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<LogAbsensi>(COLLECTIONS.LOG_ABSENSI, (data) => {
      setAbsensiList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<DataNilai>(COLLECTIONS.DATA_NILAI, (data) => {
      setNilaiList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<JurnalAgenda>(COLLECTIONS.JURNAL_AGENDA, (data) => {
      setAgendaList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<SiswaBimbingan>(COLLECTIONS.SISWA_BIMBINGAN, (data) => {
      setSiswaBimbinganList(data);
    }, currentUid));

    unsubs.push(subscribeCollection<BimbinganWali>(COLLECTIONS.BIMBINGAN_WALI, (data) => {
      setBimbinganList(data);
    }, currentUid));

    unsubs.push(subscribePengaturan((cfg) => {
      if (cfg && Object.keys(cfg).length > 0) {
        setConfig((prev) => ({ ...prev, ...cfg }));
      }
    }, currentUid));

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, currentUid]);

  // Seed initial sample data for new user if user's database is empty
  useEffect(() => {
    if (!isAuthenticated || !currentUid) return;

    const seedInitialData = async () => {
      // Do not re-seed sample data if database was explicitly cleared/wiped by this user
      if (
        localStorage.getItem(`edadmin_database_cleared_${currentUid}`) === "true" ||
        config?.isDatabaseCleared === true
      ) {
        return;
      }

      // Seed Siswa if empty
      if (siswaList.length === 0 && isConnected) {
        const sampleSiswa: Siswa[] = [
          { id: "1001", nisn: "0012345678", nama: "Ahmad Fulan", kelas: "VII A" },
          { id: "1002", nisn: "0012345679", nama: "Siti Aminah", kelas: "VII A" },
          { id: "1003", nisn: "0012345680", nama: "Budi Pratama", kelas: "VII B" },
          { id: "1004", nisn: "0012345681", nama: "Rizky Febrian", kelas: "VII B" }
        ];
        await batchSaveDocuments(COLLECTIONS.SISWA, sampleSiswa, currentUid);
      }

      // Seed Mapel if empty
      if (mapelList.length === 0 && isConnected) {
        const sampleMapel: Mapel[] = [
          { id: "m1", namaMapel: "Informatika", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m2", namaMapel: "Matematika", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m3", namaMapel: "Bahasa Indonesia", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m4", namaMapel: "IPA Terpadu", semester: "Ganjil", tahunAjaran: "2026/2027" }
        ];
        await batchSaveDocuments(COLLECTIONS.MAPEL, sampleMapel, currentUid);
      }

      // Seed Jadwal if empty
      if (jadwalList.length === 0 && isConnected) {
        const sampleJadwal: Jadwal[] = [
          { id: "j1", hari: "Senin", jam: "07:30 - 09:00", kelas: "VII A", mapel: "Informatika" },
          { id: "j2", hari: "Selasa", jam: "09:15 - 10:45", kelas: "VII B", mapel: "Informatika" }
        ];
        await batchSaveDocuments(COLLECTIONS.JADWAL, sampleJadwal, currentUid);
      }

      // Save initial config personalized to logged-in user if empty
      if (!config.Nama_Guru && isConnected) {
        let defaultName = DEFAULT_CONFIG.Nama_Guru;
        try {
          const userRaw = localStorage.getItem("edadmin_user");
          if (userRaw) {
            const userObj = JSON.parse(userRaw);
            if (userObj.nama || userObj.name) defaultName = userObj.nama || userObj.name;
          }
        } catch {}

        await savePengaturan({
          ...DEFAULT_CONFIG,
          Nama_Guru: defaultName
        }, currentUid);
      }

    };

    seedInitialData();
  }, [isAuthenticated, currentUid, isConnected, siswaList.length, mapelList.length, jadwalList.length, config.Nama_Guru, config.isDatabaseCleared]);

  const handleSuccessReset = () => {
    if (currentUid) {
      localStorage.setItem(`edadmin_database_cleared_${currentUid}`, "true");
    }
    setConfig((prev) => ({ ...prev, isDatabaseCleared: true }));
    setSiswaList([]);
    setMapelList([]);
    setJadwalList([]);
    setAbsensiList([]);
    setNilaiList([]);
    setAgendaList([]);
    setSiswaBimbinganList([]);
    setBimbinganList([]);
  };

  const handleLogout = async () => {
    await logOut();
    setSiswaList([]);
    setMapelList([]);
    setJadwalList([]);
    setAbsensiList([]);
    setNilaiList([]);
    setAgendaList([]);
    setSiswaBimbinganList([]);
    setBimbinganList([]);
    setIsConnected(false);
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (user?.id) setCurrentUid(user.id);
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDark}
        onToggleDarkMode={toggleTheme}
      />
    );
  }

  return (
    <>
      {/* Mandatory First-Time Password Change for Teachers */}
      {currentUser?.mustChangePassword && (
        <ForceChangePasswordModal
          isOpen={true}
          username={currentUser.username}
          onSuccess={() => {
            setCurrentUser((prev: any) => ({ ...prev, mustChangePassword: false }));
          }}
        />
      )}

      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        config={config}
        currentUser={currentUser}
        onLogout={handleLogout}
      >
        {/* Main View Container */}
        <div className="w-full">
          {activeTab === "dashboard" && (
            <DashboardView
              siswaList={siswaList}
              mapelList={mapelList}
              absensiList={absensiList}
              nilaiList={nilaiList}
              jadwalList={jadwalList}
              agendaList={agendaList}
              currentUser={currentUser}
              config={config}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "siswa" && <KelolaSiswaView siswaList={siswaList} />}
          {activeTab === "kartu" && <CetakKartuQRView siswaList={siswaList} config={config} />}
          {activeTab === "mapel" && <KelolaMapelView mapelList={mapelList} />}
          {activeTab === "jadwal" && <JadwalMengajarView jadwalList={jadwalList} mapelList={mapelList} siswaList={siswaList} />}
          {activeTab === "absensi" && <InputAbsensiView siswaList={siswaList} mapelList={mapelList} absensiList={absensiList} config={config} />}
          {activeTab === "penilaian" && <InputPenilaianView siswaList={siswaList} mapelList={mapelList} nilaiList={nilaiList} config={config} />}
          {activeTab === "agenda" && <AgendaMengajarView agendaList={agendaList} mapelList={mapelList} siswaList={siswaList} config={config} />}
          {activeTab === "bimbingan" && <BimbinganWaliView bimbinganList={bimbinganList} siswaBimbinganList={siswaBimbinganList} siswaList={siswaList} config={config} />}
          {activeTab === "laporan" && (
            <PusatLaporanView
              siswaList={siswaList}
              mapelList={mapelList}
              absensiList={absensiList}
              nilaiList={nilaiList}
              agendaList={agendaList}
              bimbinganList={bimbinganList}
              config={config}
            />
          )}
          {activeTab === "manajemen_akun" && (
            currentUser?.role === "admin" ? (
              <ManajemenAkunView />
            ) : (
              <DashboardView
                siswaList={siswaList}
                mapelList={mapelList}
                absensiList={absensiList}
                nilaiList={nilaiList}
                jadwalList={jadwalList}
                agendaList={agendaList}
                currentUser={currentUser}
                config={config}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )
          )}
          {activeTab === "pengaturan" && <PengaturanView config={config} onNavigateToReset={() => setActiveTab("resetdb")} />}
          {activeTab === "resetdb" && <ResetDatabaseView onSuccessReset={handleSuccessReset} />}
        </div>
      </AppShell>
    </>
  );
}

