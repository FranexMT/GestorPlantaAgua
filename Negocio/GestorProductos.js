import Productos from "./Productos.js";
import ValidacionesProducto from "./ValidacionesProducto.js";

class GestorProductos {
    constructor() {
        this.productos = [];
    }

    agregarProducto(producto) {
        if (ValidacionesProducto.existeProducto(this.productos, producto.nombreProducto)) {
            throw new Error(`El producto ya existe`);
        }
        if (!ValidacionesProducto.precioValido(producto.preio)) {
            throw new Error(`El preio es invalido`);
        }
        console.log(producto);
        this.productos.push(producto);
    }

    venderProducto(codigo, cantidad) {
        const producto = buscarProducto(codigo);
        if (!producto) throw new Error("Producto no encontrado");

        if (!ValidacionesProducto.hayStockSuficiente(producto, cantidad)) {
            throw new Error("No hay suficiente stock para la venta");
        }

        producto.stock -= cantidad;
    }

    eliminarProducto(codigo) {
        if (!ValidacionesProducto.existeProducto(this.productos, codigo)) {
            throw new Error(`El producto no existe`);
        }
        this.productos = this.productos.filter(prod => prod.codigo !== codigo);
    }

    
    buscarProductoCodigo(codigo) {
        return this.productos.find(prod => prod.codigo === codigo);         
    }


}

export default GestorProductos;