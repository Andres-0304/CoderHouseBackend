// Establecer conexión con Socket.IO
const socket = io();

// Referencias a elementos del DOM
const addProductForm = document.getElementById('addProductForm');
const productsList = document.getElementById('productsList');
const noProductsMessage = document.getElementById('noProductsMessage');

// Función para renderizar la lista de productos
function renderProducts(products) {
    productsList.innerHTML = '';
    
    if (products.length === 0) {
        if (noProductsMessage) {
            noProductsMessage.style.display = 'block';
        }
        return;
    }
    
    if (noProductsMessage) {
        noProductsMessage.style.display = 'none';
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-id', product.id);
        
        productCard.innerHTML = `
            <div class="product-title">${product.title}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-info"><strong>Código:</strong> ${product.code}</div>
            <div class="product-price">$${product.price}</div>
            <div class="product-info"><strong>Stock:</strong> ${product.stock} unidades</div>
            <div class="product-info"><strong>Categoría:</strong> ${product.category}</div>
            <div class="product-info">
                <strong>Estado:</strong> 
                ${product.status ? 
                    '<span class="status-active">Activo</span>' : 
                    '<span class="status-inactive">Inactivo</span>'
                }
            </div>
            ${product.thumbnails && product.thumbnails.length > 0 ? `
                <div class="product-info">
                    <strong>Imágenes:</strong>
                    ${product.thumbnails.map((thumb, index) => 
                        `<a href="${thumb}" target="_blank">Imagen ${index}</a>`
                    ).join(', ')}
                </div>
            ` : ''}
            <button class="delete-btn" onclick="deleteProduct(${product.id})">Eliminar Producto</button>
        `;
        
        productsList.appendChild(productCard);
    });
}

// Manejar el envío del formulario para agregar productos
addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(addProductForm);
    const productData = {
        title: formData.get('title'),
        description: formData.get('description'),
        code: formData.get('code'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        category: formData.get('category'),
        status: formData.get('status') === 'true',
        thumbnails: formData.get('thumbnails') ? 
            formData.get('thumbnails').split(',').map(url => url.trim()).filter(url => url) : 
            []
    };
    
    // Validar datos básicos
    if (!productData.title || !productData.description || !productData.code || 
        !productData.price || !productData.stock || !productData.category) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    // Emitir evento para agregar producto
    socket.emit('addProduct', productData);
    
    // Limpiar formulario
    addProductForm.reset();
});

// Función para eliminar un producto
function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        socket.emit('deleteProduct', id);
    }
}

// Escuchar actualizaciones de productos desde el servidor
socket.on('updateProducts', (products) => {
    console.log('Productos actualizados:', products);
    renderProducts(products);
});

// Escuchar notificaciones de productos agregados
socket.on('productAdded', (product) => {
    console.log('Producto agregado:', product);
    // Los productos se actualizarán automáticamente con updateProducts
});

// Escuchar notificaciones de productos eliminados
socket.on('productDeleted', (data) => {
    console.log('Producto eliminado:', data);
    // Los productos se actualizarán automáticamente con updateProducts
});

// Escuchar errores
socket.on('error', (error) => {
    console.error('Error:', error);
    alert('Error: ' + error.message);
});

// Confirmar conexión
socket.on('connect', () => {
    console.log('Conectado al servidor WebSocket');
});

socket.on('disconnect', () => {
    console.log('Desconectado del servidor WebSocket');
});
