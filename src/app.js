import express from 'express';
import { engine } from 'express-handlebars';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import DatabaseConfig from './config/database.js';
import productsRouter, { setSocketIO } from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';
import ProductDAO from './dao/ProductDAO.js';

// Configuración __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creamos la instancia de Express
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configuramos el puerto
const PORT = process.env.PORT || 8080;

// Conectar a MongoDB
await DatabaseConfig.connect();

// Configuramos el motor de plantillas Handlebars con helpers
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
        eq: (a, b) => a === b,
        gt: (a, b) => a > b,
        lt: (a, b) => a < b,
        multiply: (a, b) => (a * b).toFixed(2),
        add: (a, b) => a + b,
        subtract: (a, b) => a - b,
        json: (context) => JSON.stringify(context)
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Configuramos archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializamos el ProductDAO para WebSockets
const productDAO = new ProductDAO();

// Configuramos Socket.IO en el router de productos
setSocketIO(io);

// Configuramos las rutas principales
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

// Configuración de WebSockets
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Manejar la adición de productos
    socket.on('addProduct', async (productData) => {
        try {
            console.log('Intentando agregar producto via WebSocket:', productData);
            
            // Validar campos requeridos
            const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
            const missingFields = requiredFields.filter(field => !productData[field]);
            
            if (missingFields.length > 0) {
                socket.emit('error', { 
                    message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
                });
                return;
            }

            const newProduct = await productDAO.createProduct(productData);
            console.log('Producto agregado via WebSocket:', newProduct);
            
            // Obtener todos los productos actualizados
            const result = await productDAO.getProducts({ limit: 50 });
            const products = result.status === 'success' ? result.payload : [];
            
            // Emitir a todos los clientes conectados
            io.emit('updateProducts', products);
            io.emit('productAdded', newProduct);
        } catch (error) {
            console.error('Error al agregar producto via WebSocket:', error);
            socket.emit('error', { message: error.message });
        }
    });

    // Manejar la eliminación de productos
    socket.on('deleteProduct', async (productId) => {
        try {
            console.log('Intentando eliminar producto via WebSocket:', productId);
            
            const result = await productDAO.deleteProduct(productId);
            console.log('Producto eliminado via WebSocket:', result);
            
            // Obtener todos los productos actualizados
            const productsResult = await productDAO.getProducts({ limit: 50 });
            const products = productsResult.status === 'success' ? productsResult.payload : [];
            
            // Emitir a todos los clientes conectados
            io.emit('updateProducts', products);
            io.emit('productDeleted', result);
        } catch (error) {
            console.error('Error al eliminar producto via WebSocket:', error);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Middleware global para manejo de errores
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ 
        status: 'error',
        message: 'Ruta no encontrada' 
    });
});

// Manejo elegante de cierre de aplicación
process.on('SIGINT', async () => {
    console.log('\nCerrando servidor...');
    await DatabaseConfig.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nCerrando servidor...');
    await DatabaseConfig.disconnect();
    process.exit(0);
});

// Iniciamos el servidor
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Estado de MongoDB: ${DatabaseConfig.getConnectionState()}`);
    console.log(`Vistas disponibles en:`);
    console.log(`   - http://localhost:${PORT}/ (Home)`);
    console.log(`   - http://localhost:${PORT}/products (Lista de productos con paginación)`);
    console.log(`   - http://localhost:${PORT}/realtimeproducts (Productos en tiempo real)`);
    console.log(`API disponible en:`);
    console.log(`   - http://localhost:${PORT}/api/products (CRUD con paginación y filtros)`);
    console.log(`   - http://localhost:${PORT}/api/carts (CRUD de carritos con populate)`);
});
