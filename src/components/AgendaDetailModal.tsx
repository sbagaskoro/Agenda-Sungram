import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Calendar, 
  Clock, 
  MapPin, 
  Building, 
  UserCheck, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Inbox, 
  Paperclip, 
  Trash2, 
  Edit3,
  Image as ImageIcon,
  HardDrive,
  ExternalLink,
  FolderOpen,
  Upload,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { AgendaItem, Employee, NotaDinasConfig } from '../types';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { formatNip } from '../utils/nameFormatter';
import { NotaDinasModal } from './NotaDinasModal';

interface AgendaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: AgendaItem | null;
  employees: Employee[];
  onEdit: (agenda: AgendaItem) => void;
  onDelete: (id: string) => void;
  onOpenDisposition: (agenda: AgendaItem) => void;
  onOpenReport: (agenda: AgendaItem) => void;
  onUpdateAgenda?: (updatedAgenda: AgendaItem) => void;
}

export const AgendaDetailModal: React.FC<AgendaDetailModalProps> = ({
  isOpen,
  onClose,
  agenda,
  employees,
  onEdit,
  onDelete,
  onOpenDisposition,
  onOpenReport,
  onUpdateAgenda,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [isDeletingDrive, setIsDeletingDrive] = useState(false);
  const [isNotaDinasOpen, setIsNotaDinasOpen] = useState(false);
  const [isSyncingSheetsItem, setIsSyncingSheetsItem] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const { 
    isConnected, 
    connectDrive, 
    uploadFileToDrive, 
    deleteFileFromDrive, 
    rootFolderUrl,
    spreadsheetId,
    spreadsheetUrl,
    syncAgendaToSheets
  } = useGoogleDrive();

  if (!isOpen || !agenda) return null;

  const handleSyncToSheets = async () => {
    if (!agenda) return;
    setIsSyncingSheetsItem(true);
    setSyncStatusMsg(null);
    try {
      const ok = await syncAgendaToSheets(agenda, employees);
      if (ok) {
        setSyncStatusMsg('Tersinkron!');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      } else {
        setSyncStatusMsg('Gagal sinkron');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch {
      setSyncStatusMsg('Error');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } finally {
      setIsSyncingSheetsItem(false);
    }
  };

  const handleSaveNotaDinas = (_agendaId: string, updatedNotes: string, notaConfig?: NotaDinasConfig) => {
    if (!agenda || !onUpdateAgenda) return;
    const updatedReport = {
      ...(agenda.report || {
        reportedByEmployeeId: employees[0]?.id || 'emp-donny',
        reportedByName: employees[0]?.name || 'Donny Manu, ST.',
        reportedAt: new Date().toISOString(),
        photos: [],
      }),
      executionNotes: updatedNotes,
      notaDinas: notaConfig,
    };
    onUpdateAgenda({
      ...agenda,
      report: updatedReport,
    });
  };

  const getStaff = (id: string) => employees.find((e) => e.id === id);

  const handlePrint = () => {
    window.print();
  };

  const handleManualUploadDrive = async (file: File) => {
    if (!agenda) return;
    try {
      setIsUploadingDrive(true);
      const res = await uploadFileToDrive(
        file,
        agenda.letterDate,
        agenda.letterNumber,
        agenda.subject
      );
      if (onUpdateAgenda) {
        onUpdateAgenda({
          ...agenda,
          attachmentName: file.name,
          driveFileId: res.fileId,
          driveViewLink: res.webViewLink,
          driveDownloadLink: res.webContentLink,
          driveFolderPath: res.folderPath,
          driveUploadedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      alert(`Gagal mengunggah ke Google Drive: ${err?.message || err}`);
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const handleRemoveFromDrive = async () => {
    if (!agenda?.driveFileId) return;
    if (!window.confirm('Hapus berkas ini dari Google Drive?')) return;
    try {
      setIsDeletingDrive(true);
      await deleteFileFromDrive(agenda.driveFileId);
      if (onUpdateAgenda) {
        onUpdateAgenda({
          ...agenda,
          driveFileId: undefined,
          driveViewLink: undefined,
          driveDownloadLink: undefined,
          driveFolderPath: undefined,
          driveUploadedAt: undefined,
        });
      }
    } catch (err: any) {
      alert(`Gagal menghapus berkas di Google Drive: ${err?.message || err}`);
    } finally {
      setIsDeletingDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div 
        id="modal-agenda-detail"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Lembar Naskah Dinas & Agenda
                </h3>
                {agenda.stage === 'Received' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    Tahap A: Diterima
                  </span>
                )}
                {agenda.stage === 'In_Progress' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                    Tahap B: Disposisi/Proses
                  </span>
                )}
                {agenda.stage === 'Completed' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                    Tahap C: Selesai
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                No: {agenda.letterNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNotaDinasOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Buka / Cetak format resmi Nota Dinas ber-Kop Pemprov Jawa Timur"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Format Nota Dinas</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Cetak Lembar Disposisi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:p-8">
          {/* Print Letterhead */}
          <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
            <h2 className="text-base font-bold uppercase tracking-wider">
              PEMERINTAH PROVINSI / DAERAH
            </h2>
            <h1 className="text-lg font-black uppercase">
              SUB BAGIAN PENYUSUNAN PROGRAM DAN ANGGARAN
            </h1>
            <p className="text-xs text-slate-600">
              LEMBAR KENDALI DISPOSISI DAN LAPORAN PELAKSANAAN AGENDA
            </p>
          </div>

          {/* Section 1: Data Surat Masuk */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Inbox className="w-4 h-4 text-blue-600" />
                <span>1. Data Naskah Dinas / Surat Masuk</span>
              </h4>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                Sifat: {agenda.urgency || 'Biasa'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Nomor Surat:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {agenda.letterNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tanggal Surat:</span>
                <span className="font-semibold text-slate-800">{agenda.letterDate}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[11px]">Asal Instansi / Pengirim:</span>
                <span className="font-bold text-slate-900">{agenda.sender}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[11px]">Perihal Surat:</span>
                <p className="font-semibold text-slate-900 leading-relaxed mt-0.5">
                  {agenda.subject}
                </p>
              </div>
              {agenda.attachmentName && (
                <div className="sm:col-span-2 flex items-center gap-2 pt-1 text-slate-600 text-[11px]">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>Berkas Lampiran: <strong>{agenda.attachmentName}</strong></span>
                </div>
              )}

              {/* Google Drive Database Status & Management */}
              <div className="sm:col-span-2 mt-2 pt-2 border-t border-slate-200 print:hidden">
                {agenda.driveFileId ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-950">Tersimpan di Google Drive</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-mono font-semibold">
                            {agenda.driveFolderPath}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Subfolder: <strong>{agenda.driveFolderPath}</strong> &bull; Database Surat Subbag Sungram
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      {agenda.driveViewLink && (
                        <a
                          href={agenda.driveViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Buka Berkas</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveFromDrive}
                        disabled={isDeletingDrive}
                        className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        title="Hapus berkas dari Google Drive"
                      >
                        {isDeletingDrive ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <HardDrive className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Berkas Naskah Surat (Google Drive)</span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Otomatis ke Drive
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Pilih berkas naskah dinas untuk disimpan otomatis ke subfolder Google Drive Subbag Sungram ({agenda.letterDate ? agenda.letterDate.split('-')[0] : new Date().getFullYear()}).
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <label className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                        {isUploadingDrive ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah Naskah Dinas</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,image/*,.docx,.txt"
                          disabled={isUploadingDrive}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleManualUploadDrive(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Waktu & Lokasi Pelaksanaan */}
          <div className="p-4 bg-blue-50/40 border border-blue-200/80 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-blue-200/70 pb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>2. Waktu & Tempat Pelaksanaan Agenda</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Tanggal Pelaksanaan:</span>
                  <span className="font-bold text-slate-900 text-sm">{agenda.eventDate}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Waktu / Jam:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {agenda.startTime} - {agenda.endTime} WIB
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-start gap-2.5 pt-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Tempat / Ruangan:</span>
                  <span className="font-bold text-slate-900">{agenda.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Lembar Disposisi Kasubbag Sungram */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-200/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>3. Lembar Disposisi Kasubbag Sungram</span>
              </h4>

              {agenda.disposition ? (
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                  Status: Telah Didisposisikan
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenDisposition(agenda)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors print:hidden"
                >
                  + Isi Disposisi Sekarang
                </button>
              )}
            </div>

            {agenda.disposition ? (
              <div className="space-y-3 text-xs">
                {/* Pendisposisi Badge */}
                <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-indigo-100 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Pendisposisi:</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {agenda.disposition.disposerName}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {agenda.disposition.disposerRole}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md">
                    Prioritas: {agenda.disposition.priority || 'Penting'}
                  </span>
                </div>

                {/* Catatan Pendisposisi */}
                <div>
                  <span className="text-slate-500 text-[11px] font-semibold block mb-1">
                    Catatan / Arahan Kasubbag Sungram:
                  </span>
                  <div className="p-3 bg-white border border-indigo-200 rounded-xl text-slate-800 leading-relaxed font-medium">
                    "{agenda.disposition.disposerNote}"
                  </div>
                </div>

                {/* Tagged Staff */}
                <div>
                  <span className="text-slate-500 text-[11px] font-semibold block mb-1.5">
                    Staf yang Terdisposisi ({agenda.disposition.assignedEmployeeIds?.length || 0} orang):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {agenda.disposition.assignedEmployeeIds?.map((empId) => {
                      const emp = getStaff(empId);
                      return (
                        <div
                          key={empId}
                          className="p-2 bg-white border border-indigo-100 rounded-lg flex items-center gap-2"
                        >
                          <div
                            className={`w-7 h-7 rounded-md ${emp?.avatarBg || 'bg-indigo-600'} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}
                          >
                            {emp?.name.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate text-xs">
                              {emp?.name}
                            </p>
                            {emp && (
                              <p className="text-[10px] text-slate-500 truncate">
                                {emp.role} {emp.nip ? `• NIP ${formatNip(emp.nip)}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                Agenda ini masih berada di Planner A (Surat Masuk Diterima) dan belum didisposisikan ke staf.
              </p>
            )}
          </div>

          {/* Section 4: Laporan Pelaksanaan Disposisi */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2 flex-wrap gap-2">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>4. Laporan Hasil Pelaksanaan Disposisi</span>
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNotaDinasOpen(true)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs print:hidden"
                  title="Buka / Cetak format resmi Nota Dinas ber-Kop Pemprov Jawa Timur"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Format Nota Dinas Ber-Kop</span>
                </button>

                {agenda.report ? (
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    Status: Selesai Dilaporkan
                  </span>
                ) : agenda.stage === 'In_Progress' ? (
                  <button
                    type="button"
                    onClick={() => onOpenReport(agenda)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors print:hidden"
                  >
                    + Isi Laporan Disposisi
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Menunggu Disposisi & Pelaksanaan
                  </span>
                )}
              </div>
            </div>

            {agenda.report ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-emerald-100 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Staf Pelapor:</span>
                    <p className="font-bold text-slate-900">{agenda.report.reportedByName}</p>
                    {(() => {
                      const repEmp = employees.find((e) => e.id === agenda.report?.reportedByEmployeeId || e.name === agenda.report?.reportedByName);
                      if (repEmp) {
                        return (
                          <p className="text-[10px] text-slate-500">
                            {repEmp.role} {repEmp.nip ? `• NIP ${formatNip(repEmp.nip)}` : ''}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Waktu Lapor: {agenda.report.reportedAt ? new Date(agenda.report.reportedAt).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] font-semibold block mb-1">
                    Hasil & Ringkasan Pelaksanaan (Sistematika Naskah Dinas):
                  </span>
                  <div className="p-3.5 bg-white border border-emerald-200 rounded-xl text-slate-800 leading-relaxed font-sans text-xs whitespace-pre-wrap">
                    {agenda.report.executionNotes}
                  </div>
                </div>

                {agenda.report.followUpAction && (
                  <div>
                    <span className="text-slate-500 text-[11px] font-semibold block mb-1">
                      Tindak Lanjut Berikutnya:
                    </span>
                    <p className="text-slate-700 font-medium">
                      {agenda.report.followUpAction}
                    </p>
                  </div>
                )}

                {agenda.report.photos && agenda.report.photos.length > 0 && (
                  <div>
                    <span className="text-slate-500 text-[11px] font-semibold block mb-2">
                      Dokumentasi Kegiatan ({agenda.report.photos.length} Foto):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {agenda.report.photos.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={p.url}
                            alt={p.caption}
                            referrerPolicy="no-referrer"
                            className="w-full aspect-video object-cover"
                          />
                          <p className="text-[10px] text-slate-600 p-1.5 truncate">
                            {p.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                Laporan pelaksanaan belum diisi. Setelah staf melaksanakan kegiatan, klik tombol "Isi Laporan" untuk memindahkan kartu ke Planner C.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50 print:hidden">
          <div>
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-rose-800">Yakin hapus agenda ini?</span>
                <button
                  type="button"
                  id="btn-confirm-delete-detail"
                  onClick={() => {
                    onDelete(agenda.id);
                    setIsConfirmingDelete(false);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Ya, Hapus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Agenda</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {spreadsheetId && (
              <button
                type="button"
                onClick={handleSyncToSheets}
                disabled={isSyncingSheetsItem}
                className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Sinkronkan data surat ini ke Google Sheets"
              >
                {isSyncingSheetsItem ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{syncStatusMsg ? syncStatusMsg : 'Sinkron ke Sheets'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(agenda);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors border border-slate-300 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Modal Format Nota Dinas Ber-Kop Resmi */}
      <NotaDinasModal
        isOpen={isNotaDinasOpen}
        onClose={() => setIsNotaDinasOpen(false)}
        agenda={agenda}
        employees={employees}
        initialNotes={agenda.report?.executionNotes}
        onSaveToReport={handleSaveNotaDinas}
      />
    </div>
  );
};
