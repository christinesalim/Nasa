
const { parse } = require('csv-parse');
const fs = require('fs');
const path = require ('path');

//Stores data from csv file
const planets = require('./planets.mongo');

function isHabitablePlanet(planet) {
  return planet['koi_disposition'] === 'CONFIRMED' 
    && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6;

}

//Create readable stream and pipe it: readableStream.pipe(parser)
//file stream is the source and the parse()function is our writable destination
//for the pipe() call
function loadPlanetsData() {
  return new Promise ( (resolve, reject) => { 
    const file = path.join(__dirname,'..', '..', 'data', 'kepler_data.csv');
    fs.createReadStream(file)
      .pipe(parse({ //pipe the data into the parser to convert into objects
        comment: '#', //treat # as start of comment
        columns: true, //infer column names from first line
      }))
      .on('data', (data) => { //data is a planet object
        if (isHabitablePlanet(data)){
          savePlanet(data);
        }
      })
      .on('error', (err) => {
        console.log(err);
        reject(err);
      })
      .on('end', async () => {
        const countPlanetsFound = (await getAllPlanets()).length;
        console.log(`${countPlanetsFound} habitable planets found`);
        resolve();
      });
  });
}

async function getAllPlanets(){
  return await planets.find({}, {
    '_id': 0, //don't return the id and version
    '__v': 0,
   });
}

//Saves the planet from .csv file to the database
async function savePlanet(planet){
  try {
    //only insert if value is not present otherwise update the value
    await planets.updateOne({
      keplerName: planet.kepler_name,//filter
    },{
      keplerName: planet.kepler_name,//update or insert object
    }, {
      upsert: true,//options only insert if doesn't exist
    });
  } catch(err){
     console.error(`Could not save planet ${err}`);
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
}