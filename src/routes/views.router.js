import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';

const router = Router();
const productManager = new ProductManager('data/products.json');

// Ruta para la vista home - lista de productos estática
router.get('/', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.render('home', {
            title: 'Lista de Productos',
            products: products
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.render('home', {
            title: 'Lista de Productos',
            products: [],
            error: 'Error al cargar los productos'
        });
    }
});

// Ruta para productos (alias de home)
router.get('/products', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.render('home', {
            title: 'Lista de Productos',
            products: products
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.render('home', {
            title: 'Lista de Productos',
            products: [],
            error: 'Error al cargar los productos'
        });
    }
});

// Ruta para la vista de productos en tiempo real
router.get('/realtimeproducts', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.render('realTimeProducts', {
            title: 'Productos en Tiempo Real',
            products: products,
            isRealTime: true
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.render('realTimeProducts', {
            title: 'Productos en Tiempo Real',
            products: [],
            isRealTime: true,
            error: 'Error al cargar los productos'
        });
    }
});

export default router;
