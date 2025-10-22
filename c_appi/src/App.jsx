import React, { useState } from "react";
import InventoryScreen from './screens/InventoryScreen';
import SalesScreen from './screens/SalesScreen';
import LoginScreen from './screens/LoginScreen';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from 'react-toastify';

function App() {
  const [activeScreen, setActiveScreen] = useState('inventory'); // 'inventory' o 'sales'
  const [user, setUser] = useState(null); // { name, role }

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark-blue"
        toastClassName="custom-toast"
      />
      {user && (
        <nav className="bg-gray-900 shadow-md">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setActiveScreen('inventory')}
                  className={`relative inline-block p-px font-semibold leading-6 text-white border bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:border-[#646cff]`}
                >
                  Inventario
                </button>
                <button
                  onClick={() => setActiveScreen('sales')}
                  className={`relative inline-block p-px font-semibold leading-6 text-white border bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:border-[#646cff]`}
                >
                  Ventas
                </button>
                <div className="flex items-center space-x-4 ml-6">
                  <span className="text-sm text-gray-300">{user.name} ({user.role})</span>
                  <button
                    onClick={() => setUser(null)}
                    className="px-3 py-1 bg-red-600 rounded text-white"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Renderizado condicional de la pantalla activa */}
      <main>
        {!user ? (
          <LoginScreen onLogin={(u) => { setUser(u); setActiveScreen('inventory'); }} />
        ) : (
          <>
            {activeScreen === 'inventory' && <InventoryScreen user={user} />}
            {activeScreen === 'sales' && <SalesScreen user={user} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;