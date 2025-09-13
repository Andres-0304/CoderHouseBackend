import { Router } from 'express';
import CartDAO from '../dao/CartDAO.js';

const router = Router();

// Inicializamos el CartDAO
const cartDAO = new CartDAO();

// GET / - Obtener todos los carritos
router.get('/', async (req, res) => {
    try {
        const carts = await cartDAO.getCarts();
        res.json({
            status: 'success',
            payload: carts
        });
    } catch (error) {
        console.error('Error en GET /api/carts:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Error interno del servidor al obtener carritos' 
        });
    }
});

// GET /:cid - Obtener carrito por ID con productos populados
router.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await cartDAO.getCartById(cid);
        res.json({
            status: 'success',
            payload: cart
        });
    } catch (error) {
        console.error('Error en GET /api/carts/:cid:', error);
        if (error.message === 'Carrito no encontrado') {
            res.status(404).json({ 
                status: 'error',
                message: 'Carrito no encontrado' 
            });
        } else {
            res.status(500).json({ 
                status: 'error',
                message: 'Error interno del servidor al buscar carrito' 
            });
        }
    }
});

// POST / - Crear nuevo carrito
router.post('/', async (req, res) => {
    try {
        const newCart = await cartDAO.createCart();
        res.status(201).json({
            status: 'success',
            payload: newCart
        });
    } catch (error) {
        console.error('Error en POST /api/carts:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Error interno del servidor al crear carrito' 
        });
    }
});

// POST /:cid/product/:pid - Agregar producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity = 1 } = req.body;

        // Validar cantidad
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'La cantidad debe ser un número entero mayor a 0'
            });
        }

        const updatedCart = await cartDAO.addProductToCart(cid, pid, quantity);
        res.json({
            status: 'success',
            payload: updatedCart
        });
    } catch (error) {
        console.error('Error en POST /api/carts/:cid/product/:pid:', error);
        if (error.message.includes('no encontrado')) {
            res.status(404).json({ 
                status: 'error',
                message: error.message 
            });
        } else {
            res.status(400).json({ 
                status: 'error',
                message: error.message 
            });
        }
    }
});

// DELETE /:cid/products/:pid - Eliminar producto específico del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const updatedCart = await cartDAO.removeProductFromCart(cid, pid);
        res.json({
            status: 'success',
            payload: updatedCart,
            message: 'Producto eliminado del carrito exitosamente'
        });
    } catch (error) {
        console.error('Error en DELETE /api/carts/:cid/products/:pid:', error);
        if (error.message === 'Carrito no encontrado') {
            res.status(404).json({ 
                status: 'error',
                message: 'Carrito no encontrado' 
            });
        } else {
            res.status(500).json({ 
                status: 'error',
                message: 'Error interno del servidor al eliminar producto del carrito' 
            });
        }
    }
});

// PUT /:cid - Actualizar todos los productos del carrito
router.put('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;

        // Validar que se envió el array de productos
        if (!Array.isArray(products)) {
            return res.status(400).json({
                status: 'error',
                message: 'Se debe enviar un array de productos en el body'
            });
        }

        // Validar estructura de cada producto
        for (const product of products) {
            if (!product.product || !product.quantity) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Cada producto debe tener "product" (ID) y "quantity" (cantidad)'
                });
            }
            
            if (!Number.isInteger(product.quantity) || product.quantity <= 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'La cantidad debe ser un número entero mayor a 0'
                });
            }
        }

        const updatedCart = await cartDAO.updateCartProducts(cid, products);
        res.json({
            status: 'success',
            payload: updatedCart,
            message: 'Carrito actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error en PUT /api/carts/:cid:', error);
        if (error.message === 'Carrito no encontrado') {
            res.status(404).json({ 
                status: 'error',
                message: 'Carrito no encontrado' 
            });
        } else {
            res.status(400).json({ 
                status: 'error',
                message: error.message 
            });
        }
    }
});

// PUT /:cid/products/:pid - Actualizar cantidad de un producto específico
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        // Validar cantidad
        if (quantity === undefined || quantity === null) {
            return res.status(400).json({
                status: 'error',
                message: 'Se debe enviar la cantidad en el body'
            });
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({
                status: 'error',
                message: 'La cantidad debe ser un número entero mayor o igual a 0'
            });
        }

        const updatedCart = await cartDAO.updateProductQuantity(cid, pid, quantity);
        res.json({
            status: 'success',
            payload: updatedCart,
            message: quantity === 0 ? 'Producto eliminado del carrito' : 'Cantidad actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error en PUT /api/carts/:cid/products/:pid:', error);
        if (error.message.includes('no encontrado')) {
            res.status(404).json({ 
                status: 'error',
                message: error.message 
            });
        } else {
            res.status(400).json({ 
                status: 'error',
                message: error.message 
            });
        }
    }
});

// DELETE /:cid - Eliminar todos los productos del carrito (vaciar carrito)
router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const clearedCart = await cartDAO.clearCart(cid);
        res.json({
            status: 'success',
            payload: clearedCart,
            message: 'Carrito vaciado exitosamente'
        });
    } catch (error) {
        console.error('Error en DELETE /api/carts/:cid:', error);
        if (error.message === 'Carrito no encontrado') {
            res.status(404).json({ 
                status: 'error',
                message: 'Carrito no encontrado' 
            });
        } else {
            res.status(500).json({ 
                status: 'error',
                message: 'Error interno del servidor al vaciar carrito' 
            });
        }
    }
});

export default router;
