import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PublicPortfolio } from './components/portfolio/PublicPortfolio';
createRoot(document.getElementById('root')!).render(<StrictMode><PublicPortfolio /></StrictMode>);
