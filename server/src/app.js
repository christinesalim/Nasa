const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const api = require('./routes/api');

const app = express();
app.use(cors({ 
  origin: 'http://localhost:3000'
}));

//For logging
app.use(morgan('combined'));

//Serve static assets from the public folder
app.use(express.static(path.join(__dirname,'..','public' )));//serve all public files for client
app.use(express.json()); //middleware to parse json

app.use('/v1',api);
//Use * to match any routes not handled above by serving index.html and then 
//react can handle the routing
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
})

module.exports = app;