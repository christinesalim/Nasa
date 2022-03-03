const mongoose = require('mongoose');

//Read environment variables set for database connection
require('dotenv').config();

//Atlas database connection string
const MONGO_URL = process.env.MONGO_URL;

//connect to the MongoDB
async function mongoConnect(){
  await mongoose.connect(MONGO_URL);
}

//disconnect
async function mongoDisconnect() {
  await mongoose.disconnect();
}

mongoose.connection.once('open', () => {
  console.log('MongoDB connection ready!');
});

mongoose.connection.on('error', (err) => {
  console.error(err);
});

module.exports = {
  mongoConnect,
  mongoDisconnect,
}