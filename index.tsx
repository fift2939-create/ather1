
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("ATHAR: Starting application mounting process...");

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("ATHAR: Root element not found!");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("ATHAR: React Render successful.");
  } catch (error) {
    console.error("ATHAR: Mounting Error:", error);
    const display = document.getElementById('error-display');
    if (display) {
      display.style.display = 'block';
      display.innerText = "فشل التحميل: " + (error as Error).message;
    }
  }
};

// تأكد من تحميل المستند بالكامل قبل البدء
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startApp();
} else {
  window.addEventListener('DOMContentLoaded', startApp);
}
