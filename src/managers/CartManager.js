import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CartManager {
    constructor(filePath) {
        // Usamos path.resolve para que las rutas sean absolutas
        this.path = path.resolve(__dirname, '..', filePath);
    }

    // Método para obtener todos los carritos
    async getCarts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Si el archivo no existe, devolvemos array vacío
            if (error.code === 'ENOENT') {
                return [];
            }
            console.error('Error al leer carritos:', error);
            return [];
        }
    }

    // Método para crear un nuevo carrito
    async createCart() {
        try {
            const carts = await this.getCarts();

            // Generamos ID autoincremental
            const newId = carts.length > 0 ? carts.at(-1).id + 1 : 1;

            // Creamos el nuevo carrito
            const newCart = {
                id: newId,
                products: []
            };

            // Agregamos el carrito al array
            carts.push(newCart);

            // Guardamos en el archivo
            await fs.writeFile(this.path, JSON.stringify(carts, null, 2));

            console.log(`Carrito creado exitosamente con ID: ${newId}`);
            return newCart;

        } catch (error) {
            console.error('Error al crear carrito:', error.message);
            throw error;
        }
    }

    // Método para buscar carrito por ID
    async getCartById(id) {
        const carts = await this.getCarts();
        // Convertimos ambos a string para comparar correctamente
        return carts.find(c => c.id.toString() === id.toString());
    }

    // Método para agregar producto a carrito
    async addProductToCart(cartId, productId) {
        try {
            const carts = await this.getCarts();
            const cartIndex = carts.findIndex(c => c.id.toString() === cartId.toString());

            if (cartIndex === -1) {
                throw new Error('Carrito no encontrado');
            }

            const cart = carts[cartIndex];

            // Buscamos si el producto ya existe en el carrito
            const existingProductIndex = cart.products.findIndex(
                p => p.product.toString() === productId.toString()
            );

            if (existingProductIndex !== -1) {
                // Si el producto ya existe, incrementamos la cantidad
                cart.products[existingProductIndex].quantity += 1;
                console.log(`Cantidad del producto ${productId} incrementada en el carrito ${cartId}`);
            } else {
                // Si el producto no existe, lo agregamos con cantidad 1 
                cart.products.push({
                    product: productId,
                    quantity: 1
                });
                console.log(`Producto ${productId} agregado al carrito ${cartId}`);
            }

            // Actualizamos el carrito en el array 
            carts[cartIndex] = cart;

            // Guardamos en el archivo
            await fs.writeFile(this.path, JSON.stringify(carts, null, 2));

            return cart;

        } catch (error) {
            console.error('Error al agregar producto al carrito:', error.message);
            throw error;
        }
    }
}

export default CartManager;
