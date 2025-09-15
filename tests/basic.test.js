const request = require('supertest');
const app = require('../server');

describe('Basic API Tests', () => {
    test('GET / should return 200', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    test('GET /api/products should return 200', async () => {
        const response = await request(app).get('/api/products');
        expect(response.status).toBe(200);
    });

    test('GET /api/products/categories/list should return 200', async () => {
        const response = await request(app).get('/api/products/categories/list');
        expect(response.status).toBe(200);
    });

    test('POST /api/auth/register with invalid data should return 400', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'invalid-email',
                password: '123'
            });
        expect(response.status).toBe(400);
    });

    test('POST /api/auth/login with invalid credentials should return 401', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
        expect(response.status).toBe(401);
    });
});

describe('Product API Tests', () => {
    test('GET /api/products with pagination should work', async () => {
        const response = await request(app)
            .get('/api/products')
            .query({ page: 1, limit: 10 });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('GET /api/products with category filter should work', async () => {
        const response = await request(app)
            .get('/api/products')
            .query({ category: 'clothing' });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('GET /api/products with search should work', async () => {
        const response = await request(app)
            .get('/api/products')
            .query({ search: 'test' });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});

describe('Error Handling Tests', () => {
    test('GET /api/nonexistent should return 404', async () => {
        const response = await request(app).get('/api/nonexistent');
        expect(response.status).toBe(404);
    });

    test('POST /api/auth/register with missing fields should return 400', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({});
        expect(response.status).toBe(400);
    });
});

