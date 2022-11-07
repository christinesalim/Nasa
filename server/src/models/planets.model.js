
const { parse } = require('csv-parse');
const fs = require('fs');
const path = require ('path');

//Stores data from csv file to the MongoDB Planet collection
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

//Retrieve all the habitable planets from the database
async function getAllPlanets(){
  //find takes a filter as first argument: leave bland to get all values
  //second argument is the projection: fields we are interested in; use
  //0 to exclued the id and version data
  return await planets.find({}, {
    '_id': 0, //don't return the id and version
    '__v': 0,
   });
}

//Saves the planet from .csv file to the database
async function savePlanet(planet){
  try {
    
    //to avoid duplicating planets in the collection
    //upsert: combines update + insert; only insert if not present; otherwise
    //update the value
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