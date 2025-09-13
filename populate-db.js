// Script para poblar la base de datos con datos de ejemplo
import DatabaseConfig from './src/config/database.js';
import ProductDAO from './src/dao/ProductDAO.js';
import CartDAO from './src/dao/CartDAO.js';

const productDAO = new ProductDAO();
const cartDAO = new CartDAO();

const sampleProducts = [
    {
        title: "Laptop Gaming RGB",
        description: "Laptop gaming de alta gama con teclado RGB y tarjeta gráfica dedicada RTX 4060",
        code: "LAP001",
        price: 1299.99,
        status: true,
        stock: 5,
        category: "Tecnología",
        thumbnails: ["laptop1.jpg", "laptop2.jpg"]
    },
    {
        title: "Mouse Gamer Inalámbrico",
        description: "Mouse gaming inalámbrico con sensor óptico de alta precisión y luces RGB",
        code: "MOU001",
        price: 79.99,
        status: true,
        stock: 15,
        category: "Accesorios",
        thumbnails: ["mouse1.jpg"]
    },
    {
        title: "Auriculares Bluetooth Premium",
        description: "Auriculares inalámbricos con cancelación de ruido activa y sonido Hi-Fi",
        code: "AUR001",
        price: 199.99,
        status: true,
        stock: 8,
        category: "Audio",
        thumbnails: ["auriculares1.jpg", "auriculares2.jpg"]
    },
    {
        title: "Teclado Mecánico RGB",
        description: "Teclado mecánico gaming con switches Cherry MX Blue y retroiluminación RGB",
        code: "TEC001",
        price: 149.99,
        status: true,
        stock: 12,
        category: "Accesorios",
        thumbnails: ["teclado1.jpg"]
    },
    {
        title: "Monitor 4K Gaming",
        description: "Monitor gaming 27 pulgadas 4K 144Hz con tecnología G-Sync",
        code: "MON001",
        price: 599.99,
        status: true,
        stock: 3,
        category: "Tecnología",
        thumbnails: ["monitor1.jpg", "monitor2.jpg", "monitor3.jpg"]
    },
    {
        title: "Webcam HD Professional",
        description: "Webcam 1080p con enfoque automático y micrófono integrado",
        code: "CAM001",
        price: 89.99,
        status: true,
        stock: 20,
        category: "Tecnología",
        thumbnails: ["webcam1.jpg"]
    },
    {
        title: "Smartphone Android",
        description: "Smartphone Android con 128GB, cámara triple y pantalla AMOLED",
        code: "TEL001",
        price: 599.99,
        status: true,
        stock: 7,
        category: "Móviles",
        thumbnails: ["smartphone1.jpg", "smartphone2.jpg"]
    },
    {
        title: "Tablet Gaming Pro",
        description: "Tablet de 10 pulgadas optimizada para gaming con 8GB RAM",
        code: "TAB001",
        price: 449.99,
        status: false,
        stock: 0,
        category: "Móviles",
        thumbnails: []
    },
    {
        title: "Silla Gaming Ergonómica",
        description: "Silla gaming con soporte lumbar, reposabrazos ajustables y reclinación",
        code: "SIL001",
        price: 299.99,
        status: true,
        stock: 6,
        category: "Mobiliario",
        thumbnails: ["silla1.jpg", "silla2.jpg"]
    },
    {
        title: "Disco SSD 1TB",
        description: "Disco de estado sólido NVMe de 1TB con velocidades de lectura de 3500 MB/s",
        code: "SSD001",
        price: 129.99,
        status: true,
        stock: 25,
        category: "Tecnología",
        thumbnails: ["ssd1.jpg"]
    }
];

async function populateDatabase() {
    try {
        console.log('Conectando a MongoDB...');
        await DatabaseConfig.connect();
        
        console.log('Poblando base de datos con productos de ejemplo...');
        
        // Crear productos
        const createdProducts = [];
        for (const productData of sampleProducts) {
            try {
                const product = await productDAO.createProduct(productData);
                createdProducts.push(product);
                console.log(`Producto creado: ${product.title}`);
            } catch (error) {
                console.log(`Error al crear producto ${productData.title}: ${error.message}`);
            }
        }
        
        console.log(`\n${createdProducts.length} productos creados exitosamente`);
        
        // Crear algunos carritos de ejemplo
        console.log('\nCreando carritos de ejemplo...');
        
        if (createdProducts.length >= 3) {
            // Carrito 1: Con varios productos
            const cart1 = await cartDAO.createCart();
            await cartDAO.addProductToCart(cart1._id, createdProducts[0]._id, 2);
            await cartDAO.addProductToCart(cart1._id, createdProducts[1]._id, 1);
            await cartDAO.addProductToCart(cart1._id, createdProducts[2]._id, 1);
            console.log(`Carrito 1 creado: ${cart1._id}`);
            
            // Carrito 2: Con menos productos
            const cart2 = await cartDAO.createCart();
            await cartDAO.addProductToCart(cart2._id, createdProducts[3]._id, 1);
            await cartDAO.addProductToCart(cart2._id, createdProducts[4]._id, 1);
            console.log(`Carrito 2 creado: ${cart2._id}`);
            
            // Carrito 3: Vacío
            const cart3 = await cartDAO.createCart();
            console.log(`Carrito 3 creado (vacío): ${cart3._id}`);
        }
        
        console.log('\nBase de datos poblada exitosamente!');
        console.log('\nPuedes probar las siguientes URLs:');
        console.log('   - http://localhost:8080/products (Lista con paginación)');
        console.log('   - http://localhost:8080/api/products?category=Tecnología');
        console.log('   - http://localhost:8080/api/products?sort=asc&limit=5');
        console.log('   - http://localhost:8080/api/products?status=true');
        console.log('   - http://localhost:8080/realtimeproducts (Tiempo real)');
        
    } catch (error) {
        console.error('Error al poblar la base de datos:', error);
    } finally {
        await DatabaseConfig.disconnect();
        process.exit(0);
    }
}

// Ejecutar el script
populateDatabase();