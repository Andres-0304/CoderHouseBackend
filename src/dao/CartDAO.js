import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

class CartDAO {
    // Crear carrito
    async createCart() {
        try {
            const cart = new Cart({ products: [] });
            await cart.save();
            return cart;
        } catch (error) {
            console.error('Error en CartDAO.createCart:', error);
            throw error;
        }
    }

    // Obtener todos los carritos
    async getCarts() {
        try {
            const carts = await Cart.find().populate({
                path: 'products.product',
                select: 'title description price category stock status'
            });
            return carts;
        } catch (error) {
            console.error('Error en CartDAO.getCarts:', error);
            throw error;
        }
    }

    // Obtener carrito por ID con populate
    async getCartById(id) {
        try {
            const cart = await Cart.findById(id).populate({
                path: 'products.product',
                select: 'title description price category stock status thumbnails'
            });
            
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
            return cart;
        } catch (error) {
            console.error('Error en CartDAO.getCartById:', error);
            throw error;
        }
    }

    // Obtener carrito sin populate (para operaciones internas)
    async getCartByIdLean(id) {
        try {
            const cart = await Cart.findById(id);
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
            return cart;
        } catch (error) {
            console.error('Error en CartDAO.getCartByIdLean:', error);
            throw error;
        }
    }

    // Agregar producto al carrito
    async addProductToCart(cartId, productId, quantity = 1) {
        try {
            // Verificar que el producto existe
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            // Verificar disponibilidad
            if (!product.isAvailable()) {
                throw new Error('Producto no disponible');
            }

            // Verificar stock suficiente
            const cart = await this.getCartByIdLean(cartId);
            const existingItem = cart.products.find(item => 
                item.product.toString() === productId.toString()
            );
            
            const totalQuantity = (existingItem ? existingItem.quantity : 0) + quantity;
            if (product.stock < totalQuantity) {
                throw new Error(`Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${totalQuantity}`);
            }

            // Agregar producto al carrito
            await cart.addProduct(productId, quantity);
            
            // Retornar carrito con populate
            return this.getCartById(cartId);
        } catch (error) {
            console.error('Error en CartDAO.addProductToCart:', error);
            throw error;
        }
    }

    // Remover producto del carrito
    async removeProductFromCart(cartId, productId) {
        try {
            const cart = await this.getCartByIdLean(cartId);
            await cart.removeProduct(productId);
            
            // Retornar carrito con populate
            return this.getCartById(cartId);
        } catch (error) {
            console.error('Error en CartDAO.removeProductFromCart:', error);
            throw error;
        }
    }

    // Actualizar cantidad de producto en el carrito
    async updateProductQuantity(cartId, productId, quantity) {
        try {
            // Verificar que el producto existe
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            // Verificar stock si se está aumentando la cantidad
            if (quantity > 0) {
                if (!product.isAvailable()) {
                    throw new Error('Producto no disponible');
                }
                
                if (product.stock < quantity) {
                    throw new Error(`Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${quantity}`);
                }
            }

            const cart = await this.getCartByIdLean(cartId);
            await cart.updateProductQuantity(productId, quantity);
            
            // Retornar carrito con populate
            return this.getCartById(cartId);
        } catch (error) {
            console.error('Error en CartDAO.updateProductQuantity:', error);
            throw error;
        }
    }

    // Actualizar todos los productos del carrito
    async updateCartProducts(cartId, products) {
        try {
            // Validar que todos los productos existen y tienen stock
            for (const item of products) {
                const product = await Product.findById(item.product);
                if (!product) {
                    throw new Error(`Producto ${item.product} no encontrado`);
                }
                
                if (!product.isAvailable()) {
                    throw new Error(`Producto ${product.title} no disponible`);
                }
                
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.title}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
                }
            }

            const cart = await this.getCartByIdLean(cartId);
            await cart.replaceProducts(products);
            
            // Retornar carrito con populate
            return this.getCartById(cartId);
        } catch (error) {
            console.error('Error en CartDAO.updateCartProducts:', error);
            throw error;
        }
    }

    // Vaciar carrito
    async clearCart(cartId) {
        try {
            const cart = await this.getCartByIdLean(cartId);
            await cart.clear();
            
            // Retornar carrito con populate
            return this.getCartById(cartId);
        } catch (error) {
            console.error('Error en CartDAO.clearCart:', error);
            throw error;
        }
    }

    // Eliminar carrito
    async deleteCart(cartId) {
        try {
            const cart = await Cart.findByIdAndDelete(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
            return {
                message: 'Carrito eliminado exitosamente',
                deletedCart: cart
            };
        } catch (error) {
            console.error('Error en CartDAO.deleteCart:', error);
            throw error;
        }
    }

    // Calcular total del carrito
    async calculateCartTotal(cartId) {
        try {
            const cart = await this.getCartById(cartId);
            let total = 0;
            
            for (const item of cart.products) {
                if (item.product && item.product.price) {
                    total += item.product.price * item.quantity;
                }
            }
            
            return {
                cartId,
                total,
                totalProducts: cart.totalProducts,
                uniqueProducts: cart.uniqueProducts,
                items: cart.products.length
            };
        } catch (error) {
            console.error('Error en CartDAO.calculateCartTotal:', error);
            throw error;
        }
    }

    // Verificar disponibilidad de todos los productos del carrito
    async validateCartAvailability(cartId) {
        try {
            const cart = await this.getCartById(cartId);
            const unavailableProducts = [];
            
            for (const item of cart.products) {
                const product = item.product;
                if (!product.isAvailable() || product.stock < item.quantity) {
                    unavailableProducts.push({
                        product: product.title,
                        requested: item.quantity,
                        available: product.stock,
                        status: product.status
                    });
                }
            }
            
            return {
                isValid: unavailableProducts.length === 0,
                unavailableProducts
            };
        } catch (error) {
            console.error('Error en CartDAO.validateCartAvailability:', error);
            throw error;
        }
    }
}

export default CartDAO;