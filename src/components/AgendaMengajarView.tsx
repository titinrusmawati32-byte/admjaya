import React, { useState } from "react";
import { Calendar, Plus, Trash2, Pencil, X, Save, CheckCircle2, History, Search, Filter } from "lucide-react";
import { JurnalAgenda, Mapel, Siswa, Pengaturan } from "../types";
import { saveDocument, deleteDocument, COLLECTIONS } from "../lib/firebase";
import { 
  notifySimpanSuccess, 
  notifySimpanError, 
  notifyEditSuccess, 
  notifyEditError, 
  notifyHapusSuccess, 
  notifyHapusError, 
  confirmDeleteAlert 
} from "../lib/swal";

interface AgendaMengajarViewProps {
  agendaList: JurnalAgenda[];
  mapelList: Mapel[];
  siswaList: Siswa[];
  config: Pengaturan;
}

export const AgendaMengajarView: React.FC<AgendaMengajarViewProps> = ({
  agendaList,
  mapelList,
  siswaList,
  config
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"input" | "rekap">("input");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [jam, setJam] = useState<string>("1-2");
  const [kelas, setKelas] = useState<string>("");
  const [mapel, setMapel] = useState<string>("");
  const [materi, setMateri] = useState<string>("");
  const [status, setStatus] = useState<string>("Terlaksana");
  const [absenSiswa, setAbsenSiswa] = useState<string>("Nihil");
  const [ket, setKet] = useState<string>("");

  // Edit Agenda Modal State
  const [editingAgenda, setEditingAgenda] = useState<JurnalAgenda | null>(null);
  const [editTanggal, setEditTanggal] = useState("");
  const [editJam, setEditJam] = useState("");
  const [editKelas, setEditKelas] = useState("");
  const [editMapel, setEditMapel] = useState("");
  const [editMateri, setEditMateri] = useState("");
  const [editStatus, setEditStatus] = useState("Terlaksana");
  const [editAbsenSiswa, setEditAbsenSiswa] = useState("");
  const [editKet, setEditKet] = useState("");

  // Rekap Filters & Inline Row Edit State
  const [rekapKelasFilter, setRekapKelasFilter] = useState("");
  const [rekapMapelFilter, setRekapMapelFilter] = useState("");
  const [rekapStatusFilter, setRekapStatusFilter] = useState("");
  const [rekapSearchFilter, setRekapSearchFilter] = useState("");

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<JurnalAgenda | null>(null);

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();

  const handleStartEditModal = (a: JurnalAgenda) => {
    setEditingAgenda(a);
    setEditTanggal(a.tanggal);
    setEditJam(a.jam);
    setEditKelas(a.kelas);
    setEditMapel(a.mapel);
    setEditMateri(a.materi);
    setEditStatus(a.status || "Terlaksana");
    setEditAbsenSiswa(a.absenSiswa || "");
    setEditKet(a.ket || "");
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgenda) return;

    if (!editTanggal || !editKelas || !editMapel || !editMateri.trim()) {
      notifyEditError("Silakan isi Tanggal, Kelas, Mapel, dan Materi Pembelajaran.");
      return;
    }

    const updated: JurnalAgenda = {
      ...editingAgenda,
      tanggal: editTanggal,
      jam: editJam.trim(),
      kelas: editKelas,
      mapel: editMapel,
      materi: editMateri.trim(),
      status: editStatus,
      absenSiswa: editAbsenSiswa.trim(),
      ket: editKet.trim()
    };

    try {
      await saveDocument(COLLECTIONS.JURNAL_AGENDA, editingAgenda.id, updated);
      setEditingAgenda(null);
      notifyEditSuccess("Jurnal agenda berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui agenda.");
    }
  };

  const handleAddAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelas || !mapel || !materi.trim()) {
      notifySimpanError("Silakan isi Kelas, Mapel, dan Materi Pembelajaran.");
      return;
    }

    const id = Date.now().toString();
    const newAgenda: JurnalAgenda = {
      id,
      tanggal,
      jam: jam.trim(),
      kelas,
      mapel,
      materi: materi.trim(),
      status,
      absenSiswa: absenSiswa.trim(),
      ket: ket.trim(),
      namaGuru: config.Nama_Guru || "Guru"
    };

    try {
      await saveDocument(COLLECTIONS.JURNAL_AGENDA, id, newAgenda);
      setMateri("");
      setKet("");
      notifySimpanSuccess("Jurnal agenda harian tersimpan ke Firebase!");
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan agenda.");
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteAgenda = async (id: string) => {
    if (deletingId) return;

    const item = agendaList.find((a) => a.id === id);
    const detailText = item ? `Agenda: ${item.tanggal} (Kelas ${item.kelas}, ${item.mapel}) - Materi: ${item.materi}` : "Jurnal agenda mengajar ini";

    const isConfirmed = await confirmDeleteAlert(
      "Hapus Jurnal Agenda?",
      `${detailText} akan dihapus secara permanen dari server database dan tidak dapat dikembalikan.`,
      "Ya, Hapus Permanen"
    );
    if (isConfirmed) {
      setDeletingId(id);
      try {
        await deleteDocument(COLLECTIONS.JURNAL_AGENDA, id, undefined, {
          label: "Jurnal Agenda Mengajar",
          details: detailText
        });
        notifyHapusSuccess("Jurnal agenda berhasil dihapus permanen.");
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus agenda dari server.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Inline Row Edit handlers
  const handleStartRowEdit = (item: JurnalAgenda) => {
    setEditingRowId(item.id);
    setEditRowData({ ...item });
  };

  const handleSaveRowEdit = async (id: string) => {
    if (!editRowData) return;
    try {
      await saveDocument(COLLECTIONS.JURNAL_AGENDA, id, editRowData);
      setEditingRowId(null);
      setEditRowData(null);
      notifyEditSuccess("Jurnal agenda berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui agenda.");
    }
  };

  // Filtered Rekap List
  const filteredAgendaList = agendaList.filter((a) => {
    const matchKelas = !rekapKelasFilter || a.kelas === rekapKelasFilter;
    const matchMapel = !rekapMapelFilter || a.mapel === rekapMapelFilter;
    const matchStatus = !rekapStatusFilter || a.status === rekapStatusFilter;
    const matchSearch = !rekapSearchFilter || a.materi.toLowerCase().includes(rekapSearchFilter.toLowerCase());
    return matchKelas && matchMapel && matchStatus && matchSearch;
  });

  // Rekap Stats
  const totalAgenda = agendaList.length;
  const totalTerlaksana = agendaList.filter((a) => a.status === "Terlaksana").length;
  const totalTunda = agendaList.filter((a) => a.status === "Tunda").length;

  return (
    <div className="space-y-6">
      {/* Sub-menu Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-x-1">
        <button
          onClick={() => setActiveSubTab("input")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "input"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Input Jurnal Agenda</span>
        </button>
        <button
          onClick={() => setActiveSubTab("rekap")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "rekap"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat & Rekapitulasi Agenda</span>
          {agendaList.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-numeric font-bold">
              {agendaList.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "input" ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Calendar className="w-5 h-5 text-blue-600" />
              Jurnal Agenda Mengajar Harian
            </h2>
            <p className="text-xs text-slate-500 font-normal">Catat keterlaksanaan materi harian, jam ke, dan kendala siswa.</p>
          </div>

          <form
            onSubmit={handleAddAgenda}
            className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tanggal *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none font-numeric font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Jam Ke *</label>
              <input
                type="text"
                placeholder="Contoh: 1 - 2"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                className="w-full px-3 py-2 text-xs font-numeric font-medium border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Kelas *</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none cursor-pointer"
                required
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Mata Pelajaran *</label>
              <select
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none cursor-pointer"
                required
              >
                <option value="">Pilih Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Materi Pembelajaran *</label>
              <input
                type="text"
                placeholder="Detail materi atau modul yang diajarkan"
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                className="w-full px-3 py-2 text-xs font-normal border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Keterlaksanaan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none cursor-pointer"
              >
                <option value="Terlaksana">Terlaksana</option>
                <option value="Tunda">Tunda</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Absen Siswa</label>
              <input
                type="text"
                placeholder="Nihil / Nama siswa"
                value={absenSiswa}
                onChange={(e) => setAbsenSiswa(e.target.value)}
                className="w-full px-3 py-2 text-xs font-normal border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Keterangan / Catatan Tambahan</label>
              <input
                type="text"
                placeholder="Opsional (misal: diskusi kelompok lancar)"
                value={ket}
                onChange={(e) => setKet(e.target.value)}
                className="w-full px-3 py-2 text-xs font-normal border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Jurnal</span>
              </button>
            </div>
          </form>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3 text-center">Jam</th>
                  <th className="p-3 text-center">Kelas & Mapel</th>
                  <th className="p-3">Materi Pembelajaran</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Absen</th>
                  <th className="p-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {agendaList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-normal">
                      Belum ada jurnal agenda mengajar.
                    </td>
                  </tr>
                ) : (
                  agendaList.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-3 font-numeric font-medium whitespace-nowrap">{a.tanggal}</td>
                      <td className="p-3 text-center font-numeric font-semibold">{a.jam}</td>
                      <td className="p-3 text-center font-bold">
                        <span className="bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          {a.kelas} - {a.mapel}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{a.materi}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            a.status === "Terlaksana"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-normal">{a.absenSiswa || "-"}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleStartEditModal(a)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Jurnal Agenda"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgenda(a.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Riwayat & Rekapitulasi Jurnal Agenda View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
              <History className="w-5 h-5 text-blue-600" />
              Riwayat & Rekapitulasi Jurnal Agenda
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Rekapitulasi lengkap seluruh jurnal mengajar. Anda dapat mengedit, menyimpan pembaruan, atau menghapus entri.
            </p>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Jurnal</p>
              <p className="text-lg font-numeric font-extrabold text-slate-900 dark:text-white tracking-tight">{totalAgenda}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Terlaksana</p>
              <p className="text-lg font-numeric font-extrabold text-emerald-800 dark:text-emerald-200 tracking-tight">{totalTerlaksana}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Tertunda</p>
              <p className="text-lg font-numeric font-extrabold text-amber-800 dark:text-amber-200 tracking-tight">{totalTunda}</p>
            </div>
          </div>

          {/* Rekap Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
              <select
                value={rekapKelasFilter}
                onChange={(e) => setRekapKelasFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Semua Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Mapel</label>
              <select
                value={rekapMapelFilter}
                onChange={(e) => setRekapMapelFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Semua Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Status</label>
              <select
                value={rekapStatusFilter}
                onChange={(e) => setRekapStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Semua Status</option>
                <option value="Terlaksana">Terlaksana</option>
                <option value="Tunda">Tunda</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Materi</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik materi..."
                  value={rekapSearchFilter}
                  onChange={(e) => setRekapSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Table with Edit, Simpan, Hapus */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3 text-center">Jam</th>
                  <th className="p-3 text-center">Kelas & Mapel</th>
                  <th className="p-3">Materi Pembelajaran</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Absen</th>
                  <th className="p-3 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAgendaList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada data jurnal agenda ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAgendaList.map((item, idx) => {
                    const isEditing = editingRowId === item.id;

                    if (isEditing && editRowData) {
                      return (
                        <tr key={item.id} className="bg-blue-50/70 dark:bg-blue-950/40">
                          <td className="p-3 text-center font-bold text-blue-600">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={editRowData.tanggal}
                              onChange={(e) => setEditRowData({ ...editRowData, tanggal: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-32"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={editRowData.jam}
                              onChange={(e) => setEditRowData({ ...editRowData, jam: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none text-center w-16"
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-1">
                              <input
                                type="text"
                                placeholder="Kelas"
                                value={editRowData.kelas}
                                onChange={(e) => setEditRowData({ ...editRowData, kelas: e.target.value })}
                                className="px-1.5 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-16 text-center"
                              />
                              <input
                                type="text"
                                placeholder="Mapel"
                                value={editRowData.mapel}
                                onChange={(e) => setEditRowData({ ...editRowData, mapel: e.target.value })}
                                className="px-1.5 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-full"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editRowData.materi}
                              onChange={(e) => setEditRowData({ ...editRowData, materi: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none w-full"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={editRowData.status}
                              onChange={(e) => setEditRowData({ ...editRowData, status: e.target.value })}
                              className="px-1.5 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none"
                            >
                              <option value="Terlaksana">Terlaksana</option>
                              <option value="Tunda">Tunda</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={editRowData.absenSiswa || ""}
                              onChange={(e) => setEditRowData({ ...editRowData, absenSiswa: e.target.value })}
                              className="px-2 py-1 text-xs font-bold border rounded bg-white dark:bg-slate-800 border-blue-400 outline-none text-center w-20"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleSaveRowEdit(item.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs cursor-pointer"
                                title="Simpan Perubahan"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRowId(null);
                                  setEditRowData(null);
                                }}
                                className="bg-slate-300 hover:bg-slate-400 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-3 text-center font-numeric font-medium text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-numeric font-medium whitespace-nowrap">{item.tanggal}</td>
                        <td className="p-3 text-center font-numeric font-semibold">{item.jam}</td>
                        <td className="p-3 text-center font-bold">
                          <span className="bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            {item.kelas} - {item.mapel}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{item.materi}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === "Terlaksana"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-center font-normal">{item.absenSiswa || "-"}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleStartRowEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAgenda(item.id)}
                              disabled={deletingId === item.id}
                              className={`p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors ${
                                deletingId === item.id ? "opacity-50 cursor-not-allowed animate-pulse" : "cursor-pointer"
                              }`}
                              title="Hapus Agenda Permanen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edit Agenda */}
      {editingAgenda && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 tracking-tight">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>Edit Jurnal Agenda Mengajar</span>
              </h3>
              <button
                onClick={() => setEditingAgenda(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-numeric font-medium outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Jam Ke *</label>
                <input
                  type="text"
                  value={editJam}
                  onChange={(e) => setEditJam(e.target.value)}
                  placeholder="Contoh: 1 - 2"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none font-numeric font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Kelas *</label>
                <select
                  value={editKelas}
                  onChange={(e) => setEditKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Mata Pelajaran *</label>
                <select
                  value={editMapel}
                  onChange={(e) => setEditMapel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                  required
                >
                  <option value="">Pilih Mapel</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.namaMapel}>
                      {m.namaMapel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Materi Pembelajaran *</label>
                <input
                  type="text"
                  value={editMateri}
                  onChange={(e) => setEditMateri(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Keterlaksanaan</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="Terlaksana">Terlaksana</option>
                  <option value="Tunda">Tunda</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Absen Siswa</label>
                <input
                  type="text"
                  value={editAbsenSiswa}
                  onChange={(e) => setEditAbsenSiswa(e.target.value)}
                  placeholder="Nihil / Nama siswa"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={editKet}
                  onChange={(e) => setEditKet(e.target.value)}
                  placeholder="Catatan tambahan"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none font-medium"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingAgenda(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

