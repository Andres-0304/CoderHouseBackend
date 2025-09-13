import { Router } from 'express';
import ProductDAO from '../dao/ProductDAO.js';
import CartDAO from '../dao/CartDAO.js';

const router = Router();
const productDAO = new ProductDAO();
const cartDAO = new CartDAO();

// Helper para Handlebars
function buildQueryString(options, newPage) {
    const params = new URLSearchParams();
    params.set('page', newPage);
    
    if (options.limit && options.limit !== 10) {
        params.set('limit', options.limit);
    }
    if (options.sort) {
        params.set('sort', options.sort);
    }
    if (options.category) {
        params.set('category', options.category);
    }
    if (options.status !== undefined) {
        params.set('status', options.status);
    }
    
    return `/products?${params.toString()}`;
}

// Ruta para la vista home - lista de productos estática
router.get('/', async (req, res) => {
    try {
        const result = await productDAO.getProducts({ limit: 10 });
        res.render('home', {
            title: 'Bienvenido - Lista de Productos',
            products: result.status === 'success' ? result.payload : [],
            error: result.status === 'error' ? result.message : null
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

// Ruta para productos con paginación y filtros
router.get('/products', async (req, res) => {
    try {
        const {
            limit = 10,
            page = 1,
            sort,
            category,
            status
        } = req.query;

        const options = {
            limit: parseInt(limit),
            page: parseInt(page),
            sort,
            category,
            status
        };

        const result = await productDAO.getProducts(options);
        
        if (result.status === 'success') {
            // Construir links de paginación para las vistas
            const prevLink = result.hasPrevPage ? buildQueryString(options, result.prevPage) : null;
            const nextLink = result.hasNextPage ? buildQueryString(options, result.nextPage) : null;
            
            res.render('home', {
                title: 'Lista de Productos',
                products: result.payload,
                pagination: {
                    ...result,
                    prevLink,
                    nextLink,
                    limit: parseInt(limit),
                    totalDocs: result.payload.length
                },
                filters: {
                    category,
                    status,
                    sort
                }
            });
        } else {
            res.render('home', {
                title: 'Lista de Productos',
                products: [],
                error: result.message
            });
        }
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.render('home', {
            title: 'Lista de Productos',
            products: [],
            error: 'Error al cargar los productos'
        });
    }
});

// Ruta para producto individual
router.get('/products/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productDAO.getProductById(pid);
        
        res.render('productDetail', {
            title: `${product.title} - Detalle del Producto`,
            product: product
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.render('productDetail', {
            title: 'Producto no encontrado',
            product: null,
            error: error.message === 'Producto no encontrado' ? 
                'El producto solicitado no existe' : 
                'Error al cargar el producto'
        });
    }
});

// Ruta para vista de carrito específico
router.get('/carts/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await cartDAO.getCartById(cid);
        
        // Calcular totales
        let totalPrice = 0;
        let totalQuantity = 0;
        
        if (cart.products) {
            cart.products.forEach(item => {
                if (item.product && item.product.price) {
                    totalPrice += item.product.price * item.quantity;
                }
                totalQuantity += item.quantity;
            });
        }
        
        res.render('cartDetail', {
            title: 'Carrito de Compras',
            cart: cart,
            totalPrice: totalPrice.toFixed(2),
            totalQuantity: totalQuantity,
            helpers: {
                multiply: (a, b) => (a * b).toFixed(2),
                eq: (a, b) => a === b,
                gt: (a, b) => a > b
            }
        });
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.render('cartDetail', {
            title: 'Carrito no encontrado',
            cart: null,
            error: error.message === 'Carrito no encontrado' ? 
                'El carrito solicitado no existe' : 
                'Error al cargar el carrito'
        });
    }
});

// Ruta para la vista de productos en tiempo real
router.get('/realtimeproducts', async (req, res) => {
    try {
        const result = await productDAO.getProducts({ limit: 50 });
        res.render('realTimeProducts', {
            title: 'Productos en Tiempo Real',
            products: result.status === 'success' ? result.payload : [],
            isRealTime: true,
            error: result.status === 'error' ? result.message : null
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
