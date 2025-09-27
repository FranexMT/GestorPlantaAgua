import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 1. Buscamos el elemento en el DOM
const container = document.getElementById('root');

// 2. Verificamos que el contenedor no sea nulo
if (container) {
  // 3. Creamos la raíz y renderizamos la app
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Error: No se encontró el elemento con id 'root'.");
}