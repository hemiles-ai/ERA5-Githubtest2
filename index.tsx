import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("SYSTEM: Kernel_Start");

// Global error handler for runtime crashes
window.onerror = function(message, source, lineno, colno, error) {
  console.error("CRASH_DETECTED:", message);
  const loader = document.getElementById('boot-loader');
  if (loader) loader.style.display = 'none';
  
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #000; color: #ff3333; padding: 30px; font-family: 'JetBrains Mono', monospace; height: 100vh; display: flex; flex-direction: column; justify-content: center;">
        <h2 style="letter-spacing: 0.2em; font-size: 14px; margin-bottom: 20px;">CRITICAL_SYSTEM_FAILURE</h2>
        <p style="font-size: 10px; color: rgba(255,255,255,0.5); line-height: 1.6;">
          ERROR: ${message}<br/>
          SOURCE: ${source}<br/>
          LINE: ${lineno}:${colno}
        </p>
        <button onclick="window.location.reload()" style="margin-top: 40px; background: transparent; border: 1px solid #333; color: white; padding: 10px; font-size: 10px; cursor: pointer;">REBOOT_KERNEL</button>
      </div>
    `;
  }
};

const init = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("ERR: Root element missing");
      return;
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    console.log("SYSTEM: UI_Rendered");

    // Clear loader once React is ready
    setTimeout(() => {
      const loader = document.getElementById('boot-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    }, 500);
  } catch (err: any) {
    console.error("INIT_ERROR:", err);
    // Fix: Cast window to any to access custom logError property which might be injected by external scripts or debuggers
    if ((window as any).logError) (window as any).logError("INIT_FAIL: " + err.message);
  }
};

// Ensure DOM is ready before init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
