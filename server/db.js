"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.db = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const mysql2_1 = require("drizzle-orm/mysql2");
const schema = __importStar(require("@shared/schema"));
// Database connection configuration
const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_attendance',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00', // Use UTC for consistency
    charset: 'utf8mb4_unicode_ci'
};
console.log('Attempting to connect to database with config:', {
    host: connectionConfig.host,
    port: connectionConfig.port,
    user: connectionConfig.user,
    database: connectionConfig.database
});
const connection = await promise_1.default.createConnection(connectionConfig);
exports.connection = connection;
// Create drizzle instance
exports.db = (0, mysql2_1.drizzle)(connection, { schema, mode: 'default' });
// Test database connection
try {
    console.log('Successfully connected to MySQL database on port ' + (process.env.DB_PORT || '3306'));
    // Test query to verify table exists
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Available tables:', tables);
    // Test teacher_availability table
    const [columns] = await connection.query('DESCRIBE teacher_availability');
    console.log('Teacher availability table structure:', columns);
    // Test John Smith's availability if exists
    const [johnAvailabilityRows] = await connection.query('SELECT * FROM teacher_availability WHERE teacher_id = 1 LIMIT 1');
    // @ts-ignore
    if (johnAvailabilityRows.length > 0) {
        // @ts-ignore
        console.log('John Smith\'s availability sample:', johnAvailabilityRows[0]);
    }
}
catch (error) {
    console.error('Error connecting to MySQL:', error);
    process.exit(1);
}
