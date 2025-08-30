import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';
import { AuthProvider } from './AuthContext';
import { I18nProvider } from './I18nContext';
import './stile/index.css';
import 'reactflow/dist/style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <I18nProvider>
        <AdminApp />
      </I18nProvider>
    </AuthProvider>
  </React.StrictMode>
);