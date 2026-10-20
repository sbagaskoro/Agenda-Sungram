import firebaseConfig from '../../firebase-applet-config.json';

const PROVISIONED_CLIENT_ID =
  (firebaseConfig as any)?.oAuthClientId ||
  '640854328583-g4rov5jesu4kec5163570i6qjelu6esk.apps.googleusercontent.com';

const rawEnvId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
// Ignore the old mismatched client ID starting with 440994492851 to prevent Error 400: origin_mismatch
const effectiveClientId =
  rawEnvId && !rawEnvId.startsWith('440994492851-')
    ? rawEnvId
    : PROVISIONED_CLIENT_ID;

export const GOOGLE_DRIVE_CONFIG = {
  clientId: effectiveClientId,
  rootFolderId:
    (import.meta as any).env?.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID ||
    '1q3XOO4kVvdUMeJVxSb8XCbkzi3nT7dOw',
  rootFolderUrl: 'https://drive.google.com/drive/folders/1q3XOO4kVvdUMeJVxSb8XCbkzi3nT7dOw',
  scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
  spreadsheetDefaultTitle: 'Database Surat Masuk & Agenda - Subbag Sungram',
  defaultSheetName: 'Database Surat & Disposisi',
};

export const SPREADSHEET_COLUMNS = [
  'No',
  'Tanggal Input Sistem',
  'Tanggal Surat',
  'Nomor Surat Masuk',
  'Instansi Pengirim',
  'Perihal / Hal Surat',
  'Kategori & Sifat',
  'Pegawai yang Terdisposisi',
  'Instruksi / Arahan Pimpinan',
  'Status Laporan / Agenda',
  'Catatan Hasil & Tindak Lanjut',
  'Tautan Berkas (Google Drive)',
  'ID Agenda Sistem',
  'Terakhir Sinkronisasi',
];

export const INDONESIAN_MONTHS = [
  '01 - Januari',
  '02 - Februari',
  '03 - Maret',
  '04 - April',
  '05 - Mei',
  '06 - Juni',
  '07 - Juli',
  '08 - Agustus',
  '09 - September',
  '10 - Oktober',
  '11 - November',
  '12 - Desember',
];
