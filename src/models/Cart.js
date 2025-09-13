import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'La cantidad debe ser mayor a 0'],
            validate: {
                validator: Number.isInteger,
                message: 'La cantidad debe ser un número entero'
            }
        }
    }]
}, {
    timestamps: true,
    versionKey: false
});

// Índice para optimizar consultas
cartSchema.index({ 'products.product': 1 });

// Método virtual para obtener el total de productos
cartSchema.virtual('totalProducts').get(function() {
    return this.products.reduce((total, item) => total + item.quantity, 0);
});

// Método virtual para obtener el total de productos únicos
cartSchema.virtual('uniqueProducts').get(function() {
    return this.products.length;
});

// Método de instancia para agregar producto
cartSchema.methods.addProduct = function(productId, quantity = 1) {
    const existingProduct = this.products.find(item => 
        item.product.toString() === productId.toString()
    );
    
    if (existingProduct) {
        existingProduct.quantity += quantity;
    } else {
        this.products.push({ product: productId, quantity });
    }
    
    return this.save();
};

// Método de instancia para remover producto
cartSchema.methods.removeProduct = function(productId) {
    this.products = this.products.filter(item => 
        item.product.toString() !== productId.toString()
    );
    return this.save();
};

// Método de instancia para actualizar cantidad de producto
cartSchema.methods.updateProductQuantity = function(productId, quantity) {
    const productItem = this.products.find(item => 
        item.product.toString() === productId.toString()
    );
    
    if (productItem) {
        if (quantity <= 0) {
            return this.removeProduct(productId);
        } else {
            productItem.quantity = quantity;
            return this.save();
        }
    }
    
    throw new Error('Producto no encontrado en el carrito');
};

// Método de instancia para limpiar carrito
cartSchema.methods.clear = function() {
    this.products = [];
    return this.save();
};

// Método de instancia para reemplazar todos los productos
cartSchema.methods.replaceProducts = function(newProducts) {
    // Validar formato de productos
    if (!Array.isArray(newProducts)) {
        throw new Error('Los productos deben ser un array');
    }
    
    for (const item of newProducts) {
        if (!item.product || !item.quantity || item.quantity <= 0) {
            throw new Error('Cada producto debe tener un ID válido y cantidad mayor a 0');
        }
    }
    
    this.products = newProducts;
    return this.save();
};

// Método de instancia para obtener productos con populate
cartSchema.methods.getPopulatedProducts = function() {
    return this.populate({
        path: 'products.product',
        select: 'title description price category stock status thumbnails'
    });
};

// Middleware pre-save para validaciones
cartSchema.pre('save', function(next) {
    // Eliminar productos duplicados (por si acaso)
    const uniqueProducts = [];
    const seenProducts = new Set();
    
    for (const item of this.products) {
        const productId = item.product.toString();
        if (!seenProducts.has(productId)) {
            seenProducts.add(productId);
            uniqueProducts.push(item);
        } else {
            // Si ya existe, sumar la cantidad
            const existing = uniqueProducts.find(p => 
                p.product.toString() === productId
            );
            existing.quantity += item.quantity;
        }
    }
    
    this.products = uniqueProducts;
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;