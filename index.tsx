
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Enhanced global error handler for mobile debugging
window.onerror = function(message, source, lineno, colno, error) {
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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("ROOT_NODE_NOT_FOUND");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the boot loader once the React cycle starts
setTimeout(() => {
  const loader = document.getElementById('boot-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.5s ease';
    setTimeout(() => loader.remove(), 500);
  }
}, 1000);
