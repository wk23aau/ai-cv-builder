import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// For WordPress, the root element ID is 'ai-cv-builder-root' as defined in the shortcode
const rootElement = document.getElementById('ai-cv-builder-root'); 

if (!rootElement) {
  // Fallback for standalone development or if something goes wrong with shortcode rendering
  const fallbackRoot = document.getElementById('root') || document.createElement('div');
  if (!document.getElementById('root')) {
      fallbackRoot.id = 'root';
      document.body.appendChild(fallbackRoot);
      console.warn("AI CV Builder: Root element #ai-cv-builder-root not found. Using #root as fallback or creating it. Ensure the shortcode is active and correctly rendered.");
  }
   const root = ReactDOM.createRoot(fallbackRoot);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

} else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}
