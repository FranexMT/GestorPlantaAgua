import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Search, Edit, Trash2, Eye, X, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useVentas } from '../hooks/useVentas';
import { useProductos } from '../hooks/useProductos';

const StatusBadge = ({ status }) => {
  const statusStyles = {
    'Pagada': 'bg-green-500/50 text-green-200',
    'Pendiente': 'bg-yellow-300/30 text-yellow-200',
    'Cancelada': 'bg-red-500/50 text-red-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

const SaleModal = ({ isOpen, onClose, onSave, sale, isLoading, productosInventario }) => {
  const [formData, setFormData] = useState({});
  const [productos, setProductos] = useState([]);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [errorInventario, setErrorInventario] = useState('');
  
  const isEditing = sale !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({ 
          status: sale.status,
          date: sale.date
        });
        setProductos(sale.items || []);
        setMontoRecibido(sale.montoRecibido || 0);
      } else {
        setFormData({ 
          status: 'Pagada', 
          date: new Date().toISOString().split('T')[0] 
        });
        setProductos([]);
        setMontoRecibido(0);
      }
      setErrorInventario('');
    }
  }, [isOpen, sale, isEditing]);

  if (!isOpen) return null;

  const calcularTotal = () => {
    return productos.reduce((acc, prod) => acc + prod.subtotal, 0);
  };

  const totalVenta = calcularTotal();
  const cambio = montoRecibido - totalVenta;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const verificarInventario = (productoId, cantidadSolicitada) => {
    const producto = productosInventario.find(p => p.id === productoId);
    if (!producto) {
      return { valido: false, mensaje: 'Producto no encontrado' };
    }
    const stock = parseInt(producto.stock) || 0;
    const cantidadEnVenta = productos
      .filter(p => p.productoId === productoId)
      .reduce((sum, p) => sum + p.cantidad, 0);

    const cantidadTotal = cantidadEnVenta + cantidadSolicitada;

    if (stock < cantidadTotal) {
      return { 
        valido: false, 
        mensaje: `Stock insuficiente para ${producto.nombre}. Disponible: ${stock}` 
      };
    }
    if (stock === 0) {
      return { valido: false, mensaje: 'Producto sin stock disponible' };
    }
    return { valido: true, producto };
  };

  const handleProductButtonClick = (producto) => {
    const productoExistenteIndex = productos.findIndex(p => p.productoId === producto.id);
    
    if (productoExistenteIndex !== -1) {
      // Incrementar cantidad
      const productoExistente = productos[productoExistenteIndex];
      const verificacion = verificarInventario(producto.id, 1);
      
      if (!verificacion.valido) {
        setErrorInventario(verificacion.mensaje);
        return;
      }
      
      const nuevosProductos = [...productos];
      nuevosProductos[productoExistenteIndex] = {
        ...productoExistente,
        cantidad: productoExistente.cantidad + 1,
        subtotal: (productoExistente.cantidad + 1) * productoExistente.precio
      };
      setProductos(nuevosProductos);

    } else {
      // Agregar nuevo producto
      const verificacion = verificarInventario(producto.id, 1);
      
      if (!verificacion.valido) {
        setErrorInventario(verificacion.mensaje);
        return;
      }
      
      const precio = parseFloat(producto.precio) || 0;
      const productoConSubtotal = {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio: precio,
        subtotal: precio
      };
      setProductos(prev => [...prev, productoConSubtotal]);
    }
    setErrorInventario('');
  };

  const eliminarProducto = (index) => {
    setProductos(prev => prev.filter((_, i) => i !== index));
    setErrorInventario('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (productos.length === 0) {
      setErrorInventario('Debes agregar al menos un producto a la venta');
      return;
    }
    if (montoRecibido < totalVenta) {
      setErrorInventario('El monto recibido es menor al total de la venta.');
      return;
    }

    const ventaCompleta = {
      ...formData,
      items: productos,
      total: totalVenta,
      montoRecibido: montoRecibido,
      cambio: cambio
    };

    await onSave(ventaCompleta);
  };

  const productosDisponibles = productosInventario.filter(p => (parseInt(p.stock) || 0) > 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 overflow-y-auto py-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-3xl m-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">
            {isEditing ? 'Editar Venta' : 'Registrar Nueva Venta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información General */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <ShoppingCart size={20} />
              Información de la Venta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-blue-300 mb-1">
                  Estado
                </label>
                <select 
                  name="status" 
                  id="status" 
                  value={formData.status || 'Pagada'} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option>Pagada</option>
                  <option>Cancelada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-300">Productos</h3>
            {errorInventario && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{errorInventario}</p>
              </div>
            )}

            {/* Agregar Producto por botones */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Selecciona un producto para agregar:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {productosDisponibles.map(producto => (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => handleProductButtonClick(producto)}
                    disabled={isLoading || (parseInt(producto.stock) || 0) === 0}
                    className="p-3 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <p className="text-sm">{producto.nombre}</p>
                    <p className="text-xs opacity-80">${(parseFloat(producto.precio) || 0).toFixed(2)}</p>
                    <p className="text-xs opacity-60">Stock: {producto.stock}</p>
                  </button>
                ))}
              </div>
              {productosDisponibles.length === 0 && (
                 <p className="text-center text-sm text-gray-400 mt-4">No hay productos disponibles para agregar.</p>
              )}
            </div>

            {/* Lista de Productos */}
            {productos.length > 0 ? (
              <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="p-3 text-left text-blue-300 font-medium">Producto</th>
                      <th className="p-3 text-center text-blue-300 font-medium">Cantidad</th>
                      <th className="p-3 text-right text-blue-300 font-medium">Precio</th>
                      <th className="p-3 text-right text-blue-300 font-medium">Subtotal</th>
                      <th className="p-3 text-center text-blue-300 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((prod, index) => (
                      <tr key={index} className="border-t border-gray-700">
                        <td className="p-3 text-gray-200">{prod.nombre}</td>
                        <td className="p-3 text-center text-gray-300">{prod.cantidad}</td>
                        <td className="p-3 text-right text-gray-300">${prod.precio.toFixed(2)}</td>
                        <td className="p-3 text-right text-green-400 font-medium">${prod.subtotal.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => eliminarProducto(index)}
                            disabled={isLoading}
                            className="text-red-500 hover:text-red-400 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-700 text-center text-gray-400">
                No hay productos agregados.
              </div>
            )}
          </div>
          
          {/* Monto y Cambio */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-300">Resumen de Pago</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-blue-300">TOTAL:</span>
                <span className="text-green-400">${totalVenta.toFixed(2)}</span>
              </div>
              <div>
                <label htmlFor="montoRecibido" className="block text-sm font-medium text-blue-300 mb-1">
                  Monto Recibido
                </label>
                <input 
                  type="number" 
                  name="montoRecibido" 
                  id="montoRecibido" 
                  value={montoRecibido} 
                  onChange={(e) => setMontoRecibido(parseFloat(e.target.value) || 0)} 
                  required 
                  disabled={isLoading}
                  step="0.01"
                  min={totalVenta}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" 
                />
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-blue-300">Cambio:</span>
                <span className={`text-red-400 ${cambio >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${cambio.toFixed(2)}
                </span>
              </div>
            </div>
          </div>


          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading || productos.length === 0 || montoRecibido < totalVenta}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Venta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SaleDetailsModal = ({ isOpen, onClose, sale }) => {
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-2xl m-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">
            Detalles de la Venta: <span className="text-blue-400">{sale.id}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Información General */}
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-2">
            <p className="text-gray-300"><strong className="text-blue-300">Fecha:</strong> {new Date(sale.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-gray-300"><strong className="text-blue-300">Estado:</strong> <StatusBadge status={sale.status} /></p>
          </div>

          {/* Productos */}
          <div>
            <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <ShoppingCart size={18} />
              Productos Vendidos
            </h3>
            {sale.items && sale.items.length > 0 ? (
              <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="p-3 text-left text-blue-300 font-medium">Producto</th>
                      <th className="p-3 text-center text-blue-300 font-medium">Cantidad</th>
                      <th className="p-3 text-right text-blue-300 font-medium">Precio Unit.</th>
                      <th className="p-3 text-right text-blue-300 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item, index) => (
                      <tr key={index} className="border-t border-gray-700">
                        <td className="p-3 text-gray-200">{item.nombre}</td>
                        <td className="p-3 text-center text-gray-300">{item.cantidad}</td>
                        <td className="p-3 text-right text-gray-300">${item.precio.toFixed(2)}</td>
                        <td className="p-3 text-right text-green-400 font-medium">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-blue-600 bg-gray-700/30">
                      <td colSpan="3" className="p-3 text-right text-blue-300 font-bold">TOTAL:</td>
                      <td className="p-3 text-right text-green-400 font-bold text-lg">
                        ${sale.total.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-center text-gray-400">
                No hay productos registrados en esta venta.
              </div>
            )}
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-2">
            <div className="flex justify-between items-center text-lg">
              <span className="text-blue-300 font-semibold">Monto Recibido:</span>
              <span className="text-white">${(sale.montoRecibido || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="text-blue-300 font-semibold">Cambio:</span>
              <span className="text-green-400 font-semibold">${(sale.cambio || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-b-xl text-right">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SalesScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [detailsSale, setDetailsSale] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    ventas,
    loading,
    error,
    addVenta,
    updateVenta,
    deleteVenta
  } = useVentas();

  const {
    productos: productosInventario,
    loading: loadingProductos,
    updateProducto
  } = useProductos();

  const handleExportData = () => {
    const dataToExport = filteredData;
    const headers = "ID Venta,Fecha,Total,Estado,Productos";
    const csvContent = [
      headers,
      ...dataToExport.map(s => {
        const productos = s.items?.map(item => `${item.nombre}(${item.cantidad})`).join(';') || '';
        return `${s.id},${s.date},${s.total.toFixed(2)},${s.status},"${productos}"`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "reporte_ventas.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenNewSale = () => {
    setEditingSale(null);
    setIsModalOpen(true);
  };

  const handleOpenEditSale = (sale) => {
    setEditingSale(sale);
    setIsModalOpen(true);
  };

  const handleOpenDetailsSale = (sale) => {
    setDetailsSale(sale);
  };

  const handleDeleteVenta = async (ventaId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      try {
        await deleteVenta(ventaId);
      } catch (err) {
        alert('Error al eliminar la venta: ' + err.message);
      }
    }
  };

  const handleSaveSale = async (sale) => {
    try {
      setIsSaving(true);
      
      // Actualizar inventario de productos
      for (const item of sale.items) {
        const producto = productosInventario.find(p => p.id === item.productoId);
        if (producto) {
          const stockActual = parseInt(producto.stock) || 0;
          const nuevoStock = editingSale ? (stockActual - item.cantidad) : (stockActual - item.cantidad);
          await updateProducto(item.productoId, { ...producto, stock: nuevoStock });
        }
      }

      // Guardar la venta
      if (editingSale) {
        await updateVenta(editingSale.id, sale);
      } else {
        await addVenta(sale);
      }
      
      setIsModalOpen(false);
    } catch (err) {
      alert('Error al guardar la venta: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = useMemo(() => {
    return ventas.filter(item =>
      item.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, ventas]);

  if (loading || loadingProductos) {
    return (
      <div className="p-8 bg-gray-900 min-h-screen font-sans flex items-center justify-center">
        <div className="text-white text-xl">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen font-sans">
      <SaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSale}
        sale={editingSale}
        isLoading={isSaving}
        productosInventario={productosInventario}
      />

      <SaleDetailsModal
        isOpen={!!detailsSale}
        onClose={() => setDetailsSale(null)}
        sale={detailsSale}
      />

      <header className="flex justify-between items-center mb-6 border-b border-blue-700/50 pb-4">
        <div className="flex items-center gap-4">
          <svg className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.17c-2.5-1.44-3.5-3.03-3.5-4.67 0-1.64 1.3-3.14 3.5-4.17.2-.1.45.03.55.25.12.28.01.58-.22.75-1.91.88-2.83 2.1-2.83 3.17s.92 2.29 2.83 3.17c.23.17.34.47.22.75-.1.22-.35.35-.55.25z" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-100">Ventas</h1>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          Error: {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por ID de venta..."
            className="w-full pl-10 pr-4 py-2 border border-blue-600/50 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenNewSale} 
            className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-blue-500/30"
          >
            <Plus size={25} />
            Nueva Venta
          </button>
          <button 
            onClick={handleExportData} 
            className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-blue-500/30"
          >
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
              <th className="p-4 font-semibold text-blue-400">Fecha</th>
              <th className="p-4 font-semibold text-blue-400">Productos</th>
              <th className="p-4 font-semibold text-blue-400">Total</th>
              <th className="p-4 font-semibold text-blue-400">Estado</th>
              <th className="p-4 font-semibold text-blue-400">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">
                  No se encontraron ventas
                </td>
              </tr>
            ) : (
              filteredData.map((sale, index) => {
                const rowClass = index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/50';
                const cantidadProductos = sale.items?.length || 0;
                return (
                  <tr key={sale.id} className={`${rowClass} border-b border-gray-700 hover:!bg-gray-700 transition-colors`}>
                    <td className="p-4 text-sm font-mono text-gray-400">{sale.id}</td>
                    <td className="p-4 text-sm text-gray-100">{sale.date}</td>
                    <td className="p-4 text-sm text-gray-300">
                      {cantidadProductos} {cantidadProductos === 1 ? 'producto' : 'productos'}
                    </td>
                    <td className="p-4 text-sm font-medium text-green-400">${sale.total.toFixed(2)}</td>
                    <td className="p-4"><StatusBadge status={sale.status} /></td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button 
                          className="text-gray-500 hover:text-gray-300" 
                          onClick={() => handleOpenDetailsSale(sale)}
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="text-blue-500 hover:text-blue-300" 
                          onClick={() => handleOpenEditSale(sale)}
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-300" 
                          onClick={() => handleDeleteVenta(sale.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}