import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductManager {
    constructor(filePath) {
        // Usamos path.resolve para que las rutas sean absolutas
        this.path = path.resolve(__dirname, '..', filePath);
    }

    // Método para obtener todos los productos
    async getProducts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Si el archivo no existe, devolvemos array vacío
            if (error.code === 'ENOENT') {
                return [];
            }
            console.error('Error al leer productos:', error);
            return [];
        }
    }

    // Método para buscar producto por ID
    async getProductById(id) {
        const products = await this.getProducts();
        // Convertimos ambos a string para comparar correctamente
        return products.find(p => p.id.toString() === id.toString());
    }

    // Método para agregar un nuevo producto
    async addProduct(productData) {
        try {
            const products = await this.getProducts();

            // Validamos que todos los campos obligatorios estén presentes
            const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
            for (const field of requiredFields) {
                if (!productData[field]) {
                    throw new Error(`El campo ${field} es obligatorio`);
                }
            }

            // Verificamos que el code no se repita
            const codeExists = products.some(p => p.code === productData.code);
            if (codeExists) {
                throw new Error(`Ya existe un producto con el código ${productData.code}`);
            }

            // Generamos ID autoincremental
            const newId = products.length > 0 ? products.at(-1).id + 1 : 1;

            // Creamos el nuevo producto
            const newProduct = {
                id: newId,
                title: productData.title,
                description: productData.description,
                code: productData.code,
                price: productData.price,
                status: productData.status ?? true, // Por defecto true si no se especifica
                stock: productData.stock,
                category: productData.category,
                thumbnails: productData.thumbnails || [] // Array vacío por defecto
            };

            // Agregamos el producto al array
            products.push(newProduct);

            // Guardamos en el archivo
            await fs.writeFile(this.path, JSON.stringify(products, null, 2));

            console.log(`Producto ${newProduct.title} agregado exitosamente con ID: ${newId}`);
            return newProduct;

        } catch (error) {
            console.error('Error al agregar producto:', error.message);
            throw error;
        }
    }

    // Método para actualizar un producto
    async updateProduct(id, updates) {
        try {
            const products = await this.getProducts();
            const productIndex = products.findIndex(p => p.id.toString() === id.toString());

            if (productIndex === -1) {
                throw new Error('Producto no encontrado');
            }

            // No permitimos actualizar el ID
            if (updates.id) {
                delete updates.id;
            }

            // Si se intenta cambiar el code, verificamos que no exista
            if (updates.code && updates.code !== products[productIndex].code) {
                const codeExists = products.some(p => p.code === updates.code && p.id !== products[productIndex].id);
                if (codeExists) {
                    throw new Error(`Ya existe un producto con el código ${updates.code}`);
                }
            }

            // Actualizamos solo los campos enviados
            products[productIndex] = { ...products[productIndex], ...updates };

            // Guardamos en el archivo
            await fs.writeFile(this.path, JSON.stringify(products, null, 2));

            console.log(`Producto con ID ${id} actualizado exitosamente`);
            return products[productIndex];

        } catch (error) {
            console.error('Error al actualizar producto:', error.message);
            throw error;
        }
    }

    // Método para eliminar un producto
    async deleteProduct(id) {
        try {
            const products = await this.getProducts();
            const productIndex = products.findIndex(p => p.id.toString() === id.toString());

            if (productIndex === -1) {
                throw new Error('Producto no encontrado');
            }

            // Eliminamos el producto del array
            const deletedProduct = products.splice(productIndex, 1)[0];

            // Guardamos en el archivo
            await fs.writeFile(this.path, JSON.stringify(products, null, 2));

            console.log(`Producto ${deletedProduct.title} eliminado exitosamente`);
            return { message: 'Producto eliminado exitosamente', product: deletedProduct };

        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
            throw error;
        }
    }
}

export default ProductManager;
