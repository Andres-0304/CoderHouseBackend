import mongoose from 'mongoose';

class DatabaseConfig {
    static async connect() {
        try {
            const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coderhouse_backend';
            
            await mongoose.connect(MONGODB_URI);
            
            console.log('Conectado a MongoDB exitosamente');
            console.log(`Base de datos: ${mongoose.connection.name}`);
            
        } catch (error) {
            console.error('Error al conectar con MongoDB:', error);
            process.exit(1);
        }
    }

    static async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('Desconectado de MongoDB');
        } catch (error) {
            console.error('Error al desconectar de MongoDB:', error);
        }
    }

    static getConnectionState() {
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        return states[mongoose.connection.readyState];
    }
}

export default DatabaseConfig;