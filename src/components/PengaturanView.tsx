import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  School, 
  UserCheck, 
  Trash2, 
  ShieldAlert, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Globe,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Pengaturan } from "../types";
import { savePengaturan } from "../lib/firebase";
import { notifySimpanSuccess, notifySimpanError } from "../lib/swal";
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  testSupabaseConnection 
} from "../lib/supabase";

interface PengaturanViewProps {
  config: Pengaturan;
  onNavigateToReset?: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({ config, onNavigateToReset }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });
  const [copiedSql, setCopiedSql] = useState(false);

  const [form, setForm] = useState<Pengaturan>({
    Nama_Guru: "",
    NIP_Guru: "",
    Pemerintah: "PEMERINTAH PROVINSI",
    Nama_Sekolah: "",
    Alamat_Sekolah: "",
    Nama_Kepsek: "",
    NIP_Kepsek: "",
    Tempat_Tanda_Tangan: "",
    Logo_Kiri: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
    Logo_Kanan: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
    username: "www.yefriharyanto.id",
    password: "123456"
  });

  useEffect(() => {
    const sbConfig = getStoredSupabaseConfig();
    setSupabaseUrl(sbConfig.url || "");
    setSupabaseAnonKey(sbConfig.anonKey || "");
  }, []);

  useEffect(() => {
    if (config) {
      setForm({
        Nama_Guru: config.Nama_Guru || "",
        NIP_Guru: config.NIP_Guru || "",
        Pemerintah: config.Pemerintah || "PEMERINTAH PROVINSI",
        Nama_Sekolah: config.Nama_Sekolah || "",
        Alamat_Sekolah: config.Alamat_Sekolah || "",
        Nama_Kepsek: config.Nama_Kepsek || "",
        NIP_Kepsek: config.NIP_Kepsek || "",
        Tempat_Tanda_Tangan: config.Tempat_Tanda_Tangan || "",
        Logo_Kiri: config.Logo_Kiri || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
        Logo_Kanan: config.Logo_Kanan || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
        username: config.username || "www.yefriharyanto.id",
        password: config.password || "123456"
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePengaturan(form);
      notifySimpanSuccess("Pengaturan profil & kredensial akun tersimpan ke Firebase!");
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan pengaturan.");
    }
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      notifySimpanError("Harap masukkan URL Supabase dan Anon/Public Key terlebih dahulu.");
      return;
    }
    setSupabaseTesting(true);
    try {
      const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
      setSupabaseStatus({
        tested: true,
        success: res.success,
        message: res.message
      });
      if (res.success) {
        notifySimpanSuccess(res.message);
      } else {
        notifySimpanError(res.message);
      }
    } catch (err: any) {
      setSupabaseStatus({
        tested: true,
        success: false,
        message: err.message || "Gagal menghubungi Supabase."
      });
      notifySimpanError(err.message || "Gagal menghubungi Supabase.");
    } finally {
      setSupabaseTesting(false);
    }
  };

  const handleSaveSupabase = () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      notifySimpanError("Harap masukkan URL Supabase dan Anon/Public Key sebelum menyimpan.");
      return;
    }
    saveStoredSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      enabled: true
    });
    notifySimpanSuccess("Konfigurasi Supabase berhasil disimpan! Database aktif untuk semua pengguna.");
  };

  const handleCopySql = () => {
    const sqlText = `-- =======================================================================
-- SKRIP SQL SCHEMA SUPABASE UNTUK APLIKASI ADMINISTRASI GURU (EDADMIN PRO)
-- Salin dan jalankan seluruh isi skrip ini di menu SQL Editor pada Supabase
-- =======================================================================

CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guru',
    nip TEXT DEFAULT '',
    created_by TEXT DEFAULT 'system',
    must_change_password BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);

CREATE TABLE IF NOT EXISTS public.data_siswa (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    nama TEXT NOT NULL,
    nis TEXT DEFAULT '',
    nisn TEXT DEFAULT '',
    kelas TEXT DEFAULT '',
    jenis_kelamin TEXT DEFAULT 'L',
    status TEXT DEFAULT 'Aktif',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_siswa_user ON public.data_siswa(user_uid);

CREATE TABLE IF NOT EXISTS public.mapel (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    nama TEXT NOT NULL,
    kode TEXT DEFAULT '',
    kkm NUMERIC DEFAULT 75,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mapel_user ON public.mapel(user_uid);

CREATE TABLE IF NOT EXISTS public.jadwal (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    hari TEXT NOT NULL,
    kelas TEXT NOT NULL,
    jam_ke TEXT DEFAULT '',
    mapel TEXT DEFAULT '',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.log_absensi (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    siswa_id TEXT,
    tanggal TEXT NOT NULL,
    status TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_nilai (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    siswa_id TEXT,
    mapel_id TEXT,
    jenis_nilai TEXT DEFAULT 'Tugas',
    nilai NUMERIC DEFAULT 0,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jurnal_agenda (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    kelas TEXT NOT NULL,
    materi TEXT DEFAULT '',
    catatan TEXT DEFAULT '',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.siswa_bimbingan (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    siswa_id TEXT,
    tanggal TEXT NOT NULL,
    masalah TEXT DEFAULT '',
    tindakan TEXT DEFAULT '',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bimbingan_wali (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    catatan TEXT DEFAULT '',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pengaturan (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'system',
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa_bimbingan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bimbingan_wali ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon public access app_users" ON public.app_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access data_siswa" ON public.data_siswa FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access mapel" ON public.mapel FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access jadwal" ON public.jadwal FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access log_absensi" ON public.log_absensi FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access data_nilai" ON public.data_nilai FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access jurnal_agenda" ON public.jurnal_agenda FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access siswa_bimbingan" ON public.siswa_bimbingan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access bimbingan_wali" ON public.bimbingan_wali FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access pengaturan" ON public.pengaturan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- INITIAL SEED: Admin: admin / 123
INSERT INTO public.app_users (
    id, user_id, username, password_hash, salt, nama, role, nip, created_by, must_change_password
) VALUES (
    'usr_root_admin',
    'USR-ADMIN-01',
    'admin',
    '8778f8c47b565cb2fc41951594e9f75ec19e782613c7dbbc4f5ee35d0e2e92cbb412e622ef0fbe776f8a5a5cce022131fa462ef5b0e5ee0d984dfab6297371fa',
    'f6ab8167f58cb2e93d395a12ef653066',
    'Administrator / Kepala Sekolah',
    'admin',
    '198501012010011001',
    'system',
    false
) ON CONFLICT (username) DO NOTHING;
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    notifySimpanSuccess("Skrip SQL Supabase berhasil disalin ke clipboard! Buka SQL Editor di Supabase lalu tempel (paste) dan klik RUN.");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
            <Settings className="w-5 h-5 text-blue-600" />
            Pengaturan Profil Guru & Kop Sekolah
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Data ini digunakan secara otomatis pada Kop Surat Laporan PDF, Kartu Pelajar, dan Nama Penandatangan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Identitas Guru */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4" />
                Identitas Guru Pengampu
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Guru Lengkap & Gelar</label>
                <input
                  type="text"
                  id="Nama_Guru"
                  value={form.Nama_Guru}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso, S.Pd., M.Pd."
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">NIP Guru</label>
                <input
                  type="text"
                  id="NIP_Guru"
                  value={form.NIP_Guru}
                  onChange={handleChange}
                  placeholder="19900101 201501 1 002"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-numeric font-medium"
                />
              </div>
            </div>

            {/* Box 2: Identitas Kepsek */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <UserCheck className="w-4 h-4" />
                Identitas Kepala Sekolah
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  id="Nama_Kepsek"
                  value={form.Nama_Kepsek}
                  onChange={handleChange}
                  placeholder="Nama & Gelar Kepala Sekolah"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  id="NIP_Kepsek"
                  value={form.NIP_Kepsek}
                  onChange={handleChange}
                  placeholder="NIP Kepala Sekolah"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-numeric font-medium"
                />
              </div>
            </div>
          </div>

          {/* Box 3: Identitas Sekolah & Kop Surat */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <School className="w-4 h-4" />
              Identitas Sekolah & Kop Surat Laporan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Pemerintah Prov / Kab / Kota</label>
                <input
                  type="text"
                  id="Pemerintah"
                  value={form.Pemerintah}
                  onChange={handleChange}
                  placeholder="PEMERINTAH PROVINSI / KABUPATEN"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Resmi Sekolah</label>
                <input
                  type="text"
                  id="Nama_Sekolah"
                  value={form.Nama_Sekolah}
                  onChange={handleChange}
                  placeholder="SMA NEGERI 1 KOTA"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Alamat Lengkap & Telepon Sekolah</label>
                <input
                  type="text"
                  id="Alamat_Sekolah"
                  value={form.Alamat_Sekolah}
                  onChange={handleChange}
                  placeholder="Jalan Pendidikan No. 1, Telp: 021-xxxxxx"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Kota / Tempat Tanda Tangan Laporan</label>
                <input
                  type="text"
                  id="Tempat_Tanda_Tangan"
                  value={form.Tempat_Tanda_Tangan}
                  onChange={handleChange}
                  placeholder="Contoh: Bandung / Jakarta"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">URL Logo Sekolah (Opsional)</label>
                <input
                  type="text"
                  id="Logo_Kanan"
                  value={form.Logo_Kanan}
                  onChange={handleChange}
                  placeholder="Link gambar HTTPS logo"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Box 4: Akses Keamanan & Autentikasi Pengguna */}
          <div className="p-5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-4">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-2 border-b border-blue-200 dark:border-blue-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Status Sistem Keamanan & Autentikasi Internal Sekolah
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Autentikasi aplikasi terproteksi menggunakan <strong className="font-semibold text-slate-800 dark:text-slate-200">Username & Password Terenkripsi (PBKDF2 SHA-512 + Salt)</strong> dengan 2 Peran Resmi: <strong className="font-semibold text-slate-800 dark:text-slate-200">Kepala Sekolah (Admin Utama)</strong> dan <strong className="font-semibold text-slate-800 dark:text-slate-200">Guru (User)</strong>. Seluruh pembuatan dan manajemen akun dikelola terpusat oleh Kepala Sekolah.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Metode Login Aktif</span>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Kredensial Resmi Sekolah (Username & Password)</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Koneksi Database Cloud</span>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Firestore Spark Plan (Auto-Sync)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Box Supabase: Integrasi Database Supabase (PostgreSQL Cloud) */}
          <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-800 pb-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Konfigurasi Database Cloud Supabase (PostgreSQL)
              </h3>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  supabaseUrl && supabaseAnonKey
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    supabaseUrl && supabaseAnonKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`} />
                  {supabaseUrl && supabaseAnonKey ? 'Supabase Dikonfigurasi' : 'Belum Terhubung'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Database Supabase (PostgreSQL) memungkinkan aplikasi diakses oleh siapapun yang memiliki akun/username dari berbagai perangkat (laptop, HP, komputer sekolah) secara online tanpa batas.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="Contoh: https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Supabase Anon / Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="Contoh: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              {supabaseStatus.tested && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  supabaseStatus.success
                    ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200'
                    : 'bg-rose-100/70 border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200'
                }`}>
                  {supabaseStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{supabaseStatus.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={supabaseTesting}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseTesting ? 'animate-spin' : ''}`} />
                  <span>{supabaseTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSupabase}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Kredensial Supabase</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedSql ? 'Skrip SQL Tersalin!' : 'Salin Skrip SQL Supabase'}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-emerald-700 dark:text-emerald-300 hover:underline text-xs font-medium flex items-center gap-1 ml-auto"
                >
                  <span>Buka Dashboard Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>


          {/* Box 5: Informasi & Kredit Pengembang */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/60 dark:to-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Informasi Aplikasi & Kredit Pengembang
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight font-app-name">Aplikasi Administrasi Guru (EdAdmin Pro)</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-normal">
                  Platform Administrasi Guru, Presensi QR, Leger Nilai & Jurnal Mengajar Terpadu
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full font-semibold text-[11px]">
                  Created by Yefri Haryanto
                </span>
                <div className="mt-1">
                  <a
                    href="https://www.yefriharyanto.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 font-numeric text-xs hover:underline font-semibold"
                  >
                    www.yefriharyanto.id
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-xs flex items-center space-x-2 shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan ke Firebase</span>
            </button>
          </div>
        </form>

        {/* Zona Bahaya / Reset Total */}
        {onNavigateToReset && (
          <div className="pt-6 border-t border-red-200 dark:border-red-900/50 space-y-3">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/40">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  ZONA BAHAYA: Hapus / Kosongkan Semua Isi Database
                </h4>
                <p className="text-[11px] text-red-700 dark:text-red-300 font-normal">
                  Hapus secara permanen seluruh siswa, absensi, nilai, agenda, bimbingan, dan data sekolah untuk digunakan dari nol.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToReset}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Buka Menu Hapus Database</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
