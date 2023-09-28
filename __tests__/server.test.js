'use strict';

const request = require('supertest');
const { server } = require('../src/server'); 
const { db } = require('../src/models'); 
// const { userModel } = require('../src/auth/models/users'); 

let userData = {
  testUser: { username: 'user', password: 'password' },
};

describe('Authentication Routes Tests', () => {
  beforeAll(async () => {
    // Connect to the database and sync the models
    await db.sync({ force: true }); // This will recreate the database tables
  });

  afterAll(async () => {
    // Close the database connection
    await db.close();
  });

  it('Can create a new user', async () => {
    const response = await request(server).post('/signup').send(userData.testUser);
    const userObject = response.body;

    expect(response.status).toBe(201);
    expect(userObject.token).toBeDefined();
    expect(userObject.user.id).toBeDefined();
    expect(userObject.user.username).toEqual(userData.testUser.username);
  });

  it('Can signin with basic auth string', async () => {
    let { username, password } = userData.testUser;

    const response = await request(server).post('/signin')
      .auth(username, password);

    const userObject = response.body;
    expect(response.status).toBe(200);
    expect(userObject.token).toBeDefined();
    expect(userObject.user.id).toBeDefined();
    expect(userObject.user.username).toEqual(username);
  });

  // Tests for V1 (Unauthenticated API) routes 

  it('POST /api/v1/:model adds an item to the DB and returns an object with the added item', async () => {
    const newItem = {
        name: 'Strawberry',
        calories: 50, 
        type: 'fruit',
      };
    const response = await request(server)
      .post('/api/v1/food') 
      .send(newItem);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id'); 
  });

  it('GET /api/v1/:model returns a list of :model items', async () => {
    const response = await request(server).get('/api/v1/food');

    expect(response.status).toBe(200);

  });

  it('GET /api/v1/:model/ID returns a single item by ID', async () => {
    const itemId = 1; 
    const response = await request(server).get(`/api/v1/food/${itemId}`); 

    expect(response.status).toBe(200);

  });

  it('PUT /api/v1/:model/ID returns a single, updated item by ID', async () => {
    const itemId = 1; 
    const updatedItem = {
        name: 'Banana',
        calories: 100, 
        type: 'fruit',
      };
    const response = await request(server)
      .put(`/api/v1/food/${itemId}`) 
      .send(updatedItem);

    expect(response.status).toBe(200);

  });

  it('DELETE /api/v1/:model/ID returns an empty object. Subsequent GET for the same ID should result in nothing found', async () => {
    const itemId = 1;
    const deleteResponse = await request(server).delete(`/api/v1/food/${itemId}`); 
    expect(deleteResponse.status).toBe(200);


    const getResponse = await request(server).get(`/api/v1/food/${itemId}`); 

    expect(getResponse.status).toBe(200); 
  });
});

// Tests for V2 (Authenticated API) routes

describe('V2 (Authenticated API) Routes Tests', () => {
    let authToken; // Store the bearer token here
    let testUsers = {
        user: {
            username: 'user',
            password: 'password',
            role: 'user',
        },
        writer: {
            username: 'writer',
            password: 'password',
            role: 'writer',
        },
        editor: {
            username: 'editor',
            password: 'password',
            role: 'editor',
        },
        admin: {
            username: 'admin',
            password: 'password',
            role: 'admin',
        },
    };

    beforeAll(async () => {
        // Create a new user and obtain the bearer token
        const userResponse = await request(server).post('/signup').send(userData.testUser);
        testUser = userResponse.body.user; // Store the user object

        // Authenticate the user and obtain the bearer token
        const authResponse = await request(server)
            .post('/signin')
            .auth(userData.testUser.username, userData.testUser.password);

        authToken = authResponse.body.token;
    });

    it('POST /api/v2/:model with a bearer token that has create permissions adds an item to the DB and returns an object with the added item', async () => {
        const newItem = {
            name: 'Strawberry',
            calories: 50,
            type: 'fruit',
        };

        const response = await request(server)
            .post('/api/v2/Food')
            .set('Authorization', `Bearer ${authToken}`)
            .send(newItem);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
    });

    it('GET /api/v2/:model with a bearer token that has read permissions returns a list of :model items', async () => {
        const response = await request(server)
            .get('/api/v2/Food')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
    });

    it('GET /api/v2/:model/ID with a bearer token that has read permissions returns a single item by ID', async () => {
        const itemId = 1;
        const response = await request(server)
            .get(`/api/v2/Food/${itemId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
    });

    it('PUT /api/v2/:model/ID with a bearer token that has update permissions returns a single, updated item by ID', async () => {
        const itemId = 1;
        const updatedItem = {
            name: 'Updated Strawberry',
            calories: 60,
            type: 'fruit',
        };

        const response = await request(server)
            .put(`/api/v2/Food/${itemId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatedItem);

        expect(response.status).toBe(200);
    });

    it('DELETE /api/v2/:model/ID with a bearer token that has delete permissions returns an empty object. Subsequent GET for the same ID should result in nothing found', async () => {
        const itemId = 1;

        const deleteResponse = await request(server)
            .delete(`/api/v2/Food/${itemId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(deleteResponse.status).toBe(200);

        const getResponse = await request(server)
            .get(`/api/v2/Food/${itemId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(getResponse.status).toBe(404);
    });
});
