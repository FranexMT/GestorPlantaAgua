import React, { useState, useMemo } from 'react';
import { Plus, Download, Search, Edit, Trash2, Eye } from 'lucide-react';

// --- DATOS DE EJEMPLO PARA VENTAS ---
const mockSalesData = [
  { id: 'V-00125', client: 'Abarrotes "La Esperanza"', date: '24/09/2025', total: 450.00, status: 'Pagada' },
  { id: 'V-00124', client: 'Supermercado del Centro', date: '23/09/2025', total: 1200.50, status: 'Pagada' },
  { id: 'V-00123', client: 'Restaurante "El Buen Sabor"', date: '23/09/2025', total: 875.00, status: 'Pendiente' },
  { id: 'V-00122', client: 'Juan Pérez (Ruta 3)', date: '22/09/2025', total: 150.00, status: 'Cancelada' },
];

const StatusBadge = ({ status }) => {
  const statusStyles = {
    'Pagada': 'bg-green-100 text-green-800',
    'Pendiente': 'bg-yellow-100 text-yellow-800',
    'Cancelada': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

export default function SalesScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return mockSalesData.filter(item =>
      item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <svg className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" fill="none" /><path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.17c-2.5-1.44-3.5-3.03-3.5-4.67 0-1.64 1.3-3.14 3.5-4.17.2-.1.45.03.55.25.12.28.01.58-.22.75-1.91.88-2.83 2.1-2.83 3.17s.92 2.29 2.83 3.17c.23.17.34.47.22.75-.1.22-.35.35-.55.25z" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-800">Ventas Base</h1>
        </div>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente o ID de venta..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={18} />
            Nueva Venta
          </button>
          <button className="flex items-center gap-2 bg-white text-gray-700 font-bold py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">ID Venta</th>
              <th className="p-4 font-semibold text-gray-600">Cliente</th>
              <th className="p-4 font-semibold text-gray-600">Fecha</th>
              <th className="p-4 font-semibold text-gray-600">Total</th>
              <th className="p-4 font-semibold text-gray-600">Estado</th>
              <th className="p-4 font-semibold text-gray-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((sale) => (
              <tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-4 text-sm font-mono text-gray-500">{sale.id}</td>
                <td className="p-4 text-sm font-medium text-gray-800">{sale.client}</td>
                <td className="p-4 text-sm text-gray-600">{sale.date}</td>
                <td className="p-4 text-sm font-medium text-gray-800">${sale.total.toFixed(2)}</td>
                <td className="p-4"><StatusBadge status={sale.status} /></td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <button className="text-gray-500 hover:text-gray-700"><Eye size={18} /></button>
                    <button className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                    <button className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}