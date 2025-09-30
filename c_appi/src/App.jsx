import React, { useState } from "react";
import InventoryScreen from './screens/InventoryScreen';
import SalesScreen from './screens/SalesScreen';
function App() {
  const [activeScreen, setActiveScreen] = useState('inventory'); // 'inventory' o 'sales'

  return (
    <div>
      {/* Navbar simple para cambiar de pantalla */}
      <nav className="bg-gray-900 shadow-md">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveScreen('inventory')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeScreen === 'inventory'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-blue-100'
                }`}
              >
                Inventario
              </button>
              <button
                onClick={() => setActiveScreen('sales')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeScreen === 'sales'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-blue-100'
                }`}
              >
                Ventas
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Renderizado condicional de la pantalla activa */}
      <main>
        {activeScreen === 'inventory' && <InventoryScreen />}
        {activeScreen === 'sales' && <SalesScreen />}
      </main>
    </div>
  );
}

export default App;