import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './AuthContext';
import { I18nProvider } from './I18nContext';
import { AppProvider } from './AppContext';
import './stile/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <I18nProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </I18nProvider>
    </AuthProvider>
  </React.StrictMode>
);