import express from 'express';
import { engine } from 'express-handlebars';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import productsRouter, { setSocketIO } from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';
import ProductManager from './managers/ProductManager.js';

// Configuración __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creamos la instancia de Express
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configuramos el puerto
const PORT = 8080;

// Configuramos el motor de plantillas Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Configuramos archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializamos el ProductManager para WebSockets
const productManager = new ProductManager('data/products.json');

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
            const newProduct = await productManager.addProduct(productData);
            console.log('Producto agregado via WebSocket:', newProduct);
            
            // Obtener todos los productos actualizados
            const products = await productManager.getProducts();
            
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
            const result = await productManager.deleteProduct(productId);
            console.log('Producto eliminado via WebSocket:', result);
            
            // Obtener todos los productos actualizados
            const products = await productManager.getProducts();
            
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

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciamos el servidor
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Vistas disponibles en:`);
    console.log(`- http://localhost:${PORT}/ (Home)`);
    console.log(`- http://localhost:${PORT}/products (Lista de productos)`);
    console.log(`- http://localhost:${PORT}/realtimeproducts (Productos en tiempo real)`);
});
