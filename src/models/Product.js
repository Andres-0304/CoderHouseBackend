import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        maxlength: [100, 'El título no puede exceder 100 caracteres']
    },
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    code: {
        type: String,
        required: [true, 'El código es obligatorio'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'El código no puede exceder 20 caracteres']
    },
    price: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [0, 'El precio debe ser mayor o igual a 0']
    },
    status: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio'],
        min: [0, 'El stock debe ser mayor o igual a 0'],
        validate: {
            validator: Number.isInteger,
            message: 'El stock debe ser un número entero'
        }
    },
    category: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        trim: true,
        maxlength: [50, 'La categoría no puede exceder 50 caracteres']
    },
    thumbnails: {
        type: [String],
        default: [],
        validate: {
            validator: function(v) {
                return v.length <= 5;
            },
            message: 'No se pueden agregar más de 5 imágenes'
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

// Índices para optimizar consultas
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
// El índice unique para code ya está definido en el schema

// Plugin de paginación
productSchema.plugin(mongoosePaginate);

// Middleware pre-save para validaciones adicionales
productSchema.pre('save', function(next) {
    if (this.isModified('code')) {
        this.code = this.code.toUpperCase();
    }
    next();
});

// Método virtual para obtener disponibilidad
productSchema.virtual('available').get(function() {
    return this.status && this.stock > 0;
});

// Método estático para buscar por código
productSchema.statics.findByCode = function(code) {
    return this.findOne({ code: code.toUpperCase() });
};

// Método de instancia para verificar disponibilidad
productSchema.methods.isAvailable = function() {
    return this.status && this.stock > 0;
};

// Método de instancia para reducir stock
productSchema.methods.reduceStock = function(quantity) {
    if (this.stock >= quantity) {
        this.stock -= quantity;
        return true;
    }
    return false;
};

const Product = mongoose.model('Product', productSchema);

export default Product;