
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Signal to the bootloader that we've started
(window as any).REACT_MOUNTED = true;

const log = (msg: string) => {
  console.log(`[KERNEL] ${msg}`);
  const status = document.getElementById('boot-status');
  if (status) status.innerText = msg;
};

const mount = () => {
  try {
    log("Mounting_UI_Engine...");
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      throw new Error("ROOT_MISSING");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    log("Kernel_Active_Success");

    // Smooth exit
    setTimeout(() => {
      const loader = document.getElementById('boot-loader');
      const diag = document.getElementById('diag-console');
      if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.6s ease';
        setTimeout(() => {
            loader.style.display = 'none';
            if (diag) diag.style.display = 'none';
        }, 600);
      }
    }, 500);

  } catch (err: any) {
    console.error("BOOT_CRASH:", err);
    log(`BOOT_CRASH: ${err.message}`);
  }
};

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
