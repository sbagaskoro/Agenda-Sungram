import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { GOOGLE_DRIVE_CONFIG } from '../config/driveConfig';
import { AgendaItem, Employee } from '../types';

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink?: string;
  folderPath: string; // e.g. "2026/09 - September"
  folderId: string;
  size?: string;
}

interface GoogleDriveContextType {
  isConnected: boolean;
  isConnecting: boolean;
  hasValidAuth: boolean;
  accessToken: string | null;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  rootFolderId: string;
  rootFolderUrl: string;
  connectDrive: (promptType?: string) => Promise<boolean>;
  disconnectDrive: () => void;
  clearSession: () => void;
  uploadFileToDrive: (
    file: File,
    letterDate: string,
    letterNumber: string,
    subject: string
  ) => Promise<DriveUploadResult>;
  deleteFileFromDrive: (fileId: string) => Promise<boolean>;

  // Google Sheets Database Integration
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  sheetName: string;
  isSyncingSheets: boolean;
  lastSyncedAt: string | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  initOrCreateSpreadsheet: (
    customIdOrUrl?: string,
    options?: { forceNew?: boolean }
  ) => Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetName: string }>;
  verifySpreadsheetAccess: (idToCheck?: string) => Promise<{ valid: boolean; error?: string; title?: string }>;
  syncAgendaToSheets: (agenda: AgendaItem, employees: Employee[]) => Promise<boolean>;
  syncAllAgendasToSheets: (agendas: AgendaItem[], employees: Employee[]) => Promise<{ success: boolean; syncedCount: number; spreadsheetUrl: string }>;
  disconnectSpreadsheet: () => void;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: 'subbag_sungram_drive_token_v1',
  EXPIRY: 'subbag_sungram_drive_expiry_v1',
  USER_EMAIL: 'subbag_sungram_drive_email_v1',
  USER_NAME: 'subbag_sungram_drive_name_v1',
  USER_AVATAR: 'subbag_sungram_drive_avatar_v1',
  SHEET_ID: 'subbag_sungram_sheets_id_v1',
  SHEET_URL: 'subbag_sungram_sheets_url_v1',
  LAST_SYNC: 'subbag_sungram_sheets_last_sync_v1',
  AUTO_SYNC: 'subbag_sungram_sheets_autosync_v1',
};

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleDriveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.EXPIRY);
    if (saved && expiry && Number(expiry) > Date.now()) {
      return saved;
    }
    return null;
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || null;
  });
  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || null;
  });
  const [userAvatar, setUserAvatar] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_AVATAR) || null;
  });

  // Google Sheets Database State
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.SHEET_ID) ||
      (import.meta as any).env?.VITE_GOOGLE_SPREADSHEET_ID ||
      null
    );
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
    if (savedUrl) return savedUrl;
    const initialId =
      localStorage.getItem(STORAGE_KEYS.SHEET_ID) ||
      (import.meta as any).env?.VITE_GOOGLE_SPREADSHEET_ID;
    return initialId ? `https://docs.google.com/spreadsheets/d/${initialId}/edit` : null;
  });
  const [sheetName] = useState('Database Surat & Disposisi');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || null;
  });
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
    return saved !== null ? saved === 'true' : true; // Default auto-sync ON
  });

  const setAutoSyncEnabled = (enabled: boolean) => {
    setAutoSyncEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, String(enabled));
  };

  const [isConnecting, setIsConnecting] = useState(false);
  // Drive integration is active by default; files route to root folder 1q3XOO4kVvdUMeJVxSb8XCbkzi3nT7dOw
  const isConnected = true;

  // Helper to get non-expired access token or null
  const getValidToken = useCallback((): string | null => {
    const saved = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.EXPIRY);
    if (saved && expiry && Number(expiry) > Date.now()) {
      return saved;
    }
    if (saved) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.EXPIRY);
      setAccessToken(null);
    }
    return null;
  }, []);

  const hasValidAuth = !!(accessToken || getValidToken());

  // Sync token to localStorage
  const saveSession = (token: string, expiresInSeconds: number, email?: string, name?: string, avatar?: string) => {
    const expiry = Date.now() + (expiresInSeconds - 60) * 1000;
    setAccessToken(token);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.EXPIRY, expiry.toString());

    if (email) {
      setUserEmail(email);
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    }
    if (name) {
      setUserName(name);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    }
    if (avatar) {
      setUserAvatar(avatar);
      localStorage.setItem(STORAGE_KEYS.USER_AVATAR, avatar);
    }
  };

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUserEmail(null);
    setUserName(null);
    setUserAvatar(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_AVATAR);
  }, []);

  // Connect via GIS tokenClient with Google Drive & Google Sheets scopes
  const connectDrive = useCallback((promptType: string = 'select_account'): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsConnecting(true);

      if (!window.google?.accounts?.oauth2) {
        console.warn('Google Identity Services belum dimuat.');
        setIsConnecting(false);
        resolve(false);
        return;
      }

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_DRIVE_CONFIG.clientId,
          scope: GOOGLE_DRIVE_CONFIG.scopes,
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error('GIS OAuth Error:', tokenResponse);
              setIsConnecting(false);
              resolve(false);
              return;
            }

            const token = tokenResponse.access_token;
            const expiresIn = tokenResponse.expires_in ? Number(tokenResponse.expires_in) : 3600;

            // Fetch profile info
            let email = 'sungram11dishub@gmail.com';
            let name = 'Subbag Sungram Dishub Jatim';
            let avatar = '';

            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (profileRes.ok) {
                const profile = await profileRes.json();
                email = profile.email || email;
                name = profile.name || name;
                avatar = profile.picture || '';
              }
            } catch (err) {
              console.warn('Info profil Google tidak didapat:', err);
            }

            saveSession(token, expiresIn, email, name, avatar);
            setIsConnecting(false);
            resolve(true);
          },
        });

        tokenClient.requestAccessToken({ prompt: promptType });
      } catch (err) {
        console.error('Gagal inisialisasi GIS client:', err);
        setIsConnecting(false);
        resolve(false);
      }
    });
  }, []);

  const disconnectDrive = useCallback(() => {
    if (accessToken && window.google?.accounts?.oauth2?.revoke) {
      try {
        window.google.accounts.oauth2.revoke(accessToken, () => {
          clearSession();
        });
      } catch {
        clearSession();
      }
    } else {
      clearSession();
    }
  }, [accessToken]);

  // Upload file to Drive (calls server proxy which creates [Tahun] -> [Bulan] folders)
  const uploadFileToDrive = useCallback(
    async (
      file: File,
      letterDate: string,
      letterNumber: string,
      subject: string
    ): Promise<DriveUploadResult> => {
      const currentToken = accessToken || localStorage.getItem(STORAGE_KEYS.TOKEN);

      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = (reader.result as string).split(',')[1];
          resolve(res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const response = await fetch('/api/drive/upload-letter', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileName: file.name,
          fileBase64,
          mimeType: file.type || 'application/pdf',
          letterDate,
          letterNumber,
          subject,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Gagal mengunggah berkas' }));
        throw new Error(errorData.error || `Unggah gagal dengan status ${response.status}`);
      }

      return (await response.json()) as DriveUploadResult;
    },
    [accessToken]
  );

  // Delete file from Drive
  const deleteFileFromDrive = useCallback(
    async (fileId: string): Promise<boolean> => {
      const currentToken = accessToken || localStorage.getItem(STORAGE_KEYS.TOKEN);

      try {
        const headers: Record<string, string> = {};
        if (currentToken) {
          headers['Authorization'] = `Bearer ${currentToken}`;
        }
        const response = await fetch(`/api/drive/delete-letter/${fileId}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => null);
          console.warn('Gagal menghapus berkas di Google Drive:', err);
          return false;
        }

        return true;
      } catch (err) {
        console.error('Error saat menghapus berkas Google Drive:', err);
        return false;
      }
    },
    [accessToken]
  );

  // ==========================================
  // GOOGLE SHEETS DATABASE METHODS
  // ==========================================

  const buildEmployeesMap = (employees: Employee[]): Record<string, string> => {
    const map: Record<string, string> = {};
    employees.forEach((e) => {
      map[e.id] = e.name;
    });
    return map;
  };

  // Initialize or connect to a Google Spreadsheet
  const initOrCreateSpreadsheet = useCallback(
    async (customIdOrUrl?: string, options?: { forceNew?: boolean }) => {
      let currentToken = accessToken || getValidToken();
      if (!currentToken) {
        // If user is linking an existing spreadsheet ID or URL (e.g. open/public access), directly link it!
        if (customIdOrUrl && !options?.forceNew) {
          let cleanId = customIdOrUrl.trim();
          if (cleanId.includes('/spreadsheets/d/')) {
            const matches = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            if (matches && matches[1]) {
              cleanId = matches[1];
            }
          }
          const url = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;
          setSpreadsheetId(cleanId);
          setSpreadsheetUrl(url);
          localStorage.setItem(STORAGE_KEYS.SHEET_ID, cleanId);
          localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
          return {
            spreadsheetId: cleanId,
            spreadsheetUrl: url,
            sheetName: 'Database Surat & Disposisi',
          };
        }

        const connected = await connectDrive('select_account');
        if (!connected) {
          throw new Error('Akun Google belum terhubung. Silakan klik tombol "Hubungkan Akun Google" dan setujui izin akses.');
        }
        currentToken = getValidToken();
        if (!currentToken) {
          throw new Error('Otentikasi Google belum selesai. Silakan hubungkan akun Google Anda.');
        }
      }

      // If forceNew is requested, send empty ID so server generates a brand new spreadsheet
      const targetId = options?.forceNew ? '' : (customIdOrUrl?.trim() || '');

      setIsSyncingSheets(true);
      try {
        const callInitApi = async (tokenToUse: string) => {
          return await fetch('/api/sheets/init-database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokenToUse}`,
            },
            body: JSON.stringify({
              spreadsheetId: targetId,
              title: GOOGLE_DRIVE_CONFIG.spreadsheetDefaultTitle,
            }),
          });
        };

        let res = await callInitApi(currentToken);

        // Auto-recover on 401: clear stale session and retry
        if (res.status === 401) {
          clearSession();
          const reconnected = await connectDrive('select_account');
          if (reconnected) {
            const freshToken = getValidToken();
            if (freshToken) {
              res = await callInitApi(freshToken);
            }
          }
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Gagal inisialisasi Spreadsheet' }));
          throw new Error(errData.error || `Inisialisasi gagal dengan status ${res.status}`);
        }

        const data = await res.json();
        const newId = data.spreadsheetId;
        const newUrl = data.spreadsheetUrl;

        setSpreadsheetId(newId);
        setSpreadsheetUrl(newUrl);
        localStorage.setItem(STORAGE_KEYS.SHEET_ID, newId);
        localStorage.setItem(STORAGE_KEYS.SHEET_URL, newUrl);

        return {
          spreadsheetId: newId,
          spreadsheetUrl: newUrl,
          sheetName: data.sheetName || 'Database Surat & Disposisi',
        };
      } finally {
        setIsSyncingSheets(false);
      }
    },
    [accessToken, connectDrive, getValidToken, clearSession]
  );

  // Verifies if the spreadsheet exists and is accessible
  const verifySpreadsheetAccess = useCallback(
    async (idToCheck?: string): Promise<{ valid: boolean; error?: string; title?: string }> => {
      const targetId = idToCheck || spreadsheetId;
      if (!targetId) return { valid: false, error: 'Belum ada ID Spreadsheet yang terhubung.' };
      const currentToken = accessToken || localStorage.getItem(STORAGE_KEYS.TOKEN);

      try {
        const headers: Record<string, string> = {};
        if (currentToken) {
          headers['Authorization'] = `Bearer ${currentToken}`;
        }
        const res = await fetch(`/api/sheets/verify/${targetId}`, { headers });
        if (!res.ok) {
          return { valid: false, error: `Gagal verifikasi (${res.status})` };
        }
        return await res.json();
      } catch (err: any) {
        return { valid: false, error: err?.message || 'Gagal memeriksa spreadsheet' };
      }
    },
    [accessToken, spreadsheetId]
  );

  // Sync a single agenda item into the Google Spreadsheet
  const syncAgendaToSheets = useCallback(
    async (agenda: AgendaItem, employees: Employee[]): Promise<boolean> => {
      let currentToken = accessToken || localStorage.getItem(STORAGE_KEYS.TOKEN);
      let targetSheetId = spreadsheetId || localStorage.getItem(STORAGE_KEYS.SHEET_ID);

      // If user isn't connected or sheet is not created, don't throw blocking error on auto-sync
      if (!currentToken || !targetSheetId) {
        return false;
      }

      setIsSyncingSheets(true);
      try {
        const employeesMap = buildEmployeesMap(employees);
        const res = await fetch('/api/sheets/sync-agenda', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            spreadsheetId: targetSheetId,
            sheetName,
            agenda,
            employeesMap,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          console.warn('Gagal sinkronisasi agenda ke Google Sheets:', err);
          return false;
        }

        const now = new Date().toISOString();
        setLastSyncedAt(now);
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
        return true;
      } catch (err) {
        console.error('Error saat sinkronisasi agenda ke Sheets:', err);
        return false;
      } finally {
        setIsSyncingSheets(false);
      }
    },
    [accessToken, spreadsheetId, sheetName]
  );

  // Bulk sync all agendas to Google Spreadsheet
  const syncAllAgendasToSheets = useCallback(
    async (
      agendas: AgendaItem[],
      employees: Employee[]
    ): Promise<{ success: boolean; syncedCount: number; spreadsheetUrl: string }> => {
      let currentToken = accessToken || getValidToken();
      if (!currentToken) {
        const connected = await connectDrive('select_account');
        if (!connected) {
          throw new Error('Akun Google belum terhubung. Silakan login Google terlebih dahulu.');
        }
        currentToken = getValidToken();
        if (!currentToken) {
          throw new Error('Otentikasi Google belum selesai. Silakan hubungkan akun Google Anda.');
        }
      }

      let targetSheetId = spreadsheetId || localStorage.getItem(STORAGE_KEYS.SHEET_ID);

      // If no spreadsheet configured yet, auto-initialize a new one
      if (!targetSheetId) {
        const initResult = await initOrCreateSpreadsheet();
        targetSheetId = initResult.spreadsheetId;
      }

      setIsSyncingSheets(true);
      try {
        const employeesMap = buildEmployeesMap(employees);
        const res = await fetch('/api/sheets/sync-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            spreadsheetId: targetSheetId,
            sheetName,
            agendas,
            employeesMap,
          }),
        });

        if (res.status === 401) {
          clearSession();
          throw new Error('Sesi otentikasi Google telah berakhir (401). Silakan hubungkan ulang akun Google Anda.');
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Gagal sinkronisasi data' }));
          throw new Error(errData.error || `Sinkronisasi gagal dengan status ${res.status}`);
        }

        const data = await res.json();
        const now = new Date().toISOString();
        setLastSyncedAt(now);
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);

        return {
          success: true,
          syncedCount: data.syncedCount || agendas.length,
          spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${targetSheetId}/edit`,
        };
      } finally {
        setIsSyncingSheets(false);
      }
    },
    [accessToken, connectDrive, getValidToken, clearSession, spreadsheetId, sheetName, initOrCreateSpreadsheet]
  );

  const disconnectSpreadsheet = useCallback(() => {
    setSpreadsheetId(null);
    setSpreadsheetUrl(null);
    setLastSyncedAt(null);
    localStorage.removeItem(STORAGE_KEYS.SHEET_ID);
    localStorage.removeItem(STORAGE_KEYS.SHEET_URL);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  }, []);

  return (
    <GoogleDriveContext.Provider
      value={{
        isConnected,
        isConnecting,
        hasValidAuth,
        accessToken,
        userEmail,
        userName,
        userAvatar,
        rootFolderId: GOOGLE_DRIVE_CONFIG.rootFolderId,
        rootFolderUrl: GOOGLE_DRIVE_CONFIG.rootFolderUrl,
        connectDrive,
        disconnectDrive,
        clearSession,
        uploadFileToDrive,
        deleteFileFromDrive,

        // Google Sheets Integration
        spreadsheetId,
        spreadsheetUrl,
        sheetName,
        isSyncingSheets,
        lastSyncedAt,
        autoSyncEnabled,
        setAutoSyncEnabled,
        initOrCreateSpreadsheet,
        verifySpreadsheetAccess,
        syncAgendaToSheets,
        syncAllAgendasToSheets,
        disconnectSpreadsheet,
      }}
    >
      {children}
    </GoogleDriveContext.Provider>
  );
};

export const useGoogleDrive = () => {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};
