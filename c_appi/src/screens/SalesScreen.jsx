import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Download, Search, Edit, Trash2, Eye, X, ShoppingCart, AlertTriangle, BadgeDollarSign, Star } from 'lucide-react';
import Keypad from '../components/Keypad';
import { useVentas } from '../hooks/useVentas';
import { useProductos } from '../hooks/useProductos';
import { toast } from 'react-toastify'; 

// --- HELPERS DE TOASTIFY (Se mantienen igual) ---
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
    toast.error(message, { 
        position: "top-center",
        autoClose: 3500,
        theme: "dark",
    });
};


// --- COMPONENTE DE ESTADO (Se mantiene igual) ---
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

// --- TERMINAL DE VENTA (Se mantiene igual) ---
const SaleTerminal = ({ currentSale, onSave, isLoading, productosInventario, onClearSelection }) => {
    const [formData, setFormData] = useState({});
    const [productos, setProductos] = useState([]);
    const [montoRecibido, setMontoRecibido] = useState(''); 
    const [errorInventario, setErrorInventario] = useState('');
    const [productQuery, setProductQuery] = useState(''); 
    const [keypadTarget, setKeypadTarget] = useState(null); 
    const [keypadValue, setKeypadValue] = useState('');
    const [favoritos, setFavoritos] = useState(() => {
        try {
            const raw = localStorage.getItem('fav_productos');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });
    
    const isEditing = currentSale !== null;
    const montoInputRef = React.useRef(null);

    useEffect(() => {
        const newSaleId = `VTA-${Date.now()}`; 

        if (isEditing) {
            setFormData({ 
                status: currentSale.status,
                date: currentSale.date
            });
            const itemsConNumeros = currentSale.items.map(item => ({
                ...item,
                precio: parseFloat(item.precio) || 0,
                subtotal: parseFloat(item.subtotal) || 0
            }));
            setProductos(itemsConNumeros || []);
            setMontoRecibido(String(currentSale.montoRecibido || 0)); 
        } else {
            // Fecha en formato local YYYY-MM-DD para evitar desfases por zona horaria
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const localDate = `${yyyy}-${mm}-${dd}`;
            setFormData({ 
                status: 'Pagada', 
                date: localDate,
                id: newSaleId 
            });
            setProductos([]);
            setMontoRecibido(''); 
        }
        setErrorInventario('');
        setKeypadTarget({ type: 'monto' }); 
        setKeypadValue('');
    }, [currentSale, isEditing]);


    const numericMontoRecibido = parseFloat(montoRecibido) || 0; 
    
    const calcularTotal = useCallback(() => {
        return productos.reduce((acc, prod) => acc + prod.subtotal, 0);
    }, [productos]);

    const totalVenta = calcularTotal();
    const cambio = numericMontoRecibido - totalVenta;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const verificarInventario = useCallback((productoId, cantidadSolicitada) => {
        const producto = productosInventario.find(p => p.id === productoId);
        if (!producto) {
            return { valido: false, mensaje: 'Producto no encontrado' };
        }
        const stock = parseInt(producto.stock) || 0;
        
        const cantidadEnVenta = productos
            .filter(p => p.productoId === productoId)
            .reduce((sum, p) => sum + p.cantidad, 0);

        const cantidadTotalEnVentaDespuesDeCambio = cantidadEnVenta + cantidadSolicitada; 
        
        if (stock < cantidadTotalEnVentaDespuesDeCambio) {
            return { 
                valido: false, 
                mensaje: `Stock insuficiente para ${producto.nombre}. Disponible: ${stock}` 
            };
        }
        if (stock === 0) {
            return { valido: false, mensaje: 'Producto sin stock disponible' };
        }
        return { valido: true, producto };
    }, [productos, productosInventario]);

    const applyKeypadValue = (value) => {
        if (!keypadTarget) return;
        const numericValue = keypadTarget.type === 'monto' ? parseFloat(value) : parseInt(value);
        
        if (keypadTarget.type === 'monto') {
            setMontoRecibido((numericValue || 0).toFixed(2));
        } else if (keypadTarget.type === 'cantidad') {
            const idx = keypadTarget.index;
            const prod = productos[idx];
            if (!prod) return;
            const nuevaCantidad = numericValue || 0;
            const delta = nuevaCantidad - prod.cantidad;
            
            // Re-validación de stock (aunque ya se hizo en el onClick de Aceptar, es buena práctica)
            const otrosItemsMismoProducto = productos.filter((p, i) => i !== idx && p.productoId === prod.productoId).reduce((sum, p) => sum + p.cantidad, 0);
            const cantidadTotalFinal = otrosItemsMismoProducto + nuevaCantidad;
            const productoInventario = productosInventario.find(p => p.id === prod.productoId);
            const stockDisponible = parseInt(productoInventario?.stock) || 0;
            
            if (stockDisponible < cantidadTotalFinal && nuevaCantidad > 0) {
                // Esto no debería suceder si la validación del botón "Aceptar" funciona, pero es un fallback.
                setErrorInventario(`Error: Stock insuficiente (${stockDisponible} disp.).`);
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
        setKeypadTarget({ type: 'monto' }); 
        setKeypadValue('');
    };

    const updateLiveValue = (value) => {
        if (!keypadTarget) return;
        
        const isNumericTarget = keypadTarget.type === 'monto' ? !isNaN(parseFloat(value)) : !isNaN(parseInt(value));
        const finalValue = value === '' || value === '.' ? value : (isNumericTarget ? value : null);

        if (finalValue === null) {
            return; 
        }

        if (keypadTarget.type === 'monto') {
            setMontoRecibido(finalValue);
        } else if (keypadTarget.type === 'cantidad') {
            // Lógica de validación preliminar (solo feedback)
            const idx = keypadTarget.index;
            const prod = productos[idx];
            if (!prod) return;
            const nuevaCantidad = parseInt(finalValue) || 0;
            
            const otrosItemsMismoProducto = productos.filter((p, i) => i !== idx && p.productoId === prod.productoId).reduce((sum, p) => sum + p.cantidad, 0);
            const cantidadTotalTentativa = otrosItemsMismoProducto + nuevaCantidad;
            const productoInventario = productosInventario.find(p => p.id === prod.productoId);
            const stockDisponible = parseInt(productoInventario?.stock) || 0;

            if (stockDisponible < cantidadTotalTentativa && nuevaCantidad > 0) {
                setErrorInventario(`Stock insuficiente (${stockDisponible} disp.)`);
            } else {
                setErrorInventario('');
            }
        }
        setKeypadValue(finalValue);
    };
    
    // Función para manejar la suma de presets (+X o $X)
    const handlePresetPress = (amount, isCurrency) => {
        const currentValue = keypadValue || '0';
        
        if (isCurrency && keypadTarget?.type !== 'monto') {
            showErrorToast('Los botones de monto son solo para el campo Monto Recibido.');
            return;
        }

        let currentNumericValue = isCurrency ? parseFloat(currentValue) : parseInt(currentValue);
        
        if (isNaN(currentNumericValue)) {
            currentNumericValue = 0;
        }

        let nextNumericValue = currentNumericValue + amount;
        
        let nextValue;
        if (isCurrency) {
            nextValue = nextNumericValue.toFixed(2);
        } else {
            if (nextNumericValue < 0) nextNumericValue = 0;
            nextValue = String(Math.floor(nextNumericValue));
        }
        
        setKeypadValue(nextValue);
        updateLiveValue(nextValue);
    };


    // FUNCIÓN PRINCIPAL DE TECLADO (CORREGIDA)
    const keypadPress = (char) => {
        const currentValue = keypadValue || ''; 

        // Lógica de Limpiar y Retroceso
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
        
        // --- Lógica de Suma ACUMULATIVA (Para +1, +5, +10 y $20, $50, $100) ---
        if (['+1', '+5', '+10', '$20', '$50', '$100'].includes(char)) {
            const isCurrency = char.startsWith('$');
            const amount = parseFloat(char.substring(1)); // Funciona para +1 y $20
            handlePresetPress(amount, isCurrency); 
            return;
        }
        
        // --- Lógica de Entrada de DÍGITOS (0-9) y Punto Decimal ---
        if (char === '.' || char === '0' || char === '1' || char === '2' || char === '3' || char === '4' || char === '5' || char === '6' || char === '7' || char === '8' || char === '9') {
            
            let nextValue = currentValue;
            
            // 1. Manejar Punto Decimal (Solo para Monto)
            if (char === '.') {
                if (keypadTarget?.type !== 'monto' || currentValue.includes('.')) return;
                nextValue = currentValue + char;
            } 
            // 2. Manejar Dígitos (0-9)
            else {
                const digit = char;
                
                if (keypadTarget?.type === 'cantidad') {
                    // En modo Cantidad: Multiplicar por 10 y sumar el dígito
                    const currentNum = parseInt(currentValue) || 0;
                    const newDigit = parseInt(digit);
                    
                    // Evitar que 00 + 5 se convierta en 5 (comportamiento de calculadora)
                    if (currentNum === 0 && newDigit === 0 && currentValue !== '0') {
                        // Permite escribir 0 si ya hay un 0 (ej: 0.00 -> 0.000)
                        nextValue = currentValue + digit;
                    } else if (currentNum === 0 && newDigit !== 0) {
                        // Reemplazar 0 inicial por el dígito
                        nextValue = digit;
                    } else {
                        // Concatenar el dígito
                        nextValue = currentValue + digit;
                    }

                    // Después de construir la cadena, validamos el valor final para evitar números gigantes
                    if (parseInt(nextValue) > 99999) return; // Límite de cantidad (ej: 99999)

                } else {
                    // En modo Monto: Concatenar el dígito
                    if (currentValue === '0' && digit !== '.') {
                        nextValue = digit;
                    } else {
                        nextValue = currentValue + digit;
                    }
                }
            }

            setKeypadValue(nextValue);
            updateLiveValue(nextValue);
            return;
        }
        
        // Manejar '00' (Botón eliminado, pero mantenemos la verificación por si acaso)
        if (char === '00') {
             // NO hacemos nada, ya que este botón se eliminó.
             return;
        }
    };
    
    const handleProductButtonClick = (producto) => {
        const productoExistenteIndex = productos.findIndex(p => p.productoId === producto.id);
        
        if (productoExistenteIndex !== -1) {
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
            const verificacion = verificarInventario(producto.id, 1); // Verificar stock para añadir 1
            
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
            setProductos(prev => prev.filter((_, i) => i !== index));
            if (keypadTarget?.type === 'cantidad' && keypadTarget.index === index) {
                setKeypadTarget({ type: 'monto' });
                setKeypadValue(String(montoRecibido));
            }
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
        if (keypadTarget?.type === 'cantidad' && keypadTarget.index === index) {
            setKeypadTarget({ type: 'monto' });
            setKeypadValue(String(montoRecibido));
        }
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

    const handleTerminalSubmit = async (e) => {
        e.preventDefault();
        
        if (productos.length === 0) {
            setErrorInventario('Debes agregar al menos un producto a la venta');
            return;
        }
        if (numericMontoRecibido < totalVenta && formData.status === 'Pagada') {
            setErrorInventario('El monto recibido es menor al total de la venta.');
            return;
        }

        // Validar stock una última vez antes de guardar
          for (const item of productos) {
              const productoInventario = productosInventario.find(p => p.id === item.productoId);
              const stockDisponible = parseInt(productoInventario?.stock) || 0;
              if (stockDisponible < item.cantidad) {
                  showErrorToast(`Stock insuficiente para ${item.nombre} al guardar. Disponible: ${stockDisponible}`);
                  return; // Detener guardado
              }
          }


        const ventaCompleta = {
            ...formData,
            items: productos,
            total: totalVenta,
            montoRecibido: numericMontoRecibido, 
            cambio: cambio
        };

        await onSave(ventaCompleta, currentSale);

        // Limpiar campos del terminal tras guardar
        const resetTerminal = () => {
            const newId = `VTA-${Date.now()}`;
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const localDate = `${yyyy}-${mm}-${dd}`;
            setFormData({ status: 'Pagada', date: localDate, id: newId });
            setProductos([]);
            setMontoRecibido('');
            setErrorInventario('');
            setProductQuery('');
            // Mantener el keypad activo en 'monto' y limpiar su valor
            setKeypadTarget({ type: 'monto' });
            setKeypadValue('');
            // Enfocar el input de monto si existe
            try { montoInputRef?.current?.focus(); } catch(e) {}
        };

        // Si fue creación nueva, limpiamos; si se estaba editando, mostramos la venta editada en pantalla
        if (!isEditing) resetTerminal();

        onClearSelection();
        
    };

    const productosDisponibles = useMemo(() => {
        return productosInventario
        .filter(p => (parseInt(p.stock) || 0) > 0)
        .filter(p => p.nombre.toLowerCase().includes(productQuery.toLowerCase()));
    }, [productosInventario, productQuery]);

    return (
        <div className="bg-gray-800/80 rounded-xl shadow-2xl border border-blue-700/30 p-4 space-y-3 h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                {isEditing ? `Editar Venta: ${currentSale.id}` : 'Registrar Nueva Venta'}
                {isEditing && (
                    <button onClick={onClearSelection} className="ml-auto px-2 py-0.5 rounded-lg text-red-400 bg-red-800/30 hover:bg-red-800/50 transition-colors text-xs font-normal flex items-center gap-1">
                        <X size={14} /> Nueva
                    </button>
                )}
            </h2>
            
            {/* Contenedor principal para productos/resumen (flexible) y keypad (flexible) */}
            <div className="md:flex md:gap-4 flex-1 min-h-0 flex-col md:flex-row">
                
                {/* Columna Izquierda: Productos y Resumen. ANCHO REDUCIDO A 50% */}
                <form onSubmit={handleTerminalSubmit} className="w-full space-y-3 flex flex-col min-h-0 md:w-1/2 md:flex-shrink-0"> 
                    
                    {/* Sección de Productos para Añadir (Lista Compacta) */}
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex-shrink-0">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Selecciona un producto:</h4>
                        
                        {/* Búsqueda rápida */}
                        <div className="mb-2">
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre..."
                                value={productQuery}
                                onChange={(e) => setProductQuery(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {/* Favoritos (Compacto) */}
                        {favoritos.length > 0 && (
                            <div className="mb-2 flex gap-1 overflow-x-auto py-1">
                                {favoritos.map(fid => {
                                    const p = productosInventario.find(x => x.id === fid); 
                                    if (!p || (parseInt(p.stock) || 0) <= 0) return null; 
                                    return (
                                        <button key={fid} type="button" onClick={() => handleProductButtonClick(p)} className="flex-shrink-0 px-2 py-0.5 bg-yellow-500 text-black rounded-lg font-semibold text-xs">
                                            {p.nombre}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Lista de botones de productos (Scrollable) */}
                        <div className="space-y-1 max-h-[120px] sm:max-h-[140px] overflow-y-auto pr-1">
                            {productosDisponibles.map(producto => (
                                <div key={producto.id} className="p-1.5 bg-gray-800/80 text-white rounded-lg border border-gray-700 flex justify-between items-center gap-1 text-sm">
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="font-semibold truncate text-xs">{producto.nombre}</p> 
                                        <p className="text-[10px] opacity-60">Stock: {producto.stock} · ${parseFloat(producto.precio).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => toggleFavorito(producto.id)} title="Favorito" className={`p-1 rounded-full shadow-lg ${favoritos.includes(producto.id) ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-white'}`}>
                                            <Star size={12} />
                                        </button>
                                        <button onClick={() => handleProductButtonClick(producto)} className="px-2 py-0.5 bg-blue-600 rounded text-white font-semibold text-xs">Añadir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {productosDisponibles.length === 0 && (
                            <p className="text-center text-xs text-gray-400 mt-2">No hay productos disponibles o coinciden con la búsqueda.</p>
                        )}
                    </div>
                    
                    {/* Lista de Productos de la Venta (Scrollable) */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
                        <h3 className="text-base font-semibold text-blue-300 flex items-center gap-2 flex-shrink-0">Productos en Venta</h3>
                        {errorInventario && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-2 flex items-start gap-2 flex-shrink-0">
                                <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-red-200 text-xs">{errorInventario}</p>
                            </div>
                        )}

                        {/* Mobile: card list */}
                        <div className="sm:hidden space-y-2">
                            {productos.length > 0 ? productos.map((prod, index) => (
                                <div key={index} className="bg-gray-900/60 border border-gray-700 rounded-lg p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-gray-100 truncate">{prod.nombre}</p>
                                        <p className="text-xs text-gray-400">Subtotal: <span className="text-green-400 font-medium">${prod.subtotal.toFixed(2)}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="inline-flex items-center gap-1">
                                            <button onClick={() => decrementProducto(index)} className="px-2 py-1 bg-gray-800 rounded text-gray-200">-</button>
                                            <button onClick={() => openKeypadForCantidad(index)} className={`px-3 py-1 rounded font-mono ${keypadTarget?.type === 'cantidad' && keypadTarget.index === index ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>{prod.cantidad}</button>
                                            <button onClick={() => incrementProducto(index)} className="px-2 py-1 bg-gray-800 rounded text-gray-200">+</button>
                                        </div>
                                        <button onClick={() => eliminarProducto(index)} className="p-2 rounded bg-red-700/30 text-red-300">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 text-center text-gray-400 text-xs">No hay productos agregados.</div>
                            )}
                        </div>

                        {/* Desktop/Tablet: table */}
                        <div className="hidden sm:block">
                            {productos.length > 0 ? (
                                <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-x-auto">
                                    <table className="min-w-[560px] w-full text-xs table-fixed">
                                        <thead className="bg-gray-700/50 sticky top-0">
                                            <tr>
                                                <th className="p-1.5 text-left text-blue-300 font-medium">Producto</th>
                                                <th className="p-1.5 text-center text-blue-300 font-medium w-24">Cant.</th>
                                                <th className="p-1.5 text-right text-blue-300 font-medium">Subtotal</th>
                                                <th className="p-1.5 text-center text-blue-300 font-medium w-10">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {productos.map((prod, index) => (
                                                <tr key={index}>
                                                    <td className="p-1.5 text-gray-200 truncate max-w-[180px]">{prod.nombre}</td>
                                                    <td className="p-1.5 text-center text-gray-300">
                                                        <div className="inline-flex items-center gap-0.5">
                                                            <button type="button" onClick={() => decrementProducto(index)} className="px-1 py-0.5 bg-gray-800 rounded text-gray-200 text-base leading-none">-</button>
                                                            <button type="button" onClick={() => openKeypadForCantidad(index)} className={`px-2 py-0.5 rounded text-white font-mono ${keypadTarget?.type === 'cantidad' && keypadTarget.index === index ? 'bg-blue-600 ring-1 ring-blue-400' : 'bg-gray-700'}`}>{prod.cantidad}</button>
                                                            <button type="button" onClick={() => incrementProducto(index)} className="px-1 py-0.5 bg-gray-800 rounded text-gray-200 text-base leading-none">+</button>
                                                        </div>
                                                    </td>
                                                    <td className="p-1.5 text-right text-green-400 font-medium">${prod.subtotal.toFixed(2)}</td>
                                                    <td className="p-1.5 text-center">
                                                        <button type="button" onClick={() => eliminarProducto(index)} className="text-red-500 hover:text-red-400">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 text-center text-gray-400 text-xs">No hay productos agregados.</div>
                            )}
                        </div>
                    </div>

                    {/* Resumen de Pago y Botones de Acción (Fijo al final) */}
                    <div className="flex-shrink-0 pt-3">
                        <div className="md:sticky md:bottom-0 md:bg-transparent md:pt-3">
                            <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 rounded-lg p-3 border border-gray-700 shadow-inner">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-sm text-blue-300">TOTAL</div>
                                        <div className="text-2xl font-extrabold text-white">${totalVenta.toFixed(2)}</div>
                                        <div className="text-xs text-gray-400">Items: {productos.length}</div>
                                    </div>

                                    <div className="w-1/2">
                                        <label htmlFor="montoRecibido" className="block text-xs font-medium text-blue-300 mb-1">Monto Recibido</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                name="montoRecibido" 
                                                id="montoRecibido" 
                                                ref={montoInputRef}
                                                value={montoRecibido} 
                                                onChange={(e) => setMontoRecibido(e.target.value)} 
                                                required 
                                                disabled={isLoading}
                                                onClick={openKeypadForMonto}
                                                className={`w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 disabled:opacity-50 text-sm ${keypadTarget?.type === 'monto' ? 'ring-blue-500 border-blue-500' : 'focus:ring-blue-500'}`}
                                            />
                                            <div className='absolute right-3 top-3 text-white font-mono opacity-60 text-sm'>${(parseFloat(montoRecibido) || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <div className="text-sm">
                                        <div className={`font-semibold ${cambio >= 0 ? 'text-green-400' : 'text-red-400'}`}>Cambio: ${cambio.toFixed(2)}</div>
                                    </div>

                                    <div className="w-44">
                                        <button 
                                            type="submit" 
                                            disabled={isLoading || productos.length === 0 || (formData.status === 'Pagada' && numericMontoRecibido < totalVenta)} 
                                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:from-blue-500 hover:to-teal-400 transition-all font-semibold text-sm shadow-lg disabled:opacity-50"
                                        >
                                            {isLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Venta')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className='mt-2 flex justify-between items-center'>
                                    <label htmlFor="status" className="text-xs font-medium text-blue-300">Estado:</label>
                                    <select 
                                        name="status" 
                                        id="status" 
                                        value={formData.status || 'Pagada'} 
                                        onChange={handleChange} 
                                        disabled={isLoading}
                                        className="bg-gray-900 border border-gray-600 rounded-lg px-2 py-0.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-xs"
                                    >
                                        <option>Pagada</option>
                                        <option>Cancelada</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Columna Derecha: Keypad (FLEXIBLE Y AMPLIADA) */}
                <aside className="mt-4 md:mt-0 md:flex-1 md:w-1/2 w-full flex flex-col">
                    <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-700 h-full flex flex-col">
                            <div className="mb-3 text-right">
                            <div className="text-xs text-gray-300">{keypadTarget?.type === 'monto' ? 'Monto' : 'Cantidad'}:</div>
                            <div className="text-3xl sm:text-4xl font-mono text-white break-all">{keypadValue || '0'}</div>
                        </div>

                        {/* Keypad component: presets + grid (accessible, keyboard support) */}
                        <div className="flex-1">
                            <Keypad
                                keypadTarget={keypadTarget}
                                keypadValue={keypadValue}
                                onKeyPress={(k) => keypadPress(k)}
                                onAccept={() => {
                                    // Mantener la validación de stock antes de aplicar el valor
                                    if (keypadTarget?.type === 'cantidad') {
                                        const idx = keypadTarget.index;
                                        const prod = productos[idx];
                                        if (!prod) return; // seguridad
                                        const nuevaCantidad = parseInt(keypadValue) || 0;

                                        const otrosItemsMismoProducto = productos.filter((p, i) => i !== idx && p.productoId === prod.productoId).reduce((sum, p) => sum + p.cantidad, 0);
                                        const cantidadTotalFinal = otrosItemsMismoProducto + nuevaCantidad;
                                        const productoInventario = productosInventario.find(p => p.id === prod.productoId);
                                        const stockDisponible = parseInt(productoInventario?.stock) || 0;

                                        if (stockDisponible < cantidadTotalFinal && nuevaCantidad > 0) {
                                            showErrorToast(`Stock insuficiente (${stockDisponible} disp.) para ${prod.nombre}.`);
                                            return; // No aplicar si no hay stock
                                        }
                                    }
                                    applyKeypadValue(keypadValue);
                                }}
                                onPresetPress={(amount, isCurrency) => handlePresetPress(amount, isCurrency)}
                            />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
// --- MODAL DE DETALLES (Se mantiene igual) ---
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


// --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (Se mantiene igual) ---
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
                    <p className='text-white'>{children} {saleId && (<span>(ID: <span className="font-mono text-red-300">{saleId}</span>)</span>)}</p>
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


// --- COMPONENTE PRINCIPAL (SalesScreen - Vista Unificada) ---
export default function SalesScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSale, setEditingSale] = useState(null); 
    const [detailsSale, setDetailsSale] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Nuevo estado para el modal de eliminar TODO
    const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
    
    // Estado para modal de eliminar una venta
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);

    const {
        ventas,
        loading,
        error,
        addVenta,
        updateVenta,
        deleteVenta,
        deleteAllVentas // Asumiendo que has añadido esta función a useVentas
    } = useVentas();

    const {
        productos: productosInventario,
        loading: loadingProductos,
        updateProducto,
        updateMultipleProductos // Asumiendo que has añadido esta función a useProductos
    } = useProductos();

    // Obtener funciones de refetch desde los hooks
    const { refetchVentas } = useVentas();
    const { refetchProductos } = useProductos();

    const handleClearSelection = useCallback(() => {
        setEditingSale(null);
    }, []);

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
            position: "top-right", 
            autoClose: 7000, 
            closeButton: false,
            draggable: false,
            theme: "dark",
        });
    };
    
    const handleOpenEditSale = (sale) => {
        setEditingSale(sale);
    };

    const handleOpenDetailsSale = (sale) => {
        setDetailsSale(sale);
    };
    
    const handleDeleteClick = (venta) => {
        setSaleToDelete(venta);
        setIsConfirmModalOpen(true);
    };
    
    // Función para abrir el modal de eliminar todo
    const handleDeleteAllClick = () => {
        if (ventas.length === 0) {
            showErrorToast("No hay ventas para eliminar.");
            return;
        }
        setIsConfirmDeleteAllOpen(true);
    };

    // Función modificada: BORRA TODAS LAS VENTAS PERO OMITE LA REVERSIÓN DE STOCK
    const handleConfirmDeleteAll = async () => {
        setIsConfirmDeleteAllOpen(false);
        try {
            // ELIMINAMOS LA LÓGICA DE REVERSIÓN DE STOCK. 🚫
            
            // 1. Eliminar todas las ventas
            // Si tu hook useVentas no tiene deleteAllVentas, tendrás que iterar y llamar a deleteVenta
            if (deleteAllVentas) {
                 await deleteAllVentas(); // Asumiendo que esta función existe en useVentas
            } else {
                 // Opción de fallback si deleteAllVentas no existe
                 for (const sale of ventas) {
                    await deleteVenta(sale.id);
                 }
            }
           
            
            try { await refetchVentas(); } catch(e) { console.warn('No se pudo refetch ventas', e); }
            showSuccessToast(`Todas las ventas (${ventas.length}) han sido eliminadas. El stock actual NO fue afectado.`);
            handleClearSelection(); 

        } catch (err) {
            showErrorToast('Error al eliminar todas las ventas: ' + err.message);
        }
    };

    // La función de eliminar una sola venta SÍ debe revertir el stock (se mantiene igual)
    const handleConfirmDelete = async () => {
        const deletedSaleId = saleToDelete.id; 
        if (saleToDelete) {
            try {
                // Revertir el stock antes de eliminar (ESTO SE MANTIENE PARA ELIMINAR UNA SOLA VENTA)
                for (const item of saleToDelete.items) {
                    const producto = productosInventario.find(p => p.id === item.productoId);
                    if (producto) {
                        const stockActual = parseInt(producto.stock) || 0;
                        const nuevoStock = stockActual + item.cantidad; 
                        await updateProducto(item.productoId, { ...producto, stock: nuevoStock });
                    }
                }
                
                await deleteVenta(saleToDelete.id);
                try { await refetchProductos(); } catch(e) { console.warn('No se pudo refetch productos', e); }
                try { await refetchVentas(); } catch(e) { console.warn('No se pudo refetch ventas', e); }

                showSuccessToast(`Venta ${deletedSaleId} eliminada y stock revertido correctamente.`);
                
            } catch (err) {
                showErrorToast('Error al eliminar la venta y restaurar inventario: ' + err.message);
            }
        }
        setIsConfirmModalOpen(false);
        setSaleToDelete(null); 
        handleClearSelection();
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

            // 2. Aplicar el stock de la nueva venta (o editada)
            for (const item of newSaleData.items) {
                stockChanges[item.productoId] = (stockChanges[item.productoId] || 0) - item.cantidad;
            }
            
            // 3. Aplicar los cambios de stock en el inventario
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
            // Refrescar datos en UI
            try { await refetchProductos(); } catch(e) { console.warn('No se pudo refetch productos', e); }
            try { await refetchVentas(); } catch(e) { console.warn('No se pudo refetch ventas', e); }
            
            showSuccessToast(`Venta ${originalSale ? 'actualizada' : 'registrada'} correctamente.`);

        } catch (err) {
            showErrorToast('Error al guardar la venta: ' + err.message);
        } finally {
            setIsSaving(false);
            handleClearSelection(); 
        }
    };


    const filteredData = useMemo(() => {
        const sortedVentas = [...ventas].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sortedVentas.filter(item =>
            item.id && typeof item.id === 'string' && item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, ventas]);

    if (loading || loadingProductos) {
        return (
            <div className="p-8 bg-gray-900 min-h-screen font-sans flex items-center justify-center">
                <div className="text-white text-xl">Cargando datos...</div>
            </div>
        );
    }

    // --- RENDERIZADO PRINCIPAL (Diseño de una sola columna) ---
    return (
        <div className="p-8 bg-gray-900 min-h-screen font-sans">
            {/* Modal de Detalles y Confirmación */}
            <SaleDetailsModal
                isOpen={!!detailsSale}
                onClose={() => setDetailsSale(null)}
                sale={detailsSale}
            />
            
            {/* Modal de confirmación para eliminar una venta */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                saleId={saleToDelete?.id}
            >
                ¿Estás seguro de que quieres **eliminar** esta venta? Se **revertirá** el inventario de los productos asociados.
            </ConfirmModal>

            {/* Nuevo Modal de confirmación para eliminar TODO */}
            <ConfirmModal
                isOpen={isConfirmDeleteAllOpen}
                onClose={() => setIsConfirmDeleteAllOpen(false)}
                onConfirm={handleConfirmDeleteAll}
                title="ELIMINAR TODO EL HISTORIAL"
            >
                ⚠️ **¡ADVERTENCIA!** Estás a punto de **eliminar PERMANENTEMENTE** todas las ventas registradas. Esta acción es **IRREVERSIBLE**. ¿Deseas continuar?
            </ConfirmModal>

            {/* -------------------------------------------------------- */}
            {/* ENCABEZADO Y ACCIONES SUPERIORES */}
            {/* -------------------------------------------------------- */}

            <header className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                        <BadgeDollarSign size={36} className="text-white"/>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-100">Terminal de Ventas</h1>
                        <p className="text-sm text-gray-400">Registro rápido y gestión de transacciones.</p>
                    </div>
                </div>
            </header>
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar venta por ID..."
                        className="w-full pl-10 pr-4 py-2 border border-blue-600/50 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className='flex gap-4 w-full md:w-auto'>
                    <button 
                        onClick={handleExportData} 
                        className="flex items-center gap-2 relative p-2 font-semibold leading-6 text-white border border-blue-600 bg-[#1a1a1a] shadow-2xl cursor-pointer rounded-xl transition-transform duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-700/50 flex-1 md:flex-none justify-center"
                    >
                        <Download size={25} />
                        Exportar Historial
                    </button>
                    {/* Botón para Eliminar Todo */}
                    <button 
                        onClick={handleDeleteAllClick} 
                        className="flex items-center gap-2 relative p-2 font-semibold leading-6 text-white border border-red-600 bg-red-800/30 shadow-2xl cursor-pointer rounded-xl transition-transform duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] hover:bg-red-800/50 flex-1 md:flex-none justify-center"
                    >
                        <Trash2 size={25} />
                        Eliminar Todo
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                    Error: {error}
                </div>
            )}
            
            {/* -------------------------------------------------------- */}
            {/* SECCIÓN 1: TERMINAL DE VENTA (A ANCHO COMPLETO) */}
            {/* -------------------------------------------------------- */}
            <h2 className="text-2xl font-bold text-blue-300 mb-3 mt-8">Terminal de Venta Rápida</h2>
            <div className="mb-8">
                <SaleTerminal
                    currentSale={editingSale}
                    onSave={handleSaveSale}
                    isLoading={isSaving}
                    productosInventario={productosInventario}
                    onClearSelection={handleClearSelection}
                />
            </div>
            
            {/* -------------------------------------------------------- */}
            {/* SECCIÓN 2: HISTORIAL DE VENTAS (A ANCHO COMPLETO) */}
            {/* -------------------------------------------------------- */}
            <h2 className="text-2xl font-bold text-blue-300 mb-3">Historial de Ventas</h2>
            <div className="bg-gray-800/80 rounded-xl shadow-2xl border border-blue-700/30 overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-700/70 backdrop-blur-sm sticky top-0">
                        <tr>
                            <th className="p-3 font-semibold text-blue-400">ID Venta</th>
                            <th className="p-3 font-semibold text-blue-400">Fecha</th>
                            <th className="p-3 font-semibold text-blue-400">Productos</th>
                            <th className="p-3 font-semibold text-blue-400">Total</th>
                            <th className="p-3 font-semibold text-blue-400">Estado</th>
                            <th className="p-3 font-semibold text-blue-400 text-center">Acción</th>
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
                                const isSelected = editingSale?.id === sale.id;
                                const highlightClass = isSelected ? 'ring-2 ring-yellow-400/50 !bg-yellow-900/40' : '';
                                const cantidadProductos = sale.items?.length || 0; 
                                return (
                                    <tr 
                                        key={sale.id} 
                                        className={`${rowClass} border-b border-gray-700 hover:!bg-gray-700 transition-colors ${highlightClass}`}
                                    >
                                        <td className="p-3 text-sm font-mono text-gray-400">{sale.id}</td>
                                        <td className="p-3 text-sm text-gray-100">{sale.date}</td>
                                        <td className="p-3 text-sm text-gray-300">
                                            {cantidadProductos} {cantidadProductos === 1 ? 'producto' : 'productos'}
                                        </td>
                                        <td className="p-3 text-sm font-medium text-green-400">${sale.total.toFixed(2)}</td>
                                        <td className="p-3"><StatusBadge status={sale.status} /></td>
                                        <td className="p-3 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button 
                                                    className="p-1 rounded-full bg-[#1a1a1a] shadow-lg hover:ring-2 hover:ring-gray-500 transition-all duration-200"
                                                    onClick={() => handleOpenDetailsSale(sale)}
                                                    title="Ver detalles"
                                                >
                                                    <Eye size={16} className="text-gray-400 hover:text-gray-200"/>
                                                </button>
                                                <button 
                                                    className="p-1 rounded-full bg-[#1a1a1a] shadow-lg hover:ring-2 hover:ring-blue-500 transition-all duration-200" 
                                                    onClick={() => handleOpenEditSale(sale)}
                                                    title="Editar"
                                                >
                                                    <Edit size={16} className="text-blue-400 hover:text-blue-200"/>
                                                </button>
                                                <button 
                                                    className="p-1 rounded-full bg-[#1a1a1a] shadow-lg hover:ring-2 hover:ring-red-500 transition-all duration-200" 
                                                    onClick={() => handleDeleteClick(sale)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} className="text-red-400 hover:text-red-200"/>
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