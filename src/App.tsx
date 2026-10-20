import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { InteractiveCalendar } from './components/InteractiveCalendar';
import { PlannerBoard } from './components/PlannerBoard';
import { CreateAgendaMailModal } from './components/CreateAgendaMailModal';
import { DispositionModal } from './components/DispositionModal';
import { ReportModal } from './components/ReportModal';
import { AgendaDetailModal } from './components/AgendaDetailModal';
import { NotaDinasModal } from './components/NotaDinasModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { INITIAL_AGENDAS, INITIAL_EMPLOYEES } from './data/initialData';
import { AgendaItem, AgendaDisposition, AgendaReport, PlannerStage, NotaDinasConfig } from './types';
import { useGoogleDrive } from './context/GoogleDriveContext';
import { formatEmployeeName } from './utils/nameFormatter';

const STORAGE_KEY = 'subbag_sungram_agendas_v4';

export function App() {
  const { 
    deleteFileFromDrive, 
    spreadsheetId, 
    autoSyncEnabled, 
    syncAgendaToSheets, 
    isConnected 
  } = useGoogleDrive();

  // Load agendas from localStorage or fallback to INITIAL_AGENDAS (clean empty state)
  const [agendas, setAgendas] = useState<AgendaItem[]>(() => {
    try {
      // Clear legacy sample keys so user browser starts 100% fresh
      const legacyKeys = [
        'subbag_sungram_agendas_v1',
        'subbag_sungram_agendas_v2',
        'subbag_sungram_agendas_v3',
        'sungram_dishub_agenda_v1',
        'sungram_dishub_surat_v1',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: AgendaItem) => {
            if (item.report?.reportedByName) {
              return {
                ...item,
                report: {
                  ...item.report,
                  reportedByName: formatEmployeeName(item.report.reportedByName),
                },
              };
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.error('Gagal memuat agenda tersimpan:', e);
    }
    return INITIAL_AGENDAS;
  });

  const employees = useMemo(
    () =>
      INITIAL_EMPLOYEES.map((emp) => ({
        ...emp,
        name: formatEmployeeName(emp.name),
      })),
    []
  );

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [calendarViewMode, setCalendarViewMode] = useState<'all' | 'calendar-only' | 'kanban-only'>('all');

  // Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [dispositionAgenda, setDispositionAgenda] = useState<AgendaItem | null>(null);
  const [reportAgenda, setReportAgenda] = useState<AgendaItem | null>(null);
  const [detailAgenda, setDetailAgenda] = useState<AgendaItem | null>(null);
  const [notaDinasAgenda, setNotaDinasAgenda] = useState<AgendaItem | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agendas));
    } catch (e) {
      console.error('Gagal menyimpan agenda ke localStorage:', e);
    }
  }, [agendas]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Filter agendas by search
  const searchedAgendas = agendas.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.subject.toLowerCase().includes(q) ||
      item.letterNumber.toLowerCase().includes(q) ||
      item.sender.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q))
    );
  });

  // Calendar Click: Opens Creation Modal for that specific date
  const handleDateClick = (dateStr: string) => {
    setEditingAgenda(null);
    setSelectedDateForCreate(dateStr);
    setIsCreateModalOpen(true);
  };

  // Save new agenda or update existing agenda
  const handleSaveAgenda = (data: Partial<AgendaItem>) => {
    if (editingAgenda) {
      // Edit existing
      const updatedItem: AgendaItem = { ...editingAgenda, ...data } as AgendaItem;
      setAgendas((prev) =>
        prev.map((item) =>
          item.id === editingAgenda.id
            ? updatedItem
            : item
        )
      );

      // Auto-sync to Google Sheets database if active
      if (autoSyncEnabled && spreadsheetId) {
        syncAgendaToSheets(updatedItem, employees)
          .then((synced) => {
            if (synced) {
              addToast('info', 'Database Sheets Diperbarui', `Perubahan ${data.letterNumber || ''} tersinkron ke Google Sheets.`);
            }
          })
          .catch((err) => console.warn('Gagal sinkron ke Sheets:', err));
      }

      addToast(
        'success',
        'Agenda Berhasil Diperbarui',
        data.driveFolderPath
          ? `Perubahan pada ${data.letterNumber || ''} telah disimpan (Berkas tersinkron ke Drive subfolder ${data.driveFolderPath}).`
          : `Perubahan pada ${data.letterNumber || ''} telah disimpan.`
      );
    } else {
      // Create new -> strictly enters Planner A: Received
      const newItem: AgendaItem = {
        letterNumber: data.letterNumber || '',
        sender: data.sender || '',
        letterDate: data.letterDate || new Date().toISOString().split('T')[0],
        subject: data.subject || '',
        urgency: data.urgency || 'Biasa',
        eventDate: data.eventDate || new Date().toISOString().split('T')[0],
        startTime: data.startTime || '09:00',
        endTime: data.endTime || '12:00',
        location: data.location || '',
        ...data,
        id: `agenda-${Date.now()}`,
        stage: 'Received',
        createdAt: new Date().toISOString(),
      };
      setAgendas((prev) => [newItem, ...prev]);

      // Auto-sync to Google Sheets database if active
      if (autoSyncEnabled && spreadsheetId) {
        syncAgendaToSheets(newItem, employees)
          .then((synced) => {
            if (synced) {
              addToast('info', 'Tercatat di Google Sheets', `Surat ${newItem.letterNumber} otomatis masuk ke database spreadsheet.`);
            }
          })
          .catch((err) => console.warn('Gagal sinkron ke Sheets:', err));
      }

      addToast(
        'success',
        'Surat Masuk Disimpan ke Planner A (Received)',
        data.driveFolderPath
          ? `Surat No. ${data.letterNumber || ''} berhasil diarsipkan ke Google Drive [${data.driveFolderPath}]. Siap didisposisikan.`
          : `Surat No. ${data.letterNumber || ''} siap didisposisikan oleh Kasubbag Sungram.`
      );
    }
    setIsCreateModalOpen(false);
    setEditingAgenda(null);
  };

  // Save Disposition -> moves card to Planner B: In_Progress
  const handleSaveDisposition = (agendaId: string, dispositionData: AgendaDisposition) => {
    let updatedAgenda: AgendaItem | null = null;
    setAgendas((prev) =>
      prev.map((item) => {
        if (item.id === agendaId) {
          const updated: AgendaItem = {
            ...item,
            stage: 'In_Progress',
            disposition: dispositionData,
          };
          updatedAgenda = updated;
          return updated;
        }
        return item;
      })
    );

    // Auto-sync updated disposition to Google Sheets database
    if (updatedAgenda && autoSyncEnabled && spreadsheetId) {
      syncAgendaToSheets(updatedAgenda, employees)
        .then((synced) => {
          if (synced) {
            addToast('info', 'Disposisi Dicatat ke Sheets', 'Nama staf yang terdisposisi otomatis diperbarui di spreadsheet.');
          }
        })
        .catch((err) => console.warn('Gagal sinkron disposisi ke Sheets:', err));
    }

    setDispositionAgenda(null);
    addToast(
      'success',
      'Disposisi Disimpan & Digeser ke Planner B (Proses)',
      `Surat berhasil didisposisikan kepada ${dispositionData.assignedEmployeeIds?.length || 0} staf.`
    );
  };

  // Save Report -> moves card to Planner C: Completed
  const handleSaveReport = (agendaId: string, reportData: AgendaReport) => {
    let updatedAgenda: AgendaItem | null = null;
    setAgendas((prev) =>
      prev.map((item) => {
        if (item.id === agendaId) {
          const updated: AgendaItem = {
            ...item,
            stage: 'Completed',
            report: reportData,
          };
          updatedAgenda = updated;
          return updated;
        }
        return item;
      })
    );

    // Auto-sync completed report to Google Sheets database
    if (updatedAgenda && autoSyncEnabled && spreadsheetId) {
      syncAgendaToSheets(updatedAgenda, employees)
        .then((synced) => {
          if (synced) {
            addToast('info', 'Laporan Dicatat ke Sheets', 'Status tuntas dan catatan hasil kegiatan diperbarui di spreadsheet.');
          }
        })
        .catch((err) => console.warn('Gagal sinkron laporan ke Sheets:', err));
    }

    setReportAgenda(null);
    addToast(
      'success',
      'Laporan Disimpan & Digeser ke Planner C (Selesai)',
      `Agenda telah tuntas dilaksanakan dan laporan telah diarsipkan.`
    );
  };

  // Delete Agenda (and automatically delete file from Google Drive if exists)
  const handleDeleteAgenda = async (id: string) => {
    const item = agendas.find((a) => a.id === id);
    if (item?.driveFileId) {
      try {
        await deleteFileFromDrive(item.driveFileId);
        addToast(
          'info',
          'Berkas Google Drive Dihapus',
          `Berkas ${item.attachmentName || 'surat'} di Google Drive [${item.driveFolderPath || 'Root'}] otomatis dihapus.`
        );
      } catch (err) {
        console.warn('Gagal menghapus berkas dari Google Drive:', err);
      }
    }
    setAgendas((prev) => prev.filter((a) => a.id !== id));
    if (detailAgenda?.id === id) setDetailAgenda(null);
    addToast(
      'info',
      'Agenda Dihapus',
      item ? `Surat No. ${item.letterNumber} telah dihapus dari sistem.` : 'Agenda telah dihapus.'
    );
  };

  // Direct move between stages (for drag revert)
  const handleMoveStageDirectly = (agendaId: string, targetStage: PlannerStage) => {
    setAgendas((prev) =>
      prev.map((item) => (item.id === agendaId ? { ...item, stage: targetStage } : item))
    );
    addToast('info', 'Status Agenda Diubah', `Kartu dipindahkan ke tahap ${targetStage}.`);
  };

  // Save Nota Dinas substance changes
  const handleSaveNotaDinasFromModal = (agendaId: string, updatedNotes: string, notaConfig?: NotaDinasConfig) => {
    setAgendas((prev) =>
      prev.map((item) => {
        if (item.id !== agendaId) return item;
        const updatedReport: AgendaReport = {
          ...(item.report || {
            reportedByEmployeeId: employees[0]?.id || 'emp-donny',
            reportedByName: employees[0]?.name || 'Donny Manu, ST.',
            reportedAt: new Date().toISOString(),
            photos: [],
          }),
          executionNotes: updatedNotes,
          notaDinas: notaConfig,
        };
        return {
          ...item,
          report: updatedReport,
        };
      })
    );
    addToast('success', 'Substansi Nota Dinas Disimpan', 'Isi laporan naskah dinas berhasil diperbarui.');
  };

  const handleResetAllData = () => {
    setAgendas([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    addToast('info', 'Workspace Bersih', 'Seluruh agenda sampel telah dikosongkan. Sistem siap dipakai.');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        agendas={agendas}
        employees={employees}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddNewClick={() => {
          setEditingAgenda(null);
          setSelectedDateForCreate(new Date().toISOString().split('T')[0]);
          setIsCreateModalOpen(true);
        }}
        selectedDateFilter={selectedDateFilter}
        onClearDateFilter={() => setSelectedDateFilter(null)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onResetAllData={handleResetAllData}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        {/* 1. Interactive Calendar View */}
        {calendarViewMode !== 'kanban-only' && (
          <InteractiveCalendar
            agendas={searchedAgendas}
            employees={employees}
            onDateClick={handleDateClick}
            onAgendaClick={(item) => setDetailAgenda(item)}
            selectedDateFilter={selectedDateFilter}
            onSelectDateFilter={setSelectedDateFilter}
            viewMode={calendarViewMode}
            onViewModeChange={setCalendarViewMode}
          />
        )}

        {/* 2. Three Stage Planner Kanban Board */}
        {calendarViewMode !== 'calendar-only' && (
          <PlannerBoard
            agendas={searchedAgendas}
            employees={employees}
            selectedDateFilter={selectedDateFilter}
            onClearDateFilter={() => setSelectedDateFilter(null)}
            onViewDetail={(item) => setDetailAgenda(item)}
            onEditAgenda={(item) => {
              setEditingAgenda(item);
              setIsCreateModalOpen(true);
            }}
            onDeleteAgenda={handleDeleteAgenda}
            onRequestDisposition={(item) => setDispositionAgenda(item)}
            onRequestReport={(item) => setReportAgenda(item)}
            onMoveStageDirectly={handleMoveStageDirectly}
            onOpenNotaDinas={(item) => setNotaDinasAgenda(item)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          Sistem Agenda & Disposisi Surat Masuk &bull; Sub Bagian Penyusunan Program dan Anggaran (Kasubbag: Yuniar Vidianto, S.T., M.T.)
        </p>
      </footer>

      {/* Modals */}
      {/* 1. Create/Edit Mail & Agenda Modal */}
      <CreateAgendaMailModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAgenda(null);
        }}
        selectedDate={selectedDateForCreate}
        onSave={handleSaveAgenda}
        editingItem={editingAgenda}
      />

      {/* 2. Disposition Modal (Advance to Planner B) */}
      <DispositionModal
        isOpen={!!dispositionAgenda}
        onClose={() => setDispositionAgenda(null)}
        agenda={dispositionAgenda}
        employees={employees}
        onSaveDisposition={handleSaveDisposition}
      />

      {/* 3. Report Modal (Advance to Planner C) */}
      <ReportModal
        isOpen={!!reportAgenda}
        onClose={() => setReportAgenda(null)}
        agenda={reportAgenda}
        employees={employees}
        onSaveReport={handleSaveReport}
      />

      {/* 4. Agenda Detail & Dossier Modal */}
      <AgendaDetailModal
        isOpen={!!detailAgenda}
        onClose={() => setDetailAgenda(null)}
        agenda={detailAgenda}
        employees={employees}
        onEdit={(item) => {
          setDetailAgenda(null);
          setEditingAgenda(item);
          setIsCreateModalOpen(true);
        }}
        onDelete={handleDeleteAgenda}
        onOpenDisposition={(item) => {
          setDetailAgenda(null);
          setDispositionAgenda(item);
        }}
        onOpenReport={(item) => {
          setDetailAgenda(null);
          setReportAgenda(item);
        }}
        onUpdateAgenda={(updatedItem) => {
          setAgendas((prev) => prev.map((a) => (a.id === updatedItem.id ? updatedItem : a)));
          setDetailAgenda(updatedItem);
        }}
      />

      {/* 5. Nota Dinas Ber-Kop Resmi Modal */}
      <NotaDinasModal
        isOpen={!!notaDinasAgenda}
        onClose={() => setNotaDinasAgenda(null)}
        agenda={notaDinasAgenda}
        employees={employees}
        initialNotes={notaDinasAgenda?.report?.executionNotes}
        onSaveToReport={handleSaveNotaDinasFromModal}
      />

      {/* 6. Google Sheets Database Management Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        agendas={agendas}
        employees={employees}
        onShowToast={addToast}
      />

      {/* Auto-Dismiss Toast Notifications (2.8s) */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
