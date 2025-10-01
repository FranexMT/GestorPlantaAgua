import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Search, Edit, Eye, Archive } from 'lucide-react';

// --- DATOS DE EJEMPLO SIMULADOS (Para que la tabla se vea llena) ---
const initialInventoryData  = [
    { id: 'P-001', name: 'Garrafón 20L', stock: 25, price: 500.00, lastUpdate: '25/09/2025' },
    { id: 'P-002', name: 'Botella PET 1L', stock: 30, price: 300.00, lastUpdate: '25/09/2025' },
    { id: 'P-003', name: 'Pack 6 PET 500mls', stock: 10, price: 990.00, lastUpdate: '24/09/2025' },
    { id: 'P-005', name: 'Botella PET 500ml', stock: 5, price: 150.00, lastUpdate: '25/09/2025' }, // Bajo stock
];

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({ name: '', stock: '', price: '' });
    const isEditing = product !== null;

    useEffect(() => {
        if (isEditing) {
            setFormData({ name: product.name, stock: product.stock, price: product.price });
        } else {
            setFormData({ name: '', stock: '', price: '' });
        }
    }, [product, isEditing]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...product, ...formData, stock: parseInt(formData.stock), price: parseFloat(formData.price) });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-700/30 w-full max-w-md m-4">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-gray-100">{isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-blue-300 mb-1">Nombre del Producto</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white" />
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
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">{isEditing ? 'Guardar Cambios' : 'Agregar Producto'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function App() {
const [products, setProducts] = useState(initialInventoryData); 
const [searchTerm, setSearchTerm] = useState('');
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingProduct, setEditingProduct] = useState(null);

const filteredData = useMemo(() => {
    return products.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
}, [searchTerm, products]);

const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
};

const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
};

const handleSaveProduct = (productData) => {
    if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
    } else {
        const newProduct = {
            ...productData,
            id: `P-${Date.now().toString().slice(-4)}`,
            lastUpdate: new Date().toLocaleDateString('es-ES')
        };
        setProducts([newProduct, ...products]);
    }
};

const handleDeleteProduct = (productId) => {
    if (window.confirm('¿Estás seguro de que quieres archivar este producto?')) {
        setProducts(products.filter(p => p.id !== productId));
    }
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
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 relative p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} />
                        Nuevo 
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
                                                onClick={() => handleOpenModal(product)}
                                                className="relative inline-block p-px font-semibold leading-6 text-blue-500 
                                                hover:text-blue-300 bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 
                                                transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:ring-2 hover:ring-blue-500"
                                                title="Editar Producto (Placeholder)"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
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
            <ProductModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
        </div>
    );
}
