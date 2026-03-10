import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';   // 👈 usa la extensión correcta
import './index.css';          // 👈 importa estilos globales (Tailwind + personalizados)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);