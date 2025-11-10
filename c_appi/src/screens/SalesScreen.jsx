//venta
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Download, Search, Edit, Trash2, Eye, X, ShoppingCart, AlertTriangle, BadgeDollarSign, Star } from 'lucide-react';
import Keypad from '../components/Keypad';
import { useVentas } from '../hooks/useVentas';
import { useProductos } from '../hooks/useProductos';
import { toast } from 'react-toastify';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import manaImg from '../img/mana.jpeg';
import manantialImg from '../img/manantial.png';
import manImg from '../img/man.png';
import { enviarNotificacionStockBajo } from '../Services/emailServices';

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
export default function SalesScreen({ user }) {
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

    const executeExportLogic = async () => {
        const dataToExport = filteredData;

        // Agregados para hoja Resumen
        const totalVentas = dataToExport.length;
        const suma = (sel) => dataToExport.reduce((acc, v) => acc + (Number(sel(v)) || 0), 0);
        const totalImporte = suma(v => v.total);
        const totalRecibido = suma(v => v.montoRecibido);
        const totalCambio = suma(v => v.cambio);
        const ticketPromedio = totalVentas > 0 ? totalImporte / totalVentas : 0;

        // Agregado por estado
        const porEstado = {};
        for (const v of dataToExport) {
            const st = v.status || 'Desconocido';
            if (!porEstado[st]) porEstado[st] = { ventas: 0, total: 0 };
            porEstado[st].ventas += 1;
            porEstado[st].total += Number(v.total || 0);
        }

        // Top productos (cantidad e importe)
        const productosAgg = new Map(); // key: nombre, val: {cantidad, importe}
        for (const v of dataToExport) {
            for (const it of (v.items || [])) {
                const key = it.nombre || it.productoId || 'Producto';
                const prev = productosAgg.get(key) || { cantidad: 0, importe: 0 };
                productosAgg.set(key, {
                    cantidad: prev.cantidad + (Number(it.cantidad) || 0),
                    importe: prev.importe + (Number(it.subtotal) || 0)
                });
            }
        }
        const topProductos = Array.from(productosAgg.entries())
            .map(([nombre, v]) => ({ nombre, ...v }))
            .sort((a, b) => b.importe - a.importe)
            .slice(0, 10);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GestorPlantaAgua';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Ventas', { views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }] });

        // Intentar cargar logo de Manantial y convertir a base64 para ExcelJS en navegador
        let imageBase64 = null;
        let imageExt = null;
        try {
            const res = await fetch(manantialImg);
            if (res.ok) {
                const blob = await res.blob();
                const mime = blob.type || '';
                imageExt = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpeg' : null);
                if (imageExt) {
                    // Leer como data URL y extraer base64
                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    if (typeof dataUrl === 'string') {
                        const parts = dataUrl.split(',');
                        imageBase64 = parts.length > 1 ? parts[1] : parts[0];
                    }
                }
            }
        } catch (e) {
            console.warn('No se pudo cargar logo para export:', e.message || e);
        }

        // Zona de imagen (fila 1) y título (fila 2), header en fila 3
        sheet.mergeCells('A1:G1');
        sheet.getRow(1).height = 60; // espacio para el logo
        sheet.mergeCells('A2:G2');
        const titleCell = sheet.getCell('A2');
        titleCell.value = 'Reporte de Ventas - Planta de Agua';
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF1F2937'} };

        // Nota: la imagen se añadirá después de crear el header para calcular la columna destino

        // Header
        const header = ['ID Venta','Fecha','Total','Estado','Monto Recibido','Cambio','Productos'];
        sheet.addRow([]); // fila 2 vacía ya que A1 es título, header será row 3
        const headerRow = sheet.addRow(header);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B63A9' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
            };
        });

        // Insertar imagen centrada sobre el header si se cargó correctamente (base64 en navegador)
        if (!imageBase64) {
            // intentar con alternativas de la carpeta img
            try {
                const tryPaths = [manaImg, manImg];
                for (const p of tryPaths) {
                    try {
                        const r = await fetch(p);
                        if (!r.ok) continue;
                        const b = await r.blob();
                        const mime = b.type || '';
                        const ext = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpeg' : null);
                        if (!ext) continue;
                        const dataUrl = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(b);
                        });
                        const parts = (typeof dataUrl === 'string') ? dataUrl.split(',') : [];
                        if (parts.length > 1) {
                            imageBase64 = parts[1];
                            imageExt = ext;
                            break;
                        }
                    } catch (e) { /* sigue intentando */ }
                }
            } catch (e) { /* ignore */ }
        }

        if (imageBase64 && imageExt) {
            try {
                const imageId = workbook.addImage({ base64: imageBase64, extension: imageExt });
                const totalCols = header.length; // 7
                const span = 3; // cuántas columnas ocupará la imagen aprox
                const startCol = Math.max(0, Math.floor((totalCols - span) / 2));
                const endCol = startCol + span;
                // Fila 1 (0-based: 0..1)
                sheet.addImage(imageId, { tl: { col: startCol, row: 0.0 }, br: { col: endCol, row: 1.0 } });
            } catch (e) {
                console.warn('No se pudo añadir imagen al sheet:', e.message || e);
            }
        }

        // Datos + formato condicional básico por total y color por estado en columna Estado
    const dataStartRow = sheet.rowCount + 1; // debería ser 4
        for (const s of dataToExport) {
            const fecha = new Date(s.date);
            const fechaExcel = `${fecha.getDate().toString().padStart(2,'0')}/${(fecha.getMonth()+1).toString().padStart(2,'0')}/${fecha.getFullYear()}`;
            const productos = (s.items||[]).map(i => `${i.nombre} (${i.cantidad})`).join(', ');
            const row = sheet.addRow([
                s.id,
                fechaExcel,
                Number((s.total||0).toFixed(2)),
                s.status,
                Number((s.montoRecibido||0).toFixed(2)),
                Number((s.cambio||0).toFixed(2)),
                productos
            ]);

            // Formato numérico en celdas
            row.getCell(3).numFmt = '0.00';
            row.getCell(5).numFmt = '0.00';
            row.getCell(6).numFmt = '0.00';

            // Borde en fila
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
                };
            });

            // Resaltar según total (ejemplo): <50 rojo, >200 verde
            const totalVal = Number(s.total || 0);
            if (totalVal < 50) {
                row.eachCell((cell, colNumber) => { if (colNumber <= 6) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E1' } }; });
            } else if (totalVal > 200) {
                row.eachCell((cell, colNumber) => { if (colNumber <= 6) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFEA' } }; });
            }

            // Color por estado SOLO en la celda de estado (col 4) para no interferir con lo anterior
            const estadoCell = row.getCell(4);
            const estado = (s.status || '').toLowerCase();
            if (estado.includes('cancel')) {
                estadoCell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFE5E7EB'} }; // gris claro
            } else if (estado.includes('pend')) {
                estadoCell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFFEF9C3'} }; // amarillo claro
            } else if (estado.includes('pag')) {
                estadoCell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFE6FFEA'} }; // verde claro
            }
        }

        // Ajustar anchos
        const colWidths = [18, 14, 12, 12, 14, 10, 50];
        colWidths.forEach((w, i) => { sheet.getColumn(i+1).width = w; });

        // Autofilter para solo las filas de datos (A3:G{dataEndRow})
        const dataEndRow = sheet.rowCount;
        sheet.autoFilter = { from: 'A3', to: `G${dataEndRow}` };

        // Ajustes para la columna de 'Productos': wrapText y altura dinámica por fila
        try {
            const productosColIndex = 7; // columna G (1-based)
            const productosCol = sheet.getColumn(productosColIndex);
            // Asegurar que la columna permita wrap
            productosCol.alignment = { wrapText: true };

            // Estimar caracteres por línea según ancho de columna (aprox)
            const charsPerLine = Math.max(30, Math.floor((productosCol.width || 50)));

            for (let r = dataStartRow; r <= dataEndRow; r++) {
                const cell = sheet.getCell(r, productosColIndex);
                // Forzar wrap en la celda
                if (!cell.alignment) cell.alignment = {};
                cell.alignment.wrapText = true;

                const text = String(cell.value || '');
                // Contar líneas por comas o longitud
                const approxLines = Math.max(1, Math.ceil(text.length / charsPerLine));
                // Setear altura de fila (15pt por línea aprox)
                const newHeight = Math.min(400, approxLines * 15);
                sheet.getRow(r).height = Math.max(sheet.getRow(r).height || 15, newHeight);
            }
        } catch (e) {
            console.warn('No se pudo ajustar dinamicamente la columna Productos:', e.message || e);
        }

        // Fila de totales al final (no incluida en autofiltro)
        const totalsRow = sheet.addRow(['', 'Totales', { formula: `SUM(C${dataStartRow}:C${dataEndRow})` }, '', { formula: `SUM(E${dataStartRow}:E${dataEndRow})` }, { formula: `SUM(F${dataStartRow}:F${dataEndRow})` }, '' ]);
        totalsRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        });
        totalsRow.getCell(3).numFmt = '0.00';
        totalsRow.getCell(5).numFmt = '0.00';
        totalsRow.getCell(6).numFmt = '0.00';

        // =========================
        // Hoja Resumen
        // =========================
        const resumen = workbook.addWorksheet('Resumen');
        resumen.mergeCells('A1:E1');
        const tCell = resumen.getCell('A1');
        tCell.value = 'Resumen de Ventas';
        tCell.alignment = { horizontal: 'center', vertical: 'middle' };
        tCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        tCell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF1F2937'} };
        resumen.getRow(1).height = 24;

        // KPIs
        const kpiHeader = resumen.addRow(['Métrica', 'Valor']);
        kpiHeader.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF0B63A9'} }; c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
        const kpiRows = [
            ['Total de ventas', totalVentas],
            ['Importe total vendido', totalImporte],
            ['Monto recibido total', totalRecibido],
            ['Cambio total', totalCambio],
            ['Ticket promedio', ticketPromedio]
        ];
        for (const [m, v] of kpiRows) {
            const r = resumen.addRow([m, v]);
            r.getCell(2).numFmt = '0.00';
            r.eachCell(c => { c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
        }
        resumen.getColumn(1).width = 28;
        resumen.getColumn(2).width = 18;

        resumen.addRow([]);

        // Por estado
        const estadoHeader = resumen.addRow(['Estado', 'Ventas', 'Importe total']);
        estadoHeader.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF0B63A9'} }; c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
        for (const [estado, info] of Object.entries(porEstado)) {
            const r = resumen.addRow([estado, info.ventas, info.total]);
            r.getCell(3).numFmt = '0.00';
            r.eachCell(c => { c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
        }
        resumen.getColumn(1).width = Math.max(28, ...Object.keys(porEstado).map(s => s.length + 4));
        resumen.getColumn(2).width = 12;
        resumen.getColumn(3).width = 18;

        resumen.addRow([]);

        // Top productos
        const topHeader = resumen.addRow(['Producto', 'Cantidad', 'Importe']);
        topHeader.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF0B63A9'} }; c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
        for (const p of topProductos) {
            const r = resumen.addRow([p.nombre, p.cantidad, p.importe]);
            r.getCell(2).numFmt = '0';
            r.getCell(3).numFmt = '0.00';
            r.eachCell(c => { c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
        }
        resumen.getColumn(1).width = Math.max(30, ...topProductos.map(p => (p.nombre || '').length + 4));
        resumen.getColumn(2).width = 12;
        resumen.getColumn(3).width = 18;

        // Generar archivo y descargar
        const buf = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buf], { type: 'application/octet-stream' }), `ventas_${Date.now()}.xlsx`);
        showExportToast();
    };

    // ========================= NUEVO: Exportar usando PLANTILLA =========================
    // Requiere que coloques un archivo de plantilla en /public/report_template.xlsx
    // La plantilla debe contener (idealmente) hojas con nombres: "Diario", "Semanal", "Mensual", "Anual".
    // Si alguna falta, se crea automáticamente. Los datos se anexan debajo de la última fila usada.
    const executeTemplateExport = async () => {
        const ventasBase = filteredData;
        if (!ventasBase || ventasBase.length === 0) {
            showErrorToast('No hay ventas para exportar con plantilla.');
            return;
        }

        // 1. Cargar plantilla
        const workbook = new ExcelJS.Workbook();
        let templateLoaded = false;
        try {
            const resp = await fetch('/report_template.xlsx'); // ruta en /public
            if (!resp.ok) throw new Error('No se pudo descargar la plantilla');
            const ab = await resp.arrayBuffer();
            await workbook.xlsx.load(ab);
            templateLoaded = true;
        } catch (e) {
            console.warn('Fallo al cargar plantilla, se creará una nueva genérica:', e.message);
        }
        if (!templateLoaded) {
            workbook.created = new Date();
            workbook.creator = 'GestorPlantaAgua';
        }

        // 2. Helpers de agrupación y parsing
        const parseFecha = (raw) => {
            if (!raw) return null;
            if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
                const [y,m,d] = raw.split('-').map(Number);
                return new Date(y, m - 1, d);
            }
            const dt = new Date(raw);
            return isNaN(dt.getTime()) ? null : dt;
        };
        const getISOWeek = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
        };
        const agrupar = (selectorClave) => {
            const map = new Map();
            for (const v of ventasBase) {
                const fecha = parseFecha(v.date);
                if (!fecha) continue;
                const clave = selectorClave(fecha, v);
                const entry = map.get(clave) || { ventas: [], clave };
                entry.ventas.push(v);
                map.set(clave, entry);
            }
            const filas = [];
            for (const { clave, ventas } of map.values()) {
                const totalVentas = ventas.length;
                const sum = (sel) => ventas.reduce((acc,x)=>acc + (Number(sel(x))||0),0);
                const importeTotal = sum(x=>x.total);
                const montoRecibido = sum(x=>x.montoRecibido);
                const cambioTotal = sum(x=>x.cambio);
                const ticketPromedio = totalVentas>0 ? importeTotal/totalVentas : 0;
                const unidadesTotales = ventas.reduce((acc,v)=>acc + (v.items||[]).reduce((a,i)=>a + (Number(i.cantidad)||0),0),0);
                filas.push({ clave, totalVentas, importeTotal, montoRecibido, cambioTotal, ticketPromedio, unidadesTotales });
            }
            filas.sort((a,b)=> a.clave.localeCompare(b.clave));
            return filas;
        };

        // 2.1 Métricas para hojas Ventas / Resumen
        const totalVentas = ventasBase.length;
        const suma = (sel) => ventasBase.reduce((acc, v) => acc + (Number(sel(v)) || 0), 0);
        const totalImporte = suma(v => v.total);
        const totalRecibido = suma(v => v.montoRecibido);
        const totalCambio = suma(v => v.cambio);
        const ticketPromedio = totalVentas > 0 ? totalImporte / totalVentas : 0;
        const porEstado = {};
        for (const v of ventasBase) {
            const st = v.status || 'Desconocido';
            if (!porEstado[st]) porEstado[st] = { ventas: 0, total: 0 };
            porEstado[st].ventas += 1;
            porEstado[st].total += Number(v.total || 0);
        }
        const productosAgg = new Map();
        for (const v of ventasBase) {
            for (const it of (v.items || [])) {
                const key = it.nombre || it.productoId || 'Producto';
                const prev = productosAgg.get(key) || { cantidad: 0, importe: 0 };
                productosAgg.set(key, { cantidad: prev.cantidad + (Number(it.cantidad) || 0), importe: prev.importe + (Number(it.subtotal) || 0) });
            }
        }
        const topProductos = Array.from(productosAgg.entries())
            .map(([nombre, v]) => ({ nombre, ...v }))
            .sort((a, b) => b.importe - a.importe)
            .slice(0, 10);

        // 2.2 Agregados periodos
        const diario = agrupar((f)=>`${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}-${String(f.getDate()).padStart(2,'0')}`);
        const semanal = agrupar((f)=>getISOWeek(f));
        const mensual = agrupar((f)=>`${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}`);
        const anual = agrupar((f)=>`${f.getFullYear()}`);

        // 3. Utilidades hojas
        const ensureSheet = (nombre) => workbook.getWorksheet(nombre) || workbook.addWorksheet(nombre);
        const clearSheet = (sheet) => { try { if (sheet.rowCount > 0) sheet.spliceRows(1, sheet.rowCount); } catch(e){} };

        // 3.1 Hoja Diario (detalle) reemplazando totalmente y añadiendo logo manantial centrado
        const buildDiarioSheet = async () => {
            const sheet = ensureSheet('Diario');
            clearSheet(sheet);
            // Fila 1: imagen, Fila 2: título, Fila 3: encabezados
            sheet.mergeCells('A1:G1');
            sheet.getRow(1).height = 60;
            sheet.mergeCells('A2:G2');
            const titleCell = sheet.getCell('A2');
            titleCell.value = 'Reporte de Ventas - Planta de Agua (Diario)';
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF1F2937'} };
            const header = ['ID Venta','Fecha','Total','Estado','Monto Recibido','Cambio','Productos'];
            const headerRow = sheet.addRow(header);
            headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B63A9' } }; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; });
            // Logo manantial
            let imgBase64=null,imgExt=null;
            try { const res=await fetch(manantialImg); if(res.ok){ const blob=await res.blob(); const mime=blob.type||''; imgExt = mime.includes('png')?'png':(mime.includes('jpeg')||mime.includes('jpg')?'jpeg':null); if(imgExt){ const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);}); if(typeof dataUrl==='string'){ const parts=dataUrl.split(','); imgBase64=parts[1]||parts[0]; } } } } catch(e){}
            if(imgBase64&&imgExt){ try { const imageId=workbook.addImage({ base64: imgBase64, extension: imgExt }); const totalCols=header.length; const span=3; const startCol=Math.max(0, Math.floor((totalCols-span)/2)); const endCol=startCol+span; sheet.addImage(imageId,{ tl:{col:startCol,row:0.0}, br:{col:endCol,row:1.0} }); } catch(e){} }
            const dataStartRow = sheet.rowCount + 1; // debería ser 4
            for (const s of ventasBase) {
                const fecha = parseFecha(s.date) || new Date(s.date);
                const fechaExcel = fecha ? `${String(fecha.getDate()).padStart(2,'0')}/${String(fecha.getMonth()+1).padStart(2,'0')}/${fecha.getFullYear()}` : String(s.date);
                const productosTxt = (s.items||[]).map(i => `${i.nombre} (${i.cantidad})`).join(', ');
                const row = sheet.addRow([ s.id, fechaExcel, Number((s.total||0).toFixed(2)), s.status, Number((s.montoRecibido||0).toFixed(2)), Number((s.cambio||0).toFixed(2)), productosTxt ]);
                row.getCell(3).numFmt='0.00'; row.getCell(5).numFmt='0.00'; row.getCell(6).numFmt='0.00';
                row.eachCell({includeEmpty:true},cell=>{cell.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };});
                const totalVal=Number(s.total||0); if(totalVal<50){ row.eachCell((cell,c)=>{ if(c<=6) cell.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FFFFE4E1'} }; }); } else if(totalVal>200){ row.eachCell((cell,c)=>{ if(c<=6) cell.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FFE6FFEA'} }; }); }
                const estadoCell=row.getCell(4); const estado=(s.status||'').toLowerCase(); if(estado.includes('cancel')) estadoCell.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FFE5E7EB'} }; else if(estado.includes('pend')) estadoCell.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FFFEF9C3'} }; else if(estado.includes('pag')) estadoCell.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FFE6FFEA'} };
            }
            [18,14,12,12,14,10,50].forEach((w,i)=>{ sheet.getColumn(i+1).width=w; });
            const dataEndRow = sheet.rowCount; sheet.autoFilter={ from:'A3', to:`G${dataEndRow}` };
            try { const idx=7; const col=sheet.getColumn(idx); col.alignment={ wrapText:true }; const charsPerLine=Math.max(30,Math.floor((col.width||50))); for(let r=dataStartRow;r<=dataEndRow;r++){ const cell=sheet.getCell(r,idx); if(!cell.alignment) cell.alignment={}; cell.alignment.wrapText=true; const text=String(cell.value||''); const approx=Math.max(1,Math.ceil(text.length/charsPerLine)); const h=Math.min(400, approx*15); sheet.getRow(r).height=Math.max(sheet.getRow(r).height||15,h); } } catch(e){}
            const totalsRow=sheet.addRow(['','Totales',{formula:`SUM(C${dataStartRow}:C${dataEndRow})`},'',{formula:`SUM(E${dataStartRow}:E${dataEndRow})`},{formula:`SUM(F${dataStartRow}:F${dataEndRow})`},'' ]);
            totalsRow.eachCell(cell=>{ cell.font={ bold:true }; cell.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; cell.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FFF3F4F6'} }; }); totalsRow.getCell(3).numFmt='0.00'; totalsRow.getCell(5).numFmt='0.00'; totalsRow.getCell(6).numFmt='0.00';
        };

        // 3.2 Hoja Resumen
        const buildResumenSheet = () => {
            const resumen = ensureSheet('Resumen');
            clearSheet(resumen);
            resumen.mergeCells('A1:E1');
            const tCell = resumen.getCell('A1');
            tCell.value = 'Resumen de Ventas';
            tCell.alignment = { horizontal: 'center', vertical: 'middle' };
            tCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            tCell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF1F2937'} };
            resumen.getRow(1).height = 24;
            const kpiHeader = resumen.addRow(['Métrica', 'Valor']);
            kpiHeader.eachCell(c=>{ c.font={ bold:true, color:{argb:'FFFFFFFF'} }; c.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FF0B63A9'} }; c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
            [[ 'Total de ventas', totalVentas ], [ 'Importe total vendido', totalImporte ], [ 'Monto recibido total', totalRecibido ], [ 'Cambio total', totalCambio ], [ 'Ticket promedio', ticketPromedio ]].forEach(([m,v])=>{ const r=resumen.addRow([m,v]); r.getCell(2).numFmt='0.00'; r.eachCell(c=>{ c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); });
            resumen.getColumn(1).width=28; resumen.getColumn(2).width=18; resumen.addRow([]);
            const estadoHeader = resumen.addRow(['Estado','Ventas','Importe total']); estadoHeader.eachCell(c=>{ c.font={ bold:true, color:{argb:'FFFFFFFF'} }; c.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FF0B63A9'} }; c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
            for(const [estado,info] of Object.entries(porEstado)){ const r=resumen.addRow([estado, info.ventas, info.total]); r.getCell(3).numFmt='0.00'; r.eachCell(c=>{ c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); }
            resumen.getColumn(1).width=Math.max(28, ...Object.keys(porEstado).map(s=>s.length+4)); resumen.getColumn(2).width=12; resumen.getColumn(3).width=18; resumen.addRow([]);
            const topHeader = resumen.addRow(['Producto','Cantidad','Importe']); topHeader.eachCell(c=>{ c.font={ bold:true, color:{argb:'FFFFFFFF'} }; c.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FF0B63A9'} }; c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; });
            for(const p of topProductos){ const r=resumen.addRow([p.nombre, p.cantidad, p.importe]); r.getCell(2).numFmt='0'; r.getCell(3).numFmt='0.00'; r.eachCell(c=>{ c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); }
            resumen.getColumn(1).width=Math.max(30, ...topProductos.map(p=>(p.nombre||'').length+4)); resumen.getColumn(2).width=12; resumen.getColumn(3).width=18;
        };

        // 3.3 Tabla genérica para hojas agregadas
        const writeTabla = (sheet, titulo, data, startRow=3) => {
            if (sheet.rowCount === 0) { sheet.getCell('A1').value=titulo; sheet.getCell('A1').font={ bold:true, size:16 }; }
            // Borrar filas desde startRow si ya existe encabezado (reemplazar datos viejos)
            // Buscar encabezado existente
            let headerRowIndex = null; for(let r=1;r<=sheet.rowCount;r++){ const c1=sheet.getCell(r,1).value; if(c1 && String(c1).toLowerCase().includes('clave')){ headerRowIndex=r; break; } }
            if(!headerRowIndex){ headerRowIndex=startRow; sheet.getRow(headerRowIndex).values=['Clave','Ventas','Importe Total','Monto Recibido','Cambio Total','Ticket Promedio','Unidades Totales']; sheet.getRow(headerRowIndex).eachCell(c=>{ c.font={ bold:true, color:{argb:'FFFFFFFF'} }; c.fill={ type:'pattern', pattern:'solid', fgColor:{argb:'FF0B63A9'} }; c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; c.alignment={ horizontal:'center' }; }); }
            else { // limpiar datos debajo del encabezado
                const last = sheet.rowCount; if (last > headerRowIndex) sheet.spliceRows(headerRowIndex+1, last - headerRowIndex);
            }
            let insertRow = headerRowIndex + 1;
            for(const fila of data){ const row = sheet.getRow(insertRow); row.values=[ fila.clave, fila.totalVentas, fila.importeTotal, fila.montoRecibido, fila.cambioTotal, fila.ticketPromedio, fila.unidadesTotales ]; row.getCell(3).numFmt='0.00'; row.getCell(4).numFmt='0.00'; row.getCell(5).numFmt='0.00'; row.getCell(6).numFmt='0.00'; row.eachCell(c=>{ c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); insertRow++; }
            ['Clave','Ventas','Importe Total','Monto Recibido','Cambio Total','Ticket Promedio','Unidades Totales'].forEach((h,i)=>{ const col = sheet.getColumn(i+1); if(!col.width || col.width < h.length+4) col.width=Math.max(h.length+4,14); });
        };

    await buildDiarioSheet();
    buildResumenSheet();
        writeTabla(ensureSheet('Semanal'), 'Reporte Semanal', semanal);
        writeTabla(ensureSheet('Mensual'), 'Reporte Mensual', mensual);
        writeTabla(ensureSheet('Anual'), 'Reporte Anual', anual);

        // 4. Guardar
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `reporte_plantilla_${Date.now()}.xlsx`);
        showExportToast();
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
            const umbralStockBajo = 6; // Definir el umbral para stock bajo

            
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
                        // Comprobar si el stock ha caído por debajo del umbral
                        if (nuevoStock < umbralStockBajo && stockActual >= umbralStockBajo) {
                            console.log(`Stock de "${producto.nombre}" bajo (${nuevoStock}) tras venta. Enviando notificación...`);
                            enviarNotificacionStockBajo({
                                nombre: producto.nombre,
                                stock: nuevoStock,
                            });
                        }
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
                {/* Mostrar acciones administrativas sólo para admins */}
                {user?.role === 'admin' && (
                    <div className='flex gap-4 w-full md:w-auto'>
                        <button 
                            onClick={handleExportData} 
                            className="flex items-center gap-2 relative p-px font-semibold leading-6 text-white bg-[#1a1a1a] hover:bg-blue-700 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 px-4 py-2 flex-1 md:flex-none justify-center"
                        >
                            <Download size={25} />
                            Exportar Básico
                        </button>
                        <button 
                            onClick={executeTemplateExport} 
                            title="Usar plantilla Excel con secciones Diario/Semanal/Mensual/Anual" 
                            className="flex items-center gap-2 relative p-px font-semibold leading-6 text-white bg-[#1a1a1a] hover:bg-green-700 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 px-4 py-2 flex-1 md:flex-none justify-center"
                        >
                            <Download size={25} />
                            Exportar Plantilla
                        </button>
                        {/* Botón para Eliminar Todo */}
                        <button 
                            onClick={handleDeleteAllClick} 
                            className="flex items-center gap-2 relative p-px font-semibold leading-6 text-white bg-[#1a1a1a] hover:bg-blue-700 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 px-4 py-2 flex-1 md:flex-none justify-center"
                        >
                            <Trash2 size={25} />
                            Eliminar Todo
                        </button>
                        <button 
                            onClick={() => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1", '_blank', 'noopener,noreferrer')} 
                            className="flex items-center gap-2 relative p-px font-semibold leading-6 text-white bg-[#1a1a1a] hover:bg-blue-700 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 px-4 py-2 flex-1 md:flex-none justify-center"
                        >
                            <Download size={25} />
                            Historial anual
                        </button>
                    </div>
                )}
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