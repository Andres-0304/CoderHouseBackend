import { Router } from 'express';
import ProductDAO from '../dao/ProductDAO.js';

const router = Router();

// Inicializamos el ProductDAO
const productDAO = new ProductDAO();

// Variable para almacenar la instancia de Socket.IO
let io;

// Función para configurar la instancia de Socket.IO
export const setSocketIO = (socketInstance) => {
    io = socketInstance;
};

// GET / - Obtener productos con paginación, filtros y ordenamiento
router.get('/', async (req, res) => {
    try {
        const {
            limit = 10,
            page = 1,
            sort,
            query,
            category,
            status
        } = req.query;

        const options = {
            limit: parseInt(limit),
            page: parseInt(page),
            sort,
            query,
            category,
            status
        };

        const result = await productDAO.getProducts(options);
        
        if (result.status === 'error') {
            return res.status(500).json({
                status: 'error',
                message: result.message || 'Error interno del servidor al obtener productos'
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error en GET /api/products:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Error interno del servidor al obtener productos'
        });
    }
});

// GET /:pid - Obtener producto por ID
router.get('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productDAO.getProductById(pid);
        res.json(product);
    } catch (error) {
        console.error('Error en GET /api/products/:pid:', error);
        if (error.message === 'Producto no encontrado') {
            res.status(404).json({ 
                status: 'error',
                message: 'Producto no encontrado' 
            });
        } else {
            res.status(500).json({ 
                status: 'error',
                message: 'Error interno del servidor al buscar producto' 
            });
        }
    }
});

// POST / - Crear nuevo producto
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        
        // Validar campos requeridos
        const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
        const missingFields = requiredFields.filter(field => !productData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
            });
        }

        const newProduct = await productDAO.createProduct(productData);
        
        // Si hay conexión WebSocket, emitir actualización
        if (io) {
            const productsResult = await productDAO.getProducts({ limit: 50 });
            io.emit('updateProducts', productsResult.payload);
            io.emit('productAdded', newProduct);
        }
        
        res.status(201).json({
            status: 'success',
            payload: newProduct
        });
    } catch (error) {
        console.error('Error en POST /api/products:', error);
        res.status(400).json({ 
            status: 'error',
            message: error.message 
        });
    }
});

// PUT /:pid - Actualizar producto
router.put('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const updates = req.body;
        
        // Validar que no se está intentando actualizar campos prohibidos
        if (updates._id || updates.id) {
            return res.status(400).json({
                status: 'error',
                message: 'No se puede actualizar el ID del producto'
            });
        }

        const updatedProduct = await productDAO.updateProduct(pid, updates);
        
        // Si hay conexión WebSocket, emitir actualización
        if (io) {
            const productsResult = await productDAO.getProducts({ limit: 50 });
            io.emit('updateProducts', productsResult.payload);
            io.emit('productUpdated', updatedProduct);
        }
        
        res.json({
            status: 'success',
            payload: updatedProduct
        });
    } catch (error) {
        console.error('Error en PUT /api/products/:pid:', error);
        if (error.message === 'Producto no encontrado') {
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

// DELETE /:pid - Eliminar producto
router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const result = await productDAO.deleteProduct(pid);
        
        // Si hay conexión WebSocket, emitir actualización
        if (io) {
            const productsResult = await productDAO.getProducts({ limit: 50 });
            io.emit('updateProducts', productsResult.payload);
            io.emit('productDeleted', result);
        }
        
        res.json({
            status: 'success',
            payload: result
        });
    } catch (error) {
        console.error('Error en DELETE /api/products/:pid:', error);
        if (error.message === 'Producto no encontrado') {
            res.status(404).json({ 
                status: 'error',
                message: error.message 
            });
        } else {
            res.status(500).json({ 
                status: 'error',
                message: 'Error interno del servidor al eliminar producto' 
            });
        }
    }
});

export default router;
