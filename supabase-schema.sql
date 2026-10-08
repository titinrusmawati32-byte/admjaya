-- =======================================================================
-- SKRIP SQL SCHEMA SUPABASE UNTUK APLIKASI ADMINISTRASI GURU (EDADMIN PRO)
-- Salin dan jalankan seluruh isi skrip ini di menu SQL Editor pada Supabase
-- =======================================================================

-- 1. TABEL PENGGUNA & AUTENTIKASI (app_users)
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

-- Index untuk performa query username
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);

-- 2. TABEL DATA SISWA
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

-- 3. TABEL MATA PELAJARAN (mapel)
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

-- 4. TABEL JADWAL MENGAJAR
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
CREATE INDEX IF NOT EXISTS idx_jadwal_user ON public.jadwal(user_uid);

-- 5. TABEL PRESENSI / LOG ABSENSI
CREATE TABLE IF NOT EXISTS public.log_absensi (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    siswa_id TEXT,
    tanggal TEXT NOT NULL,
    status TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_absensi_user ON public.log_absensi(user_uid, tanggal);

-- 6. TABEL DATA NILAI SISWA
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
CREATE INDEX IF NOT EXISTS idx_data_nilai_user ON public.data_nilai(user_uid);

-- 7. TABEL JURNAL AGENDA MENGAJAR
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
CREATE INDEX IF NOT EXISTS idx_jurnal_agenda_user ON public.jurnal_agenda(user_uid);

-- 8. TABEL SISWA BIMBINGAN & WALI
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
CREATE INDEX IF NOT EXISTS idx_siswa_bimbingan_user ON public.siswa_bimbingan(user_uid);

CREATE TABLE IF NOT EXISTS public.bimbingan_wali (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    catatan TEXT DEFAULT '',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bimbingan_wali_user ON public.bimbingan_wali(user_uid);

-- 9. TABEL PENGATURAN SEKOLAH & PROFIL
CREATE TABLE IF NOT EXISTS public.pengaturan (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABEL AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'system',
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    timestamp TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- =======================================================================
-- SETUP ROW LEVEL SECURITY (RLS) & IZIN AKSES SUPABASE ANON
-- Mengizinkan akses public/anon key untuk baca dan tulis aplikasi
-- =======================================================================

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

-- Kebijakan Akses: Allow all via anon key
DROP POLICY IF EXISTS "Anon public access app_users" ON public.app_users;
CREATE POLICY "Anon public access app_users" ON public.app_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access data_siswa" ON public.data_siswa;
CREATE POLICY "Anon public access data_siswa" ON public.data_siswa FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access mapel" ON public.mapel;
CREATE POLICY "Anon public access mapel" ON public.mapel FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access jadwal" ON public.jadwal;
CREATE POLICY "Anon public access jadwal" ON public.jadwal FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access log_absensi" ON public.log_absensi;
CREATE POLICY "Anon public access log_absensi" ON public.log_absensi FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access data_nilai" ON public.data_nilai;
CREATE POLICY "Anon public access data_nilai" ON public.data_nilai FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access jurnal_agenda" ON public.jurnal_agenda;
CREATE POLICY "Anon public access jurnal_agenda" ON public.jurnal_agenda FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access siswa_bimbingan" ON public.siswa_bimbingan;
CREATE POLICY "Anon public access siswa_bimbingan" ON public.siswa_bimbingan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access bimbingan_wali" ON public.bimbingan_wali;
CREATE POLICY "Anon public access bimbingan_wali" ON public.bimbingan_wali FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access pengaturan" ON public.pengaturan;
CREATE POLICY "Anon public access pengaturan" ON public.pengaturan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access audit_logs" ON public.audit_logs;
CREATE POLICY "Anon public access audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =======================================================================
-- SEED DATA AWAL: AKUN KEPALA SEKOLAH (ADMIN) & GURU
-- Password "123" atau "admin123" untuk login pertama
-- =======================================================================

-- Root Admin: admin / 123 (Hash PBKDF2 SHA-512)
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

-- Akun Guru Sample: guru1 / 123
INSERT INTO public.app_users (
    id, user_id, username, password_hash, salt, nama, role, nip, created_by, must_change_password
) VALUES (
    'usr_sample_guru',
    'USR-GURU-01',
    'guru1',
    '8778f8c47b565cb2fc41951594e9f75ec19e782613c7dbbc4f5ee35d0e2e92cbb412e622ef0fbe776f8a5a5cce022131fa462ef5b0e5ee0d984dfab6297371fa',
    'f6ab8167f58cb2e93d395a12ef653066',
    'Guru Pengampu',
    'guru',
    '199203152019032014',
    'system',
    false
) ON CONFLICT (username) DO NOTHING;
