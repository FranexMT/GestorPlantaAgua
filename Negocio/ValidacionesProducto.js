class ValidacionesProducto {
    //Comprueba si el producto existe por su nombre
    static existeProducto(productos, nombreProducto) {
        return productos.some(p => p.nombreProducto === nombreProducto);
    }

    //Comprueba si el codigo ya existe
    static existeCodigo (productos, codigo) {
        return productos.some(p => p.codigo === codigo);
    }

    static hayStockSuficiente(producto, cantidad) {
        return producto.stock >= cantidad;
    }

    static precioValido(precio) {
        return precio > 0;
    }
}

export default ValidacionesProducto;