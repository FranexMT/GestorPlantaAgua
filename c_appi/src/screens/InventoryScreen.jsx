import React, { useState, useMemo } from 'react';
import { Plus, Download, Search, Edit, Eye, Archive } from 'lucide-react';

// --- DATOS DE EJEMPLO SIMULADOS (Para que la tabla se vea llena) ---
const mockInventoryData = [
    { id: 'P-001', name: 'Garrafón 20L', stock: 25, price: 500.00, lastUpdate: '25/09/2025' },
    { id: 'P-002', name: 'Botella PET 1L', stock: 30, price: 300.00, lastUpdate: '25/09/2025' },
    { id: 'P-003', name: 'Pack 6 PET 500mls', stock: 10, price: 990.00, lastUpdate: '24/09/2025' },
    { id: 'P-005', name: 'Botella PET 500ml', stock: 5, price: 150.00, lastUpdate: '25/09/2025' }, // Bajo stock
];

export default function App() {
    // 1. Estado para la búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // 2. Lógica de filtrado de datos 
    const filteredData = useMemo(() => {
        return mockInventoryData.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    // 3. Función placeholder para acciones
    const handleActionPlaceholder = (action, id) => {
        console.log(`[MAQUETA - ACCIÓN] Se intentó realizar la acción: ${action} en el producto: ${id}`);
        // Aquí iría la lógica real (ej: abrir modal, llamar a la BD, etc.)
    };

    return (
        // Contenedor principal con tema oscuro y padding responsivo
        <div className="p-4 sm:p-8 bg-gray-900 min-h-screen font-sans">
            <header className="flex justify-between items-center mb-6 border-b border-blue-700/50 pb-4">
                <div className="flex items-center gap-4">
                    {/* Icono de inventario (Stock/Caja) */}
                    <svg className="h-10 w-10 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 16H5V8h14v10zm-6-8h-2v4h2v-4zM7 6h10v2H7V6z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-100">Inventario Base</h1>
                </div>
            </header>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                {/* Barra de Búsqueda */}
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ID..."
                        className="w-full pl-10 pr-4 py-2 border border-blue-600/50 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Botones de Acción */}
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => handleActionPlaceholder('Crear Nuevo', 'N/A')}
                        className="flex items-center gap-2 relative p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} />
                        Nuevo (placeholder)
                    </button>
                </div>
            </div>

            {/* Tabla de Inventario */}
            <div className="bg-gray-800/80 rounded-xl shadow-2xl border border-blue-700/30 overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-700/50 backdrop-blur-sm sticky top-0">
                        <tr>
                            <th className="p-4 font-semibold text-blue-400">ID Producto</th>
                            <th className="p-4 font-semibold text-blue-400">Nombre</th>
                            <th className="p-4 font-semibold text-blue-400">Stock Actual</th>
                            <th className="p-4 font-semibold text-blue-400">Precio Venta</th>
                            <th className="p-4 font-semibold text-blue-400">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((product, index) => {
                            const rowClass = index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/50';

                            let stockBadgeClasses = 'bg-green-700/30 text-green-300'; // Suficiente stock

                            if (product.stock < 10) {
                                stockBadgeClasses = 'bg-red-700/30 text-red-300'; // Muy bajo
                            } else if (product.stock < 20) {
                                stockBadgeClasses = 'bg-yellow-700/30 text-yellow-300'; // Advertencia
                            }

                            return (
                                <tr
                                    key={product.id}
                                    className={`border-b border-gray-700 ${rowClass} hover:!bg-gray-700 transition-colors`}
                                >
                                    <td className="p-4 text-sm font-mono text-gray-400">{product.id}</td>
                                    <td className="p-4 text-sm font-medium text-gray-100">{product.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockBadgeClasses}`}>
                                            {product.stock} Unidades
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-green-400">${product.price.toFixed(2)}</td>
                                    <td className="p-4">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleActionPlaceholder('Editar', product.id)}
                                                className="relative inline-block p-px font-semibold leading-6 text-blue-500 
                                                hover:text-blue-300 bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 
                                                transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:ring-2 hover:ring-blue-500"
                                                title="Editar Producto (Placeholder)"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleActionPlaceholder('Archivar', product.id)}
                                                className="relative inline-block p-px font-semibold leading-6 text-red-500 
                                                hover:text-red-300 bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 
                                                transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:ring-2 hover:ring-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-0"
                                                title="Archivar/Eliminar (Placeholder)"
                                            >
                                                <Archive size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredData.length === 0 && (
                    <div className="p-6 text-center text-gray-400">
                        No se encontraron productos que coincidan con la búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
}
