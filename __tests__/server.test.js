'use strict';

const request = require('supertest');
const { server } = require('../src/server'); 
const { db } = require('../src/models'); 

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
});