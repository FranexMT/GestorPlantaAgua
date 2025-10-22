import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Search, Edit, Trash2, Eye, X, ShoppingCart, AlertTriangle, BadgeDollarSign, Star } from 'lucide-react';
import { useVentas } from '../hooks/useVentas';
import { useProductos } from '../hooks/useProductos';
import { toast } from 'react-toastify'; 

// --- HELPERS DE TOASTIFY (Todos a top-right) ---
const showExportToast = () => {
    toast.success('¡Datos exportados correctamente!', {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
    });
};

const showSuccessToast = (message) => {
    toast.success(message, {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
    });
};

const showErrorToast = (message) => {
    // Los errores se mantienen en top-center para mayor visibilidad
    toast.error(message, { 
        position: "top-center",
        autoClose: 3500,
        theme: "dark",
    });
};


// --- COMPONENTE DE ESTADO ---
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

// --- MODAL DE CREACIÓN / EDICIÓN (SaleModal) ---
const SaleModal = ({ isOpen, onClose, onSave, sale, isLoading, productosInventario }) => {
  const [formData, setFormData] = useState({});
  const [productos, setProductos] = useState([]);
  const [montoRecibido, setMontoRecibido] = useState(''); 
  const [errorInventario, setErrorInventario] = useState('');
  const [productQuery, setProductQuery] = useState(''); // búsqueda rápida dentro del modal
  const [keypadTarget, setKeypadTarget] = useState(null); // { type: 'monto' } | { type: 'cantidad', index }
  const [keypadValue, setKeypadValue] = useState('');
  const [favoritos, setFavoritos] = useState(() => {
    try {
      const raw = localStorage.getItem('fav_productos');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  
  const isEditing = sale !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({ 
          status: sale.status,
          date: sale.date
        });
        const itemsConNumeros = sale.items.map(item => ({
            ...item,
            precio: parseFloat(item.precio) || 0,
            subtotal: parseFloat(item.subtotal) || 0
        }));
        setProductos(itemsConNumeros || []);
        setMontoRecibido(String(sale.montoRecibido || 0)); 
      } else {
        setFormData({ 
          status: 'Pagada', 
          date: new Date().toISOString().split('T')[0] 
        });
        setProductos([]);
        setMontoRecibido(''); 
      }
      setErrorInventario('');
  // abrir keypad por defecto en monto cuando se abre el modal
  setKeypadTarget({ type: 'monto' });
  setKeypadValue('');
    }
  }, [isOpen, sale, isEditing]);

  if (!isOpen) return null;

  const numericMontoRecibido = parseFloat(montoRecibido) || 0; 
  
  const calcularTotal = () => {
    return productos.reduce((acc, prod) => acc + prod.subtotal, 0);
  };

  const totalVenta = calcularTotal();
  const cambio = numericMontoRecibido - totalVenta;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMontoRecibidoChange = (e) => {
      const value = e.target.value;
      setMontoRecibido(value); 
  };

  const openKeypadForMonto = () => {
    setKeypadTarget({ type: 'monto' });
    setKeypadValue(String(montoRecibido || ''));
  };

  const openKeypadForCantidad = (index) => {
    const prod = productos[index];
    if (!prod) return;
    setKeypadTarget({ type: 'cantidad', index });
    setKeypadValue(String(prod.cantidad || ''));
  };

  const applyKeypadValue = (value) => {
    if (!keypadTarget) return;
    if (keypadTarget.type === 'monto') {
      setMontoRecibido(value);
    } else if (keypadTarget.type === 'cantidad') {
      const idx = keypadTarget.index;
      const prod = productos[idx];
      if (!prod) return;
      const nuevaCantidad = parseInt(value) || 0;
      const delta = nuevaCantidad - prod.cantidad;
      const verificacion = verificarInventario(prod.productoId, delta);
      if (!verificacion.valido) {
        setErrorInventario(verificacion.mensaje);
        return;
      }
      const nuevos = [...productos];
      if (nuevaCantidad <= 0) {
        nuevos.splice(idx, 1);
      } else {
        nuevos[idx] = { ...prod, cantidad: nuevaCantidad, subtotal: nuevaCantidad * prod.precio };
      }
      setProductos(nuevos);
      setErrorInventario('');
    }
    setKeypadTarget(null);
    setKeypadValue('');
  };

  const updateLiveValue = (value) => {
    if (!keypadTarget) return;
    if (keypadTarget.type === 'monto') {
      setMontoRecibido(value);
    } else if (keypadTarget.type === 'cantidad') {
      const idx = keypadTarget.index;
      const prod = productos[idx];
      if (!prod) return;
      const nuevaCantidad = parseInt(value) || 0;
      const delta = nuevaCantidad - prod.cantidad;
      const verificacion = verificarInventario(prod.productoId, delta);
      if (!verificacion.valido) {
        setErrorInventario(verificacion.mensaje);
        return;
      }
      const nuevos = [...productos];
      if (nuevaCantidad <= 0) {
        nuevos.splice(idx, 1);
      } else {
        nuevos[idx] = { ...prod, cantidad: nuevaCantidad, subtotal: nuevaCantidad * prod.precio };
      }
      setProductos(nuevos);
      setErrorInventario('');
    }
  };

  const keypadPress = (char) => {
    if (char === 'C') {
      setKeypadValue('');
      updateLiveValue('');
      return;
    }
    if (char === '←') {
      setKeypadValue(prev => {
        const next = (prev || '').slice(0, -1);
        updateLiveValue(next);
        return next;
      });
      return;
    }
    // handle dot only for monto
    if (char === '.') {
      if (keypadTarget?.type !== 'monto') return;
      if (keypadValue.includes('.')) return;
    }
    setKeypadValue(prev => {
      const next = (prev || '') + char;
      updateLiveValue(next);
      return next;
    });
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
      const verificacion = verificarInventario(producto.id, 1); 
      
      if (!verificacion.valido) {
        setErrorInventario(verificacion.mensaje);
        return;
      }
      
      const productoExistente = productos[productoExistenteIndex];
      const nuevosProductos = [...productos];
      nuevosProductos[productoExistenteIndex] = {
        ...productoExistente,
        cantidad: productoExistente.cantidad + 1,
        subtotal: (productoExistente.cantidad + 1) * productoExistente.precio
      };
      setProductos(nuevosProductos);

    } else {
      const verificacion = verificarInventario(producto.id, 0); 
      
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

  const toggleFavorito = (productoId) => {
    setFavoritos(prev => {
      const existe = prev.includes(productoId);
      const next = existe ? prev.filter(id => id !== productoId) : [...prev, productoId];
      try { localStorage.setItem('fav_productos', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };

  const incrementProducto = (index) => {
    const prod = productos[index];
    const verificacion = verificarInventario(prod.productoId, 1);
    if (!verificacion.valido) {
      setErrorInventario(verificacion.mensaje);
      return;
    }
    const nuevos = [...productos];
    nuevos[index] = {
      ...prod,
      cantidad: prod.cantidad + 1,
      subtotal: (prod.cantidad + 1) * prod.precio
    };
    setProductos(nuevos);
    setErrorInventario('');
  };

  const decrementProducto = (index) => {
    const prod = productos[index];
    if (prod.cantidad <= 1) {
      // eliminar si llega a 0
      setProductos(prev => prev.filter((_, i) => i !== index));
      return;
    }
    const nuevos = [...productos];
    nuevos[index] = {
      ...prod,
      cantidad: prod.cantidad - 1,
      subtotal: (prod.cantidad - 1) * prod.precio
    };
    setProductos(nuevos);
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
    if (numericMontoRecibido < totalVenta) {
      setErrorInventario('El monto recibido es menor al total de la venta.');
      return;
    }

    const ventaCompleta = {
      ...formData,
      items: productos,
      total: totalVenta,
      montoRecibido: numericMontoRecibido, 
      cambio: cambio
    };

    await onSave(ventaCompleta, sale); 
    onClose();
  };

  const productosDisponibles = productosInventario.filter(p => (parseInt(p.stock) || 0) > 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"> 
  <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-6xl m-4 h-full md:h-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">
            {isEditing ? 'Editar Venta' : 'Registrar Nueva Venta'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 max-h-[calc(100vh-140px)] overflow-y-auto md:flex md:gap-6">
          {/* Formulario principal - ocupa la columna izquierda */}
          <form onSubmit={handleSubmit} className="space-y-4 flex-1"> 
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

            {/* Agregar Producto por botones (Reducción de espacio vertical) */}
            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Selecciona un producto:</h4>

              {/* Búsqueda rápida dentro del modal */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Favoritos */}
              {favoritos.length > 0 && (
                <div className="mb-3 flex gap-2 overflow-x-auto py-1">
                  {favoritos.map(fid => {
                    const p = productosDisponibles.find(x => x.id === fid);
                    if (!p) return null;
                    return (
                      <button key={fid} type="button" onClick={() => handleProductButtonClick(p)} className="flex-shrink-0 px-3 py-2 bg-yellow-500 text-black rounded-lg font-semibold">
                        {p.nombre}
                      </button>
                    );
                  })}
                </div>
              )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-72 overflow-y-auto p-2">
                {productosDisponibles
                  .map(producto => (
          <div key={producto.id} className="p-4 bg-gradient-to-br from-gray-800/80 to-gray-800/60 text-white rounded-2xl hover:scale-[1.02] transition-transform shadow-2xl border border-gray-700 min-h-[6rem] flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-3">
                      <div className="text-left flex-1">
            <p className="text-sm font-semibold truncate">{producto.nombre}</p>
            <p className="text-sm opacity-80 mt-2">${(parseFloat(producto.precio) || 0).toFixed(2)}</p>
            <p className="text-sm opacity-60 mt-1">Stock: {producto.stock}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-24 flex-shrink-0">
                        <button onClick={() => toggleFavorito(producto.id)} title="Favorito" className={`p-2 rounded-full shadow-lg ${favoritos.includes(producto.id) ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white'}`}>
                          <Star size={16} />
                        </button>
                        <button onClick={() => handleProductButtonClick(producto)} className="w-full px-3 py-2 bg-blue-600 rounded-lg text-white font-semibold">Añadir</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {productosDisponibles.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-4">No hay productos disponibles.</p>
              )}
            </div>

            {/* Lista de Productos (Reducción de espacio vertical) */}
            {productos.length > 0 ? (
              <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="p-2 text-left text-blue-300 font-medium">Producto</th>
                      <th className="p-2 text-center text-blue-300 font-medium">Cant.</th>
                      <th className="p-2 text-right text-blue-300 font-medium">Precio</th>
                      <th className="p-2 text-right text-blue-300 font-medium">Subtotal</th>
                      <th className="p-2 text-center text-blue-300 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((prod, index) => (
                      <tr key={index} className="border-t border-gray-700">
                        <td className="p-2 text-gray-200 truncate">{prod.nombre}</td>
                        <td className="p-2 text-center text-gray-300">
                          <div className="inline-flex items-center gap-2">
                            <button type="button" onClick={() => decrementProducto(index)} className="px-2 py-1 bg-gray-800 rounded text-gray-200">-</button>
                            <button type="button" onClick={() => openKeypadForCantidad(index)} className="px-3 py-1 bg-gray-700 rounded text-white">{prod.cantidad}</button>
                            <button type="button" onClick={() => incrementProducto(index)} className="px-2 py-1 bg-gray-800 rounded text-gray-200">+</button>
                          </div>
                        </td>
                        <td className="p-2 text-right text-gray-300">${prod.precio.toFixed(2)}</td>
                        <td className="p-2 text-right text-green-400 font-medium">${prod.subtotal.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => eliminarProducto(index)}
                              disabled={isLoading}
                              className="text-red-500 hover:text-red-400 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-center text-gray-400 text-sm">
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
                <div className="relative">
                  <input 
                    type="text" 
                    name="montoRecibido" 
                    id="montoRecibido" 
                    value={montoRecibido} 
                    onChange={(e) => setMontoRecibido(e.target.value)} 
                    required 
                    disabled={isLoading}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" 
                  />
                  <button type="button" onClick={openKeypadForMonto} className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 rounded text-white">Teclado</button>
                </div>
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
              className="px-4 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading || productos.length === 0 || numericMontoRecibido < totalVenta} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Venta')}
            </button>
          </div>
          </form>

          {/* Keypad - columna derecha en md+, bloque inferior en móvil */}
          {keypadTarget && (
            <aside className="mt-4 md:mt-0 md:w-80 md:flex-shrink-0">
              <div className="p-4 bg-gray-900/60 rounded-lg border border-gray-700 h-full flex flex-col">
                <div className="mb-2 text-right text-white">
                  <div className="text-sm text-gray-300">Entrada:</div>
                  <div className="text-2xl font-mono text-white">{keypadValue || '0'}</div>
                </div>

                {/* Quick presets solo para monto */}
                {keypadTarget.type === 'monto' && (
                  <div className="flex gap-2 mb-3">
                    {[20,50,100].map(a => (
                      <button key={a} type="button" onClick={() => { setKeypadValue(String(a)); updateLiveValue(String(a)); }} className="flex-1 py-2 bg-blue-600 rounded text-white font-semibold">${a}</button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 md:grid-cols-3 flex-1">
                  {['1','2','3','4','5','6','7','8','9','.','0','←'].map((k) => (
                    <button key={k} type="button" onClick={() => keypadPress(k)} className="py-4 md:py-5 bg-gray-800 rounded text-white text-xl md:text-2xl shadow-md">{k}</button>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => { keypadPress('C'); }} className="w-full py-2 bg-red-600 rounded text-white font-semibold">Limpiar</button>
                  <button type="button" onClick={() => { 
                      // Validación final antes de cerrar
                      if (keypadTarget.type === 'cantidad') {
                        const idx = keypadTarget.index;
                        const prod = productos[idx];
                        const nuevaCantidad = parseInt(keypadValue) || 0;
                        const delta = nuevaCantidad - (prod?.cantidad || 0);
                        const verif = verificarInventario(prod.productoId, delta);
                        if (!verif.valido) {
                          showErrorToast(verif.mensaje);
                          return;
                        }
                      }
                      applyKeypadValue(keypadValue);
                    }} className="w-full py-2 bg-green-600 rounded text-white font-semibold">Aceptar</button>
                </div>

                <button type="button" onClick={() => { setKeypadTarget(null); setKeypadValue(''); }} className="mt-3 text-sm text-gray-300">Cerrar teclado</button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MODAL DE DETALLES (SaleDetailsModal) ---
const SaleDetailsModal = ({ isOpen, onClose, sale }) => {
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-2xl m-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">
            Detalles de la Venta: <span className="text-blue-400">{sale.id}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={20} />
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
                        <td className="p-3 text-right text-gray-300">${(item.precio || 0).toFixed(2)}</td>
                        <td className="p-3 text-right text-green-400 font-medium">${(item.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-blue-600 bg-gray-700/30">
                      <td colSpan="3" className="p-3 text-right text-blue-300 font-bold">TOTAL:</td>
                      <td className="p-3 text-right text-green-400 font-bold text-lg">
                        ${(sale.total || 0).toFixed(2)}
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

// --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, children, saleId }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
			<div className="bg-gray-800/80 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-sm m-4">
				<div className="flex justify-between items-center p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold text-white">{title}</h2>
					<button onClick={onClose} className="p-1 rounded-full text-gray-400 bg-[#1a1a1a] hover:text-white transition-colors"><X size={20} /></button>
				</div>
				<div className="p-6 text-gray-300">
					<p className='text-white'>{children} (ID: <span className="font-mono text-red-300">{saleId}</span>)</p>
				</div>
				<div className="flex justify-end gap-3 p-4 bg-gray-900/50 rounded-b-xl">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
					>
						Sí, Eliminar
					</button>
				</div>
			</div>
		</div>
	);
};


// --- COMPONENTE PRINCIPAL ---
export default function SalesScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [detailsSale, setDetailsSale] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);

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

  // FUNCIÓN CON LA LÓGICA REAL DE EXPORTACIÓN CSV
  const executeExportLogic = () => {
    const dataToExport = filteredData;
    const headers = "ID Venta,Fecha,Total,Estado,Monto Recibido,Cambio,Productos";
    const csvContent = [
      headers,
      ...dataToExport.map(s => {
        const productos = s.items?.map(item => `${item.nombre}(${item.cantidad})`).join(';') || '';
        return `${s.id},${s.date},${s.total.toFixed(2)},${s.status},${(s.montoRecibido || 0).toFixed(2)},${(s.cambio || 0).toFixed(2)},"${productos}"`;
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
      showExportToast(); 
    } else {
        showErrorToast("Error del navegador: No se pudo iniciar la descarga.");
    }
  };


  // --- FUNCIÓN DE EXPORTAR CON TOASTIFY INTERACTIVO (7 SEGUNDOS) ---
  const handleExportData = () => {
    const dataToExport = filteredData;
    const toastId = 'export-confirm';

    if (dataToExport.length === 0) {
        showErrorToast("No hay ventas para exportar. La lista actual está vacía.");
        return;
    }
    
    toast(({ closeToast }) => (
        <div className="p-1">
            <p className="font-semibold text-gray-200 text-sm mb-2">
                ¿Desea generar y descargar el reporte de ventas?
            </p>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={() => toast.dismiss(toastId)}
                    className="text-white bg-gray-600 hover:bg-gray-700 px-3 py-1 text-xs rounded transition-colors shadow-md border border-gray-500"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => {
                        executeExportLogic();
                        toast.dismiss(toastId);
                    }}
                    className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs rounded transition-colors font-bold shadow-md"
                >
                    Sí, Exportar
                </button>
            </div>
        </div>
    ), {
        toastId: toastId,
        position: "top-right", // AQUI ESTÁ EN TOP-RIGHT
        autoClose: 7000, 
        closeButton: false,
        draggable: false,
        theme: "dark",
    });
  };
  // -------------------------------------------------------------------


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
  
  const handleDeleteClick = (venta) => {
    setSaleToDelete(venta);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const deletedSaleId = saleToDelete.id; // Guardamos el ID antes de limpiar el estado
    if (saleToDelete) {
        try {
            // Reversión de inventario
            for (const item of saleToDelete.items) {
                const producto = productosInventario.find(p => p.id === item.productoId);
                if (producto) {
                    const stockActual = parseInt(producto.stock) || 0;
                    const nuevoStock = stockActual + item.cantidad; 
                    await updateProducto(item.productoId, { ...producto, stock: nuevoStock });
                }
            }
            await deleteVenta(saleToDelete.id);
            
            // MOSTRAR TOAST DE ELIMINACIÓN
            showSuccessToast(`Venta ${deletedSaleId} eliminada y stock revertido correctamente.`);
            
        } catch (err) {
            showErrorToast('Error al eliminar la venta y restaurar inventario: ' + err.message);
        }
    }
    setIsConfirmModalOpen(false);
    setSaleToDelete(null); 
  };
  
  const handleSaveSale = async (newSaleData, originalSale) => {
    try {
      setIsSaving(true);
      
      let stockChanges = {}; 

      if (originalSale) {
        // 1. Revertir el stock de la venta original
        for (const item of originalSale.items) {
          stockChanges[item.productoId] = (stockChanges[item.productoId] || 0) + item.cantidad;
        }
      }

      // 2. Aplicar el nuevo stock
      for (const item of newSaleData.items) {
        stockChanges[item.productoId] = (stockChanges[item.productoId] || 0) - item.cantidad;
      }
      
      // 3. Aplicar los cambios netos al inventario
      for (const [productoId, change] of Object.entries(stockChanges)) {
        if (change !== 0) {
          const producto = productosInventario.find(p => p.id === productoId);
          if (producto) {
            const stockActual = parseInt(producto.stock) || 0;
            const nuevoStock = stockActual + change; 
            
            if (nuevoStock < 0) {
                throw new Error(`Error: El stock de ${producto.nombre} no puede ser negativo.`);
            }

            await updateProducto(productoId, { ...producto, stock: nuevoStock });
          }
        }
      }

      // 4. Guardar la venta
      if (originalSale) {
        await updateVenta(originalSale.id, newSaleData);
      } else {
        await addVenta(newSaleData);
      }
      
      // Muestra el toast de éxito al guardar
      showSuccessToast(`Venta ${originalSale ? 'actualizada' : 'registrada'} correctamente.`);

    } catch (err) {
      showErrorToast('Error al guardar la venta: ' + err.message);
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
      
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          saleId={saleToDelete?.id}
      >
          ¿Estás seguro de que quieres **eliminar** esta venta? Se **revertirá** el inventario de los productos asociados.
      </ConfirmModal>

      <header className="flex justify-between items-center mb-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
            <BadgeDollarSign size={36} className="text-white"/>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Ventas</h1>
            <p className="text-sm text-gray-400">Registra ventas rápido con el teclado táctil y favoritos</p>
          </div>
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
            className="flex items-center gap-2 relative p-2 font-semibold leading-6 text-white border border-blue-600 bg-[#1a1a1a] shadow-2xl cursor-pointer rounded-xl transition-transform duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-700/50"
          >
            <Plus size={25} />
            Nueva Venta
          </button>
          <button 
            onClick={handleExportData} 
            className="flex items-center gap-2 relative p-2 font-semibold leading-6 text-white border border-blue-600 bg-[#1a1a1a] shadow-2xl cursor-pointer rounded-xl transition-transform duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-700/50"
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
                          className="p-2 rounded-full bg-[#1a1a1a] shadow-lg hover:ring-2 hover:ring-gray-500 transition-all duration-200"
                          onClick={() => handleOpenDetailsSale(sale)}
                          title="Ver detalles"
                        >
                          <Eye size={18} className="text-gray-400 hover:text-gray-200"/>
                        </button>
                        <button 
                          className="p-2 rounded-full bg-[#1a1a1a] shadow-lg hover:ring-2 hover:ring-blue-500 transition-all duration-200" 
                          onClick={() => handleOpenEditSale(sale)}
                          title="Editar"
                        >
                          <Edit size={18} className="text-blue-400 hover:text-blue-200"/>
                        </button>
                        <button 
                          className="p-2 rounded-full bg-[#1a1a1a] shadow-lg hover:ring-2 hover:ring-red-500 transition-all duration-200" 
                          onClick={() => handleDeleteClick(sale)}
                          title="Eliminar"
                        >
                          <Trash2 size={18} className="text-red-400 hover:text-red-200"/>
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