const request = require('supertest');
//express server app
const app = require('../../app');
const { loadPlanetsData } = require('../../models/planets.model');
const { 
  mongoConnect, 
  mongoDisconnect 
} = require('../../services/mongo');

const {
  loadPlanetsData,
} = require ('../../models/planets.model');

const completeLaunchData = {
  mission: 'USS Enterprise',
  rocket: 'NCC 1783-D',
  target: 'Kepler -186 f',
  launchDate: 'February 7, 2025'
};
const launchDataWithoutDate = {
  mission: 'USS Enterprise',
  rocket: 'NCC 1783-D',
  target: 'Kepler -186 f',
};
const launchDataWithInvalidDate = {
  mission: 'USS Enterprise',
  rocket: 'NCC 1783-D',
  target: 'Kepler -186 f',
  launchDate: 'invalid'
};


describe('Launches API', () => {

  //Setup database connection
  beforeAll(async ()=> {
    await mongoConnect();
    await loadPlanetsData();
  });

  //Disconnect from database
  afterAll(async () => {
    await mongoDisconnect();
  });

  describe('Test GET /launches', () => {
    test('It should respond with 200 success', async () => {
      //SuperTest request to test get('/launches')
      const response = await request(app)
        .get('/v1/launches')
        .expect('Content-Type', /json/) //check if it contains the word json
        .expect(200); //status code
    });

  });

  describe('Test POST /launches', () => {
    test('It should  respond with 200 success', async () => {    

      const response = await request(app)
        .post('/v1/launches')
        .send(completeLaunchData)
        .expect('Content-Type', /json/)
        .expect(201); //resource created
        
      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
      
    });

    test('It should catch missing required properties', async() => {
      const response = await request(app)
        .post('/v1/launches')
        .send(launchDataWithoutDate)
        .expect('Content-Type', /json/)
        .expect(400);
      expect (response.body).toStrictEqual({
        error: 'Missing required launch property',
      });
    });

    test('It should catch invalid dates', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(launchDataWithInvalidDate)
        .expect('Content-Type', /json/)
        .expect(400);
      expect (response.body).toStrictEqual({
        error: 'Invalid launch date',
      });
    })
  });
});