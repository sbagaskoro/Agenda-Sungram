import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  Inbox, 
  Clock, 
  CheckCircle2, 
  Building2,
  CalendarCheck,
  HardDrive,
  ExternalLink,
  Check,
  Loader2,
  LogOut,
  FolderOpen,
  FileSpreadsheet,
  RefreshCw,
  Database,
  Settings,
  Trash2,
} from 'lucide-react';
import { AgendaItem, Employee } from '../types';
import { useGoogleDrive } from '../context/GoogleDriveContext';

interface HeaderProps {
  agendas: AgendaItem[];
  employees?: Employee[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddNewClick: () => void;
  selectedDateFilter: string | null;
  onClearDateFilter: () => void;
  onOpenSheetsModal: () => void;
  onResetAllData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  agendas,
  employees = [],
  searchQuery,
  onSearchChange,
  onAddNewClick,
  selectedDateFilter,
  onClearDateFilter,
  onOpenSheetsModal,
  onResetAllData,
}) => {
  const countReceived = agendas.filter((a) => a.stage === 'Received').length;
  const countInProgress = agendas.filter((a) => a.stage === 'In_Progress').length;
  const countCompleted = agendas.filter((a) => a.stage === 'Completed').length;

  const {
    isConnected,
    isConnecting,
    userEmail,
    rootFolderUrl,
    connectDrive,
    disconnectDrive,
    spreadsheetId,
    spreadsheetUrl,
    isSyncingSheets,
    syncAllAgendasToSheets,
  } = useGoogleDrive();

  const [isDriveMenuOpen, setIsDriveMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo and App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Agenda & Disposisi Surat Masuk
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                  Kasubbag Sungram
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Subbag Penyusunan Program dan Anggaran</span>
              </p>
            </div>
          </div>

          {/* Search, Google Drive & Google Sheets Status, and Main Add Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-52">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                placeholder="Cari surat, perihal..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Google Sheets Database Button */}
            <button
              type="button"
              onClick={onOpenSheetsModal}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs border ${
                spreadsheetId
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title={spreadsheetId ? 'Database Google Sheets Aktif' : 'Hubungkan Database Google Sheets'}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${spreadsheetId ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline text-[11px]">
                {spreadsheetId ? 'Database Sheet' : 'Integrasi Sheet'}
              </span>
              {spreadsheetId && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
            </button>

            {/* Google Drive Status Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDriveMenuOpen(!isDriveMenuOpen)}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                title="Penyimpanan Google Drive Otomatis Subbag Sungram"
              >
                <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="hidden sm:inline text-[11px]">Drive Sungram</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </button>

              {isDriveMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Google Drive Subbag Sungram</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Otomatis Aktif & Tersimpan</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2.5 text-[11px] text-slate-600 space-y-1.5">
                    <p className="text-slate-500">
                      Folder Penyimpanan Drive: <br />
                      <span className="font-semibold text-slate-800">Database Surat Subbag Sungram</span>
                    </p>
                    <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Setiap surat masuk otomatis diarsipkan ke subfolder <strong className="text-slate-700">[Tahun]</strong> &rarr; <strong className="text-slate-700">[Bulan]</strong> tanpa perlu koneksi manual.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                    <a
                      href={rootFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Buka Folder di Google Drive</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {onResetAllData && agendas.length > 0 && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                title="Kosongkan Semua Agenda (Buat Bersih Seperti Baru)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline text-[11px]">Kosongkan Data</span>
              </button>
            )}

            <button
              id="btn-add-new-agenda-header"
              type="button"
              onClick={onAddNewClick}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              title="Tambah Surat Masuk / Agenda Baru"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Surat</span>
            </button>
          </div>
        </div>

        {/* Status Bar & Active Filter */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Quick Stage Statistics */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Alur Kerja:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 font-medium">
              <Inbox className="w-3.5 h-3.5 text-amber-600" />
              <span>A. Diterima (Received):</span>
              <span className="font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.2 rounded-full text-[11px]">
                {countReceived}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-800 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>B. Disposisi/Proses:</span>
              <span className="font-bold text-indigo-900 bg-indigo-200/60 px-1.5 py-0.2 rounded-full text-[11px]">
                {countInProgress}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>C. Selesai (Laporan):</span>
              <span className="font-bold text-emerald-900 bg-emerald-200/60 px-1.5 py-0.2 rounded-full text-[11px]">
                {countCompleted}
              </span>
            </div>
          </div>

          {/* Google Sheets Quick Status & Date Filter Notification */}
          <div className="flex items-center gap-2 flex-wrap">
            {spreadsheetId ? (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <button
                  type="button"
                  onClick={onOpenSheetsModal}
                  className="font-medium hover:underline text-left cursor-pointer"
                  title="Klik untuk membuka pengaturan / sinkronisasi Google Sheets"
                >
                  Database Sheet: <strong className="text-emerald-950 font-bold">Tersambung</strong>
                </button>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-emerald-700 hover:text-emerald-950 underline text-[11px] font-semibold flex items-center gap-0.5"
                    title="Buka Spreadsheet di tab baru"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={onOpenSheetsModal}
                  title="Kelola Database Spreadsheet"
                  className="ml-0.5 text-emerald-600 hover:text-emerald-900 p-0.5 rounded hover:bg-emerald-100 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenSheetsModal}
                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg text-[11px] transition-colors"
              >
                <FileSpreadsheet className="w-3 h-3 text-slate-500" />
                <span>Tautkan Google Sheets</span>
              </button>
            )}

            {selectedDateFilter && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-lg text-xs">
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Filter: <strong className="font-bold">{selectedDateFilter}</strong>
                </span>
                <button
                  type="button"
                  onClick={onClearDateFilter}
                  className="ml-1 text-blue-700 hover:text-blue-900 underline font-semibold text-[11px]"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 animate-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center">
              Kosongkan Semua Agenda?
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Tindakan ini akan menghapus semua agenda dari tampilan sistem agar kembali bersih seperti baru dan siap dipakai.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  if (onResetAllData) onResetAllData();
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

