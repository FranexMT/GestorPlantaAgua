import React, { useState } from 'react';

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const role = 'employee'; // Rol fijo para la base de datos

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin({ name: name.trim(), role });
  }

  return (
    // Fondo más profundo (bg-gray-950) para un contraste más dramático
    <div className="min-h-screen flex items-center justify-center bg-gray-950 font-sans p-4">
      
      {/* 1. Contenedor Principal: Estilo "Dark Card" con un borde de gradiente sutil. */}
      {/* Usamos 'relative' para posicionar el gradiente y 'p-0.5' para que actúe como borde. */}
      <div className="relative p-0.5 rounded-2xl shadow-2xl bg-gradient-to-br from-indigo-500/80 to-purple-500/80">
        
        {/* 2. Formulario Interno: El verdadero contenido, fondo ultra-oscuro */}
        <form 
          onSubmit={handleSubmit} 
          className="w-full max-w-sm p-10 bg-gray-900 rounded-2xl"
        >
          
          {/* Título: Fuente grande, gradiente de color */}
          <h2 className="text-4xl font-extrabold mb-10 text-center tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Bienvenido
          </h2>

          {/* --- Campo Nombre --- */}
          <div className="mb-8">
            <label className="block text-gray-400 text-sm font-medium mb-3">
              Nombre de Usuario
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              // Input mejorado: Esquinas redondeadas, efecto de 'glassmorphism' sutil
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800/50 text-white rounded-xl placeholder-gray-500 transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-inner"
              placeholder="Introduce tu identificador"
              required
              autoFocus
            />
          </div>

          {/* --- Botón de Entrar: Ahora con un gradiente vibrante y animación de presión --- */}
          <button 
            type="submit" 
            disabled={!name.trim()}
            // Gradiente para el color principal
            className={`w-full py-3 rounded-xl text-white font-bold text-lg tracking-wider transition duration-300 ease-in-out transform shadow-xl active:scale-[0.98] ${
              name.trim() 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50'
                : 'bg-gray-700 cursor-not-allowed shadow-none' // Estado deshabilitado
            }`}
          >
            Entrar al Sistema
          </button>
          
          {/* Texto de pie con un espaciado más limpio */}
          <p className="text-center text-xs text-gray-500 mt-8">
              Tu acceso es seguro y validado.
          </p>

        </form>
      </div>
    </div>
  );
}