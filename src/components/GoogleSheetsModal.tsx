import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Table,
  Plus,
  Database,
  Link as LinkIcon,
  X,
  AlertCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Trash2,
  Search,
  Download,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { AgendaItem, Employee } from '../types';
import { SPREADSHEET_COLUMNS } from '../config/driveConfig';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendas: AgendaItem[];
  employees: Employee[];
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  agendas,
  employees,
  onShowToast,
}) => {
  const {
    hasValidAuth,
    userEmail,
    isConnecting,
    connectDrive,
    clearSession,
    spreadsheetId,
    spreadsheetUrl,
    sheetName,
    isSyncingSheets,
    lastSyncedAt,
    autoSyncEnabled,
    setAutoSyncEnabled,
    initOrCreateSpreadsheet,
    verifySpreadsheetAccess,
    syncAllAgendasToSheets,
    disconnectSpreadsheet,
  } = useGoogleDrive();

  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [accessWarning, setAccessWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInitNew = async (force: boolean = true) => {
    setErrorMessage(null);
    setAccessWarning(null);
    try {
      if (!hasValidAuth) {
        const ok = await connectDrive('select_account');
        if (!ok) {
          setErrorMessage(
            'Izin akun Google diperlukan untuk membuat file Spreadsheet baru. Silakan klik tombol "Hubungkan Akun Google" di bawah.'
          );
          return;
        }
      }

      await initOrCreateSpreadsheet(undefined, { forceNew: force });
      onShowToast(
        'success',
        'Database Google Sheets Berhasil Dibuat',
        'Spreadsheet baru telah siap dan tersimpan di folder Google Drive Subbag Sungram.'
      );

      // Auto-sync current agendas right away
      if (agendas.length > 0) {
        await syncAllAgendasToSheets(agendas, employees);
        onShowToast(
          'success',
          'Data Berhasil Disinkronkan',
          `${agendas.length} agenda surat masuk berhasil dicatat ke Google Sheets.`
        );
      }
    } catch (err: any) {
      const msg = err?.message || 'Gagal menyiapkan Google Spreadsheet.';
      setErrorMessage(msg);
      onShowToast('error', 'Gagal Menyiapkan Sheets', msg);
    }
  };

  const handleConnectCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setErrorMessage(null);
    setAccessWarning(null);

    try {
      await initOrCreateSpreadsheet(customInput.trim());
      setShowCustomInput(false);
      setCustomInput('');
      onShowToast(
        'success',
        'Spreadsheet Berhasil Dihubungkan',
        'Database naskah dinas telah tertaut dengan Google Sheets pilihan Anda.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menautkan spreadsheet.');
      onShowToast('error', 'Koneksi Gagal', err?.message);
    }
  };

  const handleAuthorizeGoogle = async () => {
    setErrorMessage(null);
    try {
      const ok = await connectDrive('select_account');
      if (ok) {
        onShowToast('success', 'Akun Google Terhubung', 'Izin akses Google Drive & Sheets berhasil diberikan.');
        // If there was an error prior, retry creating
        if (errorMessage) {
          handleInitNew(true);
        }
      } else {
        setErrorMessage('Otorisasi Google dibatalkan atau jendela popup ditutup.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menghubungkan akun Google.');
    }
  };

  const handleCheckAccess = async () => {
    setIsCheckingAccess(true);
    setAccessWarning(null);
    try {
      const res = await verifySpreadsheetAccess();
      if (!res.valid) {
        setAccessWarning(
          res.error ||
            'Spreadsheet tidak ditemukan di Google Drive atau telah terhapus (404 Not Found).'
        );
      } else {
        onShowToast(
          'success',
          'Akses Spreadsheet Valid',
          `File "${res.title || 'Spreadsheet Database'}" aktif dan dapat diakses dengan baik.`
        );
      }
    } catch (err: any) {
      setAccessWarning(err?.message || 'Gagal memeriksa status spreadsheet.');
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleDisconnect = () => {
    disconnectSpreadsheet();
    setAccessWarning(null);
    setErrorMessage(null);
    onShowToast(
      'info',
      'Tautan Spreadsheet Dilepas',
      'Tautan lama telah dibersihkan. Anda dapat membuat database baru atau menautkan link yang valid.'
    );
  };

  const handleSyncAll = async () => {
    setErrorMessage(null);
    try {
      const res = await syncAllAgendasToSheets(agendas, employees);
      onShowToast(
        'success',
        'Sinkronisasi Massal Berhasil',
        `${res.syncedCount} naskah dinas telah diperbarui di Google Sheets.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyinkronkan data.');
      onShowToast('error', 'Sinkronisasi Gagal', err?.message);
    }
  };

  const handleExportCSV = () => {
    const employeesMap: Record<string, string> = {};
    employees.forEach((e) => {
      employeesMap[e.id] = e.name;
    });

    const rows = [
      SPREADSHEET_COLUMNS,
      ...agendas.map((item, idx) => {
        const dispositionNames = (item.disposition?.assignedEmployeeIds || [])
          .map((id: string) => employeesMap[id] || id)
          .join(', ');
        return [
          idx + 1,
          item.createdAt || '',
          item.letterDate || '',
          item.letterNumber || '',
          item.sender || '',
          item.subject || '',
          `${item.urgency || 'Biasa'}`,
          dispositionNames,
          item.disposition?.disposerNote || '',
          item.stage === 'Completed' ? 'Sudah Dilaporkan' : item.stage === 'In_Progress' ? 'Proses Disposisi' : 'Surat Masuk Baru',
          item.report?.reportedAt || '',
          item.driveViewLink || '',
          item.id,
          new Date().toISOString(),
        ];
      }),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows
        .map((row) =>
          row
            .map((field) => {
              const str = String(field ?? '').replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        )
        .join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Database_Surat_Masuk_Sungram_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'Ekspor CSV Berhasil', 'Salinan database offline telah diunduh.');
  };

  const isAuthError =
    errorMessage &&
    (errorMessage.includes('401') ||
      errorMessage.toLowerCase().includes('otentikasi') ||
      errorMessage.toLowerCase().includes('token') ||
      errorMessage.includes('UNAUTHENTICATED'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Integrasi Database Google Sheets
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                  Sinkronisasi Otomatis
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Pencatatan data surat masuk & agenda perkantoran langsung ke Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          {/* Google Account Authentication Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  hasValidAuth ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {hasValidAuth ? <ShieldCheck className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{hasValidAuth ? 'Akun Google Terotorisasi' : 'Perlu Izin Akses Akun Google'}</span>
                  {hasValidAuth && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {userEmail || 'sungram11dishub@gmail.com'} •{' '}
                  {hasValidAuth
                    ? 'Akses Google Drive & Sheets aktif'
                    : 'Diperlukan untuk membuat & sinkronisasi Google Spreadsheet'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAuthorizeGoogle}
              disabled={isConnecting}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-xs shrink-0 cursor-pointer shadow-2xs ${
                hasValidAuth
                  ? 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>{hasValidAuth ? 'Ganti / Perbarui Akun' : 'Hubungkan Akun Google'}</span>
            </button>
          </div>

          {/* Friendly Error Resolution Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-950 text-sm">Terjadi Kendala</p>
                  <p className="mt-0.5 text-rose-800 leading-relaxed">
                    {isAuthError
                      ? 'Sesi otentikasi Google telah berakhir atau akun Google Anda belum memberikan izin akses untuk membuat berkas Google Spreadsheet baru di Google Drive.'
                      : errorMessage}
                  </p>
                </div>
              </div>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAuthorizeGoogle}
                  disabled={isConnecting}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Login & Izinkan Akun Google Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                >
                  Tutup Notifikasi
                </button>
              </div>
            </div>
          )}

          {/* Access Warning if file is missing (404) */}
          {accessWarning && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-bold text-amber-950">Berkas Spreadsheet Tidak Ditemukan (404)</h4>
                  <p className="text-amber-800 mt-0.5 leading-relaxed">{accessWarning}</p>
                </div>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInitNew(true)}
                    disabled={isSyncingSheets || isConnecting}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Database Spreadsheet Baru Sekarang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Tautkan Spreadsheet Lain
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reset Tautan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Connection Card */}
          {spreadsheetId ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Database Aktif Terhubung
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {spreadsheetId.slice(0, 12)}...
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">
                      Database Surat Masuk & Agenda - Subbag Sungram
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>
                        Sheet Tab: <strong>{sheetName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Terakhir Sinkron:{' '}
                        {lastSyncedAt
                          ? new Date(lastSyncedAt).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Belum ada'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Buka file Google Sheets di tab baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Spreadsheet</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckAccess}
                    disabled={isCheckingAccess}
                    title="Periksa apakah berkas ada di Google Drive"
                    className="p-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Search className={`w-3.5 h-3.5 ${isCheckingAccess ? 'animate-spin text-emerald-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Troubleshooting hint */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-blue-950">
                    Muncul masalah "Sorry, the file you have requested does not exist"?
                  </p>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Hal ini terjadi apabila file spreadsheet lama telah terhapus di Google Drive. Klik tombol{' '}
                    <strong>"Buat Database Baru"</strong> di bawah untuk membuat dan menyinkronkan file spreadsheet yang masih segar.
                  </p>
                </div>
              </div>

              {/* Action Buttons for Active Connection */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleInitNew(true)}
                    disabled={isSyncingSheets || isConnecting}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Buat Database Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LinkIcon className="w-3 h-3 text-slate-500" />
                    <span>Ganti Spreadsheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Putuskan sambungan ke spreadsheet saat ini"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Putuskan</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={isSyncingSheets}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-xs shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isSyncingSheets ? 'Menyinkronkan...' : `Sinkronkan ${agendas.length} Data`}</span>
                </button>
              </div>

              {/* Auto Sync Toggle */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className="text-slate-800 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {autoSyncEnabled ? (
                    <ToggleRight className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-400" />
                  )}
                </button>
                <div>
                  <p className="font-semibold text-slate-800">
                    Sinkronisasi Otomatis Real-time ({autoSyncEnabled ? 'Aktif' : 'Nonaktif'})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Setiap penambahan atau perubahan surat masuk otomatis memperbarui baris di Google Sheets.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Not Connected State */
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Table className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-900">
                  Integrasikan Sebagai Database Google Spreadsheet
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Otomatis simpan seluruh surat masuk di sistem perkantoran Anda ke Google Sheets.
                  Mencakup tanggal input, tanggal surat, asal instansi, perihal, pegawai terdisposisi, dan status laporan.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleInitNew(true)}
                  disabled={isSyncingSheets || isConnecting}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSyncingSheets || isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Buat & Hubungkan Spreadsheet Database Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tautkan Spreadsheet yang Ada</span>
                </button>
              </div>
            </div>
          )}

          {/* Custom Spreadsheet Input Form */}
          {showCustomInput && (
            <form onSubmit={handleConnectCustom} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>ID atau URL Google Spreadsheet</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Contoh: https://docs.google.com/spreadsheets/d/1A2B3C.../edit atau ID Spreadsheet"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!customInput.trim() || isSyncingSheets}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hubungkan
                </button>
              </div>
            </form>
          )}

          {/* Features Info Box */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Struktur Kolom Database Otomatis:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              {SPREADSHEET_COLUMNS.map((col, idx) => (
                <div key={col} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                  <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="truncate">{col}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/70 border border-emerald-300/80 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Unduh seluruh data database dalam format file CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Cadangan CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
