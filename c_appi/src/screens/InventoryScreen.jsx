//inventario
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit, Archive } from 'lucide-react';
import { useProductos } from '../hooks/useProductos'; // Asegúrate de que la ruta sea correcta
import { toast } from 'react-toastify';
import { enviarNotificacionStockBajo } from '../Services/emailServices';

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({ name: '', stock: '', price: '', categoria: '' });
    const isEditing = product && product.id;

    // Lista de categorías para el dropdown
    const categorias = ["Hielito", "Hielo", "Agua", "Zuko", "Garrafon"];

    const notify = () => {
        toast(isEditing ? 'Producto editado con éxito!' : 'Producto guardado con éxito!', { type: 'success' });
    };

    useEffect(() => {
        if (isEditing) {
            setFormData({
                name: product.name || product.nombre || '',
                stock: product.stock,
                price: product.price,
                categoria: product.categoria || ''
            });
        } else {
            // Limpia el formulario completo para un nuevo producto
            setFormData({ name: '', stock: '', price: '', categoria: '' });
        }
    }, [product, isEditing]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = {
            nombre: formData.name,
            stock: parseInt(formData.stock),
            precio: parseFloat(formData.price).toFixed(2),
            categoria: formData.categoria
        };
        onSave(isEditing ? product.id : null, dataToSave);
        notify();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-md m-4">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-gray-100">{isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
                    <button onClick={onClose} className="text-gray-400 bg-[#1a1a1a] hover:text-white transition-colors">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-blue-300 mb-1">Nombre del Producto</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white" />
                    </div>

                    <div>
                        <label htmlFor="categoria" className="block text-sm font-medium text-blue-300 mb-1">Categoría</label>
                        <select
                            name="categoria"
                            id="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            required
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white appearance-none"
                        >
                            <option value="" disabled>Selecciona una categoría</option>
                            {categorias.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label htmlFor="stock" className="block text-sm font-medium text-blue-300 mb-1">Stock Actual</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white" />
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="price" className="block text-sm font-medium text-blue-300 mb-1">Precio de Venta</label>
                            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg font-semibold">{isEditing ? 'Guardar Cambios' : 'Agregar Producto'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ConfirmModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-800/80 rounded-xl shadow-2xl border w-full max-w-sm m-4">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 bg-[#1a1a1a] hover:text-white transition-colors">✕</button>
                </div>
                <div className="p-6 text-gray-300">
                    {children}
                </div>
                <div className="flex justify-end gap-3 p-4 bg-gray-900/50 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const {
        productos,
        loading,
        error,
        addProducto,
        updateProducto,
        deleteProducto
    } = useProductos();

    const filteredData = useMemo(() => {
        if (!productos || loading) return [];
        return productos.filter(item =>
            item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, productos, loading]);

    const handleOpenModal = (product = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = async (productId, productData) => {
    try {
        const umbralStockBajo = 10;
        if (productId) {
             // Obtener el stock original antes de la actualización
            const stockOriginal = editingProduct ? editingProduct.stock : undefined;
            const result = await updateProducto(productId, productData);
            // Comprobar si el stock ha caído por debajo del umbral
            if (productData.stock < umbralStockBajo && (stockOriginal === undefined || stockOriginal >= umbralStockBajo)) {
                console.log(`Stock de "${productData.nombre}" bajo (${productData.stock}). Enviando notificación...`);
                enviarNotificacionStockBajo({
                    nombre: productData.nombre,
                    stock: productData.stock,
                });
            }
            if (result.success) {
                toast('Producto actualizado correctamente', { type: 'success' });
            } else {
                toast(result.message || 'Error al actualizar producto', { type: 'error' });
            }
        } else {
        const result = await addProducto(productData);
        if (!result.success) {
            toast(result.message || 'El producto ya existe', { type: 'error' });
            return; 
        }
        toast('Producto agregado correctamente', { type: 'success' });
        }
    } catch (e) {
        console.error('Error al guardar producto:', e);
        toast(`Error al guardar: ${e.message}`, { type: 'error' });
    }
    };


    const handleDeleteProduct = (productId) => {
        setProductToDelete(productId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteProducto(productToDelete);
            toast('Producto eliminado con éxito!', { type: 'success' });
        } catch (e) {
            console.error("Error al eliminar producto:", e);
            toast(`Error al eliminar: ${e.message}`, { type: 'error' });
        } finally {
            setIsConfirmModalOpen(false);
            setProductToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8 bg-gray-900 min-h-screen flex justify-center items-center">
                <div className="text-xl text-blue-400">Cargando inventario...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-gray-900 min-h-screen flex justify-center items-center">
                <div className="text-xl text-red-500">Error al cargar: {error}</div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 bg-gray-900 min-h-screen font-sans">
            <header className="flex justify-between items-center mb-6 border-b border-blue-700/50 pb-4">
                <div className="flex items-baseline gap-2">
                    <svg className="h-10 w-10 text-blue-400 relative top-px" viewBox="0 0 22 22" fill='currentColor'>
                        <path d="M19 0H1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1ZM2 6v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6H2Zm11 3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0h2a1 1 0 0 1 2 0v1Z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-100">Inventario</h1>
                </div>
            </header>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ID..."
                        className="w-full pl-10 pr-4 py-2 border border-blue-600/50 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 relative p-px font-semibold leading-6 text-white bg-[#1a1a1a] hover:bg-blue-700 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 px-4 py-2"
                    >
                        <Plus size={18} />
                        Nuevo
                    </button>
                </div>
            </div>

            {/* Mobile: card list */}
            <div className="sm:hidden space-y-3">
                {filteredData.map(product => (
                    <div key={product.id} className="bg-gray-900/60 rounded-lg border border-gray-700 p-3 flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-100 truncate">{product.nombre}</p>
                            <p className="text-xs text-gray-400">ID: <span className="font-mono text-gray-300">{product.id}</span></p>
                            <p className="text-xs text-gray-400">{product.categoria} · <span className="text-green-400">{product.stock} unidades</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleOpenModal({ id: product.id, name: product.nombre, stock: product.stock, price: product.precio, categoria: product.categoria })} className="p-2 bg-[#1a1a1a] rounded text-blue-400">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-red-800/30 rounded text-red-400">
                                <Archive size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredData.length === 0 && (
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-center text-gray-400">No hay productos que coincidan con la búsqueda.</div>
                )}
            </div>

            {/* Desktop/Tablet: table */}
            <div className="hidden sm:block bg-gray-800/80 rounded-xl shadow-2xl border border-blue-700/30 overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-gray-300 table-auto">
                    <thead className="bg-gray-700/50 backdrop-blur-sm sticky top-0">
                        <tr>
                            <th className="p-4 font-semibold text-blue-400">ID Producto</th>
                            <th className="p-4 font-semibold text-blue-400">Nombre</th>
                            <th className="p-4 font-semibold text-blue-400">Categoría</th>
                            <th className="p-4 font-semibold text-blue-400">Stock Actual</th>
                            <th className="p-4 font-semibold text-blue-400">Precio Venta</th>
                            <th className="p-4 font-semibold text-blue-400">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((product, index) => {
                            const rowClass = index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/50';
                            let stockBadgeClasses = 'bg-green-700/30 text-green-300';
                            if (product.stock < 10) {
                                stockBadgeClasses = 'bg-red-700/30 text-red-300';
                            } else if (product.stock < 20) {
                                stockBadgeClasses = 'bg-yellow-700/30 text-yellow-300';
                            }

                            return (
                                <tr
                                    key={product.id}
                                    className={`border-b border-gray-700 ${rowClass} hover:bg-gray-700! transition-colors`}
                                >
                                    <td className="p-4 text-sm font-mono text-gray-400">{product.id}</td>
                                    <td className="p-4 text-sm font-medium text-gray-100 truncate max-w-[280px]">{product.nombre}</td>
                                    <td className="p-4 text-sm text-gray-400">{product.categoria}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockBadgeClasses}`}>
                                            {product.stock} Unidades
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-green-400">${parseFloat(product.precio).toFixed(2)}</td>
                                    <td className="p-4">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleOpenModal({
                                                    id: product.id,
                                                    name: product.nombre,
                                                    stock: product.stock,
                                                    price: product.precio,
                                                    categoria: product.categoria
                                                })}
                                                className="inline-block p-1 text-blue-500 bg-[#1a1a1a] hover:text-blue-300 transition-transform duration-300 focus:outline-none hover:scale-110 hover:ring-2 hover:ring-blue-500 focus:ring-2 focus:ring-blue-500 rounded-md"
                                                title="Editar Producto"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="inline-block p-1 text-red-500 bg-[#1a1a1a] hover:text-red-300 transition-transform duration-300 focus:outline-none hover:scale-110 hover:ring-2 hover:ring-red-500 focus:ring-2 focus:ring-red-500 rounded-md"
                                                title="Archivar/Eliminar"
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
                {filteredData.length === 0 && !loading && (
                    <div className="p-6 text-center text-gray-400">
                        {productos.length === 0 ? 'No hay productos en el inventario.' : 'No se encontraron productos que coincidan con la búsqueda.'}
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveProduct}
                product={editingProduct}
            />

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
            >
                <p className='text-white'>¿Estás seguro de que quieres archivar/eliminar este producto?</p>
            </ConfirmModal>
        </div>
    );
}