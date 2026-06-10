// tests/setup.ts — Jest setup file for ECS server tests
import dotenv from 'dotenv';
import path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '..', '.env.example') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // random port
process.env.DATABASE_URL = 'file:./test.db';
process.env.CORS_ORIGIN = '*';

// Increase timeout for async tests
jest.setTimeout(30000);
