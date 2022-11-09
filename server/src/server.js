const http = require('http');
require('dotenv').config();

const app = require('./app');
const { mongoConnect } = require('./services/mongo');

const { loadPlanetsData } = require('./models/planets.model');
const { loadLaunchData } = require('./models/launches.model');

//Use PORT from environment variable or default to port 8000
const PORT = process.env.PORT || 8000;

//Pass in the express server as a middleware
const server = http.createServer(app);


async function startServer() { 
  //connect to database
  await mongoConnect();
  
  //Load the planets data before accepting API requests
  await loadPlanetsData();

  //Load launch data from the SpaceX API
  await loadLaunchData();

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

startServer();

