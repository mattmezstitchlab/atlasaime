import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { StorageNotice } from './components/StorageNotice';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary label="administration"><App /><StorageNotice /><form action="/admin" method="post" className="fixed bottom-16 right-3 z-[200]"><input type="hidden" name="action" value="logout" /><button type="submit" className="rounded-full border border-gray-300 bg-white px-3 py-2 text-xs shadow">Se déconnecter</button></form></ErrorBoundary></StrictMode>);
