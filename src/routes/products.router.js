import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';

const router = Router();

// Inicializamos el ProductManager
const productManager = new ProductManager('./data/products.json');

// GET / - Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al obtener productos' });
    }
});

// GET /:pid - Obtener producto por ID
router.get('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productManager.getProductById(pid);
        
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al buscar producto' });
    }
});

// POST / - Crear nuevo producto
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        const newProduct = await productManager.addProduct(productData);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /:pid - Actualizar producto
router.put('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const updates = req.body;
        const updatedProduct = await productManager.updateProduct(pid, updates);
        res.json(updatedProduct);
    } catch (error) {
        if (error.message === 'Producto no encontrado') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
});

// DELETE /:pid - Eliminar producto
router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const result = await productManager.deleteProduct(pid);
        res.json(result);
    } catch (error) {
        if (error.message === 'Producto no encontrado') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al eliminar producto' });
        }
    }
});

export default router;
