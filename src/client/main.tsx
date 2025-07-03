import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

console.log('🔍 DEBUG: main.tsx loaded');

const container = document.getElementById('root');
console.log('🔍 DEBUG: root container found:', !!container);

if (!container) {
  console.error('❌ DEBUG: Root element not found');
  throw new Error('Root element not found');
}

console.log('🔍 DEBUG: Creating React root');
const root = createRoot(container);

console.log('🔍 DEBUG: Rendering App component');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('🔍 DEBUG: App rendered successfully');