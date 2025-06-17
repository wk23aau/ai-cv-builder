// Entry point for the WordPress plugin version
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { generateCVContent } from './services/geminiService';

window.GeminiCVBuilder = {
    init: function(config) {
        const container = document.getElementById(config.containerId);
        
        if (!container) {
            console.error('GeminiCVBuilder: Container not found');
            return;
        }
        
        // Remove loading indicator
        container.innerHTML = '';
        
        // Create root element
        const root = document.createElement('div');
        root.id = 'gcb-root';
        container.appendChild(root);
        
        // Override the gemini service to use the API key from WordPress
        window.gcbConfig = {
            apiKey: config.apiKey,
            ajaxUrl: config.ajaxUrl,
            nonce: config.nonce,
            userId: config.userId,
            isLoggedIn: config.isLoggedIn,
            allowSave: config.allowSave,
            rateLimit: config.rateLimit,
        };
        
        // Render the React app
        ReactDOM.render(
            <App 
                initialTheme={config.theme}
                wpConfig={window.gcbConfig}
            />,
            root
        );
    }
};