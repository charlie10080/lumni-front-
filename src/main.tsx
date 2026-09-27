import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Programmatic screen orientation unlock to allow full 360° device rotation on mobile phones and tablets
if (typeof window !== 'undefined' && 'screen' in window && window.screen.orientation) {
  const unlockScreen = () => {
    try {
      if (typeof window.screen.orientation.unlock === 'function') {
        window.screen.orientation.unlock();
      }
    } catch {
      // Ignore unsupported browsers
    }
  };

  unlockScreen();
  window.addEventListener('orientationchange', unlockScreen);
  window.addEventListener('resize', unlockScreen);
}

// Register Service Worker for PWA installability and offline support
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('LUMNI PWA Service Worker registrado con éxito:', reg.scope);
      })
      .catch((err) => {
        console.warn('Error al registrar el Service Worker:', err);
      });
  });
}


