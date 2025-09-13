import Product from '../models/Product.js';

class ProductDAO {
    // Obtener productos con paginación y filtros
    async getProducts(options = {}) {
        try {
            const {
                limit = 10,
                page = 1,
                sort,
                query,
                category,
                status
            } = options;

            // Construcción de filtros
            const filter = {};
            
            if (query) {
                filter.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } }
                ];
            }
            
            if (category) {
                filter.category = { $regex: category, $options: 'i' };
            }
            
            if (status !== undefined) {
                filter.status = status === 'true' || status === true;
            }

            // Configuración de ordenamiento
            let sortOptions = {};
            if (sort === 'asc') {
                sortOptions.price = 1;
            } else if (sort === 'desc') {
                sortOptions.price = -1;
            }

            // Opciones de paginación
            const paginateOptions = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: Object.keys(sortOptions).length > 0 ? sortOptions : undefined,
                lean: false
            };

            const result = await Product.paginate(filter, paginateOptions);
            
            return {
                status: 'success',
                payload: result.docs,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevLink: result.hasPrevPage ? this.buildLink(options, result.prevPage) : null,
                nextLink: result.hasNextPage ? this.buildLink(options, result.nextPage) : null
            };
            
        } catch (error) {
            console.error('Error en ProductDAO.getProducts:', error);
            return {
                status: 'error',
                payload: [],
                message: error.message
            };
        }
    }

    // Construir links para paginación
    buildLink(options, page) {
        const params = new URLSearchParams();
        params.set('page', page);
        
        if (options.limit && options.limit !== 10) {
            params.set('limit', options.limit);
        }
        if (options.sort) {
            params.set('sort', options.sort);
        }
        if (options.query) {
            params.set('query', options.query);
        }
        if (options.category) {
            params.set('category', options.category);
        }
        if (options.status !== undefined) {
            params.set('status', options.status);
        }
        
        return `/api/products?${params.toString()}`;
    }

    // Obtener producto por ID
    async getProductById(id) {
        try {
            const product = await Product.findById(id);
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            return product;
        } catch (error) {
            console.error('Error en ProductDAO.getProductById:', error);
            throw error;
        }
    }

    // Obtener producto por código
    async getProductByCode(code) {
        try {
            return await Product.findByCode(code);
        } catch (error) {
            console.error('Error en ProductDAO.getProductByCode:', error);
            throw error;
        }
    }

    // Crear producto
    async createProduct(productData) {
        try {
            // Verificar que el código no existe
            const existingProduct = await this.getProductByCode(productData.code);
            if (existingProduct) {
                throw new Error(`Ya existe un producto con el código ${productData.code}`);
            }

            const product = new Product(productData);
            await product.save();
            return product;
        } catch (error) {
            console.error('Error en ProductDAO.createProduct:', error);
            throw error;
        }
    }

    // Actualizar producto
    async updateProduct(id, updateData) {
        try {
            // Si se está actualizando el código, verificar que no existe
            if (updateData.code) {
                const existingProduct = await Product.findOne({ 
                    code: updateData.code.toUpperCase(),
                    _id: { $ne: id }
                });
                if (existingProduct) {
                    throw new Error(`Ya existe un producto con el código ${updateData.code}`);
                }
            }

            // No permitir actualizar el ID
            delete updateData._id;
            delete updateData.id;

            const product = await Product.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            );
            
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            
            return product;
        } catch (error) {
            console.error('Error en ProductDAO.updateProduct:', error);
            throw error;
        }
    }

    // Eliminar producto
    async deleteProduct(id) {
        try {
            const product = await Product.findByIdAndDelete(id);
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            return { 
                message: 'Producto eliminado exitosamente',
                deletedProduct: product 
            };
        } catch (error) {
            console.error('Error en ProductDAO.deleteProduct:', error);
            throw error;
        }
    }

    // Verificar disponibilidad de producto
    async checkAvailability(id, quantity = 1) {
        try {
            const product = await this.getProductById(id);
            return product.isAvailable() && product.stock >= quantity;
        } catch (error) {
            console.error('Error en ProductDAO.checkAvailability:', error);
            return false;
        }
    }

    // Reducir stock de producto
    async reduceStock(id, quantity) {
        try {
            const product = await this.getProductById(id);
            if (product.reduceStock(quantity)) {
                await product.save();
                return product;
            }
            throw new Error('Stock insuficiente');
        } catch (error) {
            console.error('Error en ProductDAO.reduceStock:', error);
            throw error;
        }
    }

    // Obtener productos por categoría
    async getProductsByCategory(category, options = {}) {
        return this.getProducts({ ...options, category });
    }

    // Obtener productos disponibles
    async getAvailableProducts(options = {}) {
        return this.getProducts({ ...options, status: true });
    }
}

export default ProductDAO;