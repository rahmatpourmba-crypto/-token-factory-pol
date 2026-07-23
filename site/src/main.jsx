import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LanguageProvider } from './i18n.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);