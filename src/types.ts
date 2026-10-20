export type PlannerStage = 'Received' | 'In_Progress' | 'Completed';

export type MailUrgency = 'Biasa' | 'Segera' | 'Sangat Segera' | 'Rahasia';

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  nip?: string;
  avatarBg?: string;
}

export interface AgendaReportPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface NotaDinasConfig {
  documentType: 'NOTA_DINAS' | 'NOTULEN_RAPAT';
  customTitle?: string; // e.g. "NOTA DINAS" or "NOTULEN RAPAT KINERJA DAN EVALUASI KINERJA"
  nomorNota?: string;
  kepada?: string;
  dari?: string;
  tanggalNota?: string;
  sifat?: 'Biasa' | 'Penting' | 'Segera' | 'Sangat Segera';
  lampiran?: string;
  hal?: string;
  substansiNotes: string; // Live-customizable report substance
  tempatTanggalTtd?: string; // e.g. "Surabaya, 23 September 2026"
  penandatanganNama?: string;
  penandatanganNip?: string;
  penandatanganJabatan?: string;
  includePhotos?: boolean;
}

export interface AgendaReport {
  reportedByEmployeeId: string;
  reportedByName: string;
  reportedAt: string;
  executionNotes: string;
  followUpAction?: string;
  photos?: AgendaReportPhoto[];
  notaDinas?: NotaDinasConfig;
}

export interface AgendaDisposition {
  assignedEmployeeIds: string[]; // 1. Tagging staf terdisposisi
  disposerName: string; // Yuniar Vidianto, S.T., M.T.
  disposerRole: string; // Kepala Sub Bagian Penyusunan Program dan Anggaran
  disposerNote: string; // 2. Catatan dari pendisposisi
  disposedAt: string;
  priority?: 'Biasa' | 'Penting' | 'Mendesak';
}

export interface AgendaItem {
  id: string;
  // Step 2: Data Surat Masuk (Manual / Autofill AI)
  letterNumber: string; // Nomor Surat
  sender: string; // Instansi Asal Surat
  letterDate: string; // Tanggal Surat (YYYY-MM-DD)
  subject: string; // Perihal Surat
  urgency: MailUrgency;
  attachmentName?: string;

  // Step 3: Waktu & Lokasi Pelaksanaan
  eventDate: string; // Tanggal Pelaksanaan (YYYY-MM-DD)
  startTime: string; // Jam Mulai (HH:mm)
  endTime: string; // Jam Selesai (HH:mm)
  location: string; // Tempat / Ruang

  // Status Alur
  stage: PlannerStage; // 'Received' (A) | 'In_Progress' (B) | 'Completed' (C)
  createdAt: string;

  // Planner B Requirement (Disposisi)
  disposition?: AgendaDisposition;

  // Planner C Requirement (Laporan Pelaksanaan)
  report?: AgendaReport;

  // Google Drive Database Storage
  driveFileId?: string;
  driveViewLink?: string;
  driveDownloadLink?: string;
  driveFolderId?: string;
  driveFolderPath?: string; // e.g. "2026/09 - September"
  driveUploadedAt?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}
