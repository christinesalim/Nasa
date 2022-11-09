const express = require('express');
const planetsRouter = require('./planets/planets.router');
const launchesRouter = require('./launches/launches.router');

const api = express.Router();

api.use("/planets", planetsRouter); //handle planets requests
api.use("/launches", launchesRouter); //handle launches requests

module.exports = api;