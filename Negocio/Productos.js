class Producto {
  constructor(id, nombre, precio, stock = 0) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.stock = stock;
  }
}

export default Producto;
