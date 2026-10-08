export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  updatedAt?: number;
}

export interface Mapel {
  id: string;
  namaMapel: string;
  semester: string;
  tahunAjaran: string;
  updatedAt?: number;
}

export interface Jadwal {
  id: string;
  hari: string;
  jam: string;
  kelas: string;
  mapel: string;
  updatedAt?: number;
}

export interface LogAbsensi {
  id: string;
  waktu: string; // YYYY-MM-DD
  tanggal: string;
  kelas: string;
  mapel: string;
  idSiswa: string;
  namaSiswa: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  bulan: string;
  tahun: string;
  namaGuru: string;
  updatedAt?: number;
}

export interface DataNilai {
  id: string;
  waktu: string;
  jenis: string; // e.g. UH1, UTS, UAS, Tugas 1
  mapel: string;
  kelas: string;
  idSiswa: string;
  namaSiswa: string;
  nilai: number | '';
  namaGuru: string;
  updatedAt?: number;
}

export interface JurnalAgenda {
  id: string;
  tanggal: string;
  jam: string;
  kelas: string;
  mapel: string;
  materi: string;
  status: string; // Terlaksana / Tunda
  absenSiswa: string;
  ket?: string;
  namaGuru: string;
  updatedAt?: number;
}

export interface SiswaBimbingan {
  id: string;
  namaSiswa: string;
  kelas: string;
  updatedAt?: number;
}

export interface BimbinganWali {
  id: string;
  tanggal: string;
  namaSiswa: string;
  kelas: string;
  jenis: string; // Akademik, Pribadi, Sosial, Keterampilan
  kasus: string;
  tindakLanjut: string;
  guruWali: string;
  updatedAt?: number;
}

export interface Pengaturan {
  Nama_Guru: string;
  NIP_Guru: string;
  Pemerintah: string;
  Nama_Sekolah: string;
  Alamat_Sekolah: string;
  Nama_Kepsek: string;
  NIP_Kepsek: string;
  Tempat_Tanda_Tangan: string;
  Logo_Kiri: string;
  Logo_Kanan: string;
  username?: string;
  password?: string;
  isDatabaseCleared?: boolean;
}

export type UserRole = "admin" | "guru" | "ROOT_ADMIN" | "GURU";

export interface UserAccount {
  id: string;
  userId?: string;
  nama: string;
  username: string;
  nip?: string;
  role: UserRole;
  status: "active" | "inactive" | "ACTIVE" | "INACTIVE";
  createdBy?: string;
  mustChangePassword?: boolean;
  failedAttempts?: number;
  lockedUntil?: number | null;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSessionUser {
  id: string;
  userId?: string;
  username: string;
  nama: string;
  role: UserRole;
  createdBy?: string;
  mustChangePassword?: boolean;
  nip?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "ACCOUNT_LOCKED" | "USER_CREATED" | "PASSWORD_CHANGED" | "STATUS_CHANGED" | "USER_DELETED" | "DOCUMENT_DELETED" | "DATABASE_RESET";
  actorUsername: string;
  actorRole?: string;
  targetUsername?: string;
  details: string;
  ipAddress?: string;
}

