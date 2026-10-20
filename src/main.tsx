import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GoogleDriveProvider } from './context/GoogleDriveContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleDriveProvider>
      <App />
    </GoogleDriveProvider>
  </StrictMode>,
);
