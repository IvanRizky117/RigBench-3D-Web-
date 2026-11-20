import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import {applyDeviceTierDomClass} from './utils/deviceTier.ts';

applyDeviceTierDomClass();

createRoot(document.getElementById('root')!).render(<App />);

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const scheduleIdleRegistration = () => {
    const startRegister = () => {
      registerSW({immediate: true});
    };
    const idleWin = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: {timeout: number}) => number;
    };
    if (typeof idleWin.requestIdleCallback === 'function') {
      idleWin.requestIdleCallback(startRegister, {timeout: 3500});
    } else {
      window.setTimeout(startRegister, 2200);
    }
  };

  if (document.readyState === 'complete') {
    scheduleIdleRegistration();
  } else {
    window.addEventListener('load', scheduleIdleRegistration, {once: true});
  }
}
