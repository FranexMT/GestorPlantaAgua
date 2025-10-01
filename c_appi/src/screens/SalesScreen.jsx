import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Search, Edit, Trash2, Eye, X } from 'lucide-react';

// --- DATOS DE EJEMPLO PARA VENTAS ---
const initialSalesData = [
  { id: 'V-00125', client: 'Abarrotes "La Esperanza"', date: '24/09/2025', total: 450.00, status: 'Pagada' },
  { id: 'V-00124', client: 'Supermercado del Centro', date: '23/09/2025', total: 1200.50, status: 'Pagada' },
  { id: 'V-00123', client: 'Restaurante "El Buen Sabor"', date: '23/09/2025', total: 875.00, status: 'Pendiente' },
  { id: 'V-00122', client: 'Juan Pérez (Ruta 3)', date: '22/09/2025', total: 150.00, status: 'Cancelada' },
];

const StatusBadge = ({ status }) => {
  const statusStyles = {
    'Pagada': 'bg-green-500/50 text-green-200 ',
    'Pendiente': 'bg-yellow-300/30 text-yellow-200 ',
    'Cancelada': 'bg-red-500/50 text-red-200  ',

   
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
};
const SaleModal = ({ isOpen, onClose, onSave, sale }) => {
    const [formData, setFormData] = useState({});
    const isEditing = sale !== null;

    useEffect(() => {
        if (isOpen) {
            setFormData(isEditing ? { ...sale } : { client: '', total: '', status: 'Pendiente', date: new Date().toISOString().split('T')[0] });
        }
    }, [isOpen, sale, isEditing]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, total: parseFloat(formData.total) });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-lg m-4">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-gray-100">{isEditing ? 'Editar Venta' : 'Registrar Nueva Venta'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-blue-300 mb-1">Nombre del Cliente</label>
                        <input type="text" name="client" id="client" value={formData.client || ''} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label htmlFor="total" className="block text-sm font-medium text-blue-300 mb-1">Monto Total ($)</label>
                            <input type="number" step="0.01" name="total" id="total" value={formData.total || ''} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="status" className="block text-sm font-medium text-blue-300 mb-1">Estado</label>
                            <select name="status" id="status" value={formData.status || 'Pendiente'} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Pendiente</option>
                                <option>Pagada</option>
                                <option>Cancelada</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-semibold">{isEditing ? 'Guardar Cambios' : 'Crear Venta'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modal para ver los detalles de una venta
const SaleDetailsModal = ({ isOpen, onClose, sale }) => {
    if (!isOpen || !sale) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-lg m-4">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-gray-100">Detalles de la Venta: <span className="text-blue-400">{sale.id}</span></h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="p-6 text-gray-300 space-y-3">
                    <p><strong>Cliente:</strong> {sale.client}</p>
                    <p><strong>Fecha:</strong> {new Date(sale.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Monto Total:</strong> <span className="font-bold text-green-400">${sale.total.toFixed(2)}</span></p>
                    <p><strong>Estado:</strong> <StatusBadge status={sale.status} /></p>
                    <div className="pt-2">
                        <h3 className="font-semibold text-blue-300 border-b border-gray-700 pb-1 mb-2">Artículos Vendidos:</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {sale.items?.map((item, index) => (
                                <li key={index}>{item.qty} x {item.name} (@ ${item.price.toFixed(2)} c/u)</li>
                            )) || <li>No hay detalles de artículos.</li>}
                        </ul>
                    </div>
                </div>
                 <div className="p-4 bg-gray-900/50 rounded-b-xl text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">Cerrar</button>
                </div>
            </div>
        </div>
    );
};


export default function SalesScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sales, setSales] = useState(initialSalesData);
  const handleExportData = () => {
  // Puedes usar filteredData para exportar solo lo que se ve en la tabla
  const dataToExport = filteredData;

  // Cabeceras del CSV
  const headers = "ID Venta,Cliente,Fecha,Total,Estado";

  // Convertimos cada venta en una fila CSV
  const csvContent = [
    headers,
    ...dataToExport.map(s => `${s.id},"${s.client}",${s.date},${s.total.toFixed(2)},${s.status}`)
  ].join("\n");

  // Crear blob y enlace para descarga
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) { // soporte navegador
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "reporte_ventas.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
  // Abrir modal para nueva venta
const handleOpenNewSale = () => {
  setEditingSale(null);
  setIsModalOpen(true);
};

// Abrir modal para editar venta
const handleOpenEditSale = (sale) => {
  setEditingSale(sale);
  setIsModalOpen(true);
};

// Abrir modal de detalles
const handleOpenDetailsSale = (sale) => {
  setDetailsSale(sale);
};

// Eliminar venta
const handleDeleteSale = (saleId) => {
  setSales(prev => prev.filter(s => s.id !== saleId));
};

// Guardar venta nueva o editada
const handleSaveSale = (sale) => {
  if (editingSale) {
    // Editar
    setSales(prev => prev.map(s => s.id === editingSale.id ? { ...sale, id: editingSale.id } : s));
  } else {
    // Crear nueva venta con ID aleatorio
    const newId = `V-${(Math.floor(Math.random() * 90000) + 10000).toString()}`;
    setSales(prev => [{ ...sale, id: newId }, ...prev]);
  }
};


// Modales
const [isModalOpen, setIsModalOpen] = useState(false);   // Para crear/editar venta
const [editingSale, setEditingSale] = useState(null);    // Venta que se está editando
const [detailsSale, setDetailsSale] = useState(null);    // Venta que se ve en detalle

  const filteredData = useMemo(() => {
    return sales.filter(item =>
      item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm,sales]);

  return (
    <div className="p-8 bg-gray-900 min-h-screen font-sans">
      <SaleModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSave={handleSaveSale}
  sale={editingSale}
/>

<SaleDetailsModal
  isOpen={!!detailsSale}
  onClose={() => setDetailsSale(null)}
  sale={detailsSale}
/>

      <header className="flex justify-between items-center mb-6 border-b border-blue-700/50 pb-4">
        <div className="flex items-center gap-4">
          <svg className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" fill="none" /><path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.17c-2.5-1.44-3.5-3.03-3.5-4.67 0-1.64 1.3-3.14 3.5-4.17.2-.1.45.03.55.25.12.28.01.58-.22.75-1.91.88-2.83 2.1-2.83 3.17s.92 2.29 2.83 3.17c.23.17.34.47.22.75-.1.22-.35.35-.55.25z" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-100">Ventas Base</h1>
        </div>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente o ID de venta..."
            className="w-full pl-10 pr-4 py-2 border border-blue-600/50 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleOpenNewSale} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-blue-500/30">
            <Plus size={25} />
            Nueva Venta
          </button>
          <button onClick={handleExportData} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-blue-500/30">
            <Download size={25} />
            Exportar
          </button> 
        </div>
      </div>
     

      <div className="bg-gray-800/80 rounded-xl shadow-2xl border border-blue-700/30 overflow-x-auto">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-gray-700/70 backdrop-blur-sm sticky top-0">
            <tr>
              <th className="p-4 font-semibold text-blue-400">ID Venta</th>
              <th className="p-4 font-semibold text-blue-400">Cliente</th>
              <th className="p-4 font-semibold text-blue-400">Fecha</th>
              <th className="p-4 font-semibold text-blue-400">Total</th>
              <th className="p-4 font-semibold text-blue-400">Estado</th>
              <th className="p-4 font-semibold text-blue-400">Acción</th>
            </tr>
          </thead>    
          <tbody>
            {filteredData.map((sale, index) => {
              const rowClass = index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/50';
              return (
                <tr key={sale.id} className={`${rowClass} border-b border-gray-700 hover:!bg-gray-700 transition-colors`}>
                  <td className="p-4 text-sm font-mono text-gray-400">{sale.id}</td>
                  <td className="p-4 text-sm font-medium text-gray-100">{sale.client}</td>
                  <td className="p-4 text-sm text-gray-100">{sale.date}</td>
                  <td className="p-4 text-sm font-medium text-green-400">${sale.total.toFixed(2)}</td>
                  <td className="p-4"><StatusBadge status={sale.status} /></td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <button className="text-gray-500 hover:text-gray-700" onClick={() => handleOpenDetailsSale(sale)}><Eye size={18} /></button>
                      <button className="text-blue-500 hover:text-blue-700" onClick={() => handleOpenEditSale(sale)}><Edit size={18} /></button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteSale(sale.id)}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}