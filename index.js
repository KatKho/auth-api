'use strict';

require('dotenv').config();
const server = require('./src/server.js');
const { db } = require('./src/models');

const PORT = process.env.PORT || 3002;

db.sync()
  .then(() => {
    server.start(PORT);
  }).catch(e => {
    console.error('Could not start server', e.message);
  });
