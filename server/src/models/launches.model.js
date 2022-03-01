const axios = require('axios');
const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_LAUNCH_NUMBER = 100;

const launches = new Map();

const launch = {
  flightNumber: 100, //flight_number
  mission: 'Kepler Exploration X', //name
  rocket: 'Explorer IS1', //found under rocket.name
  launchDate: new Date('February 7, 2030'), //date_local
  target: 'Kepler-442 b', //not applicable
  customers: ['NASA', 'U.S. Govt'],//payload.customers for each payload
  upcoming: true, //upcoming
  success: true, //success
};

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

//get launches from SpaceX api
async function populateLaunches() {
  console.log('Downloading launch data...');
  const response = await axios.post( SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1
          }
        },
        {
          path: 'payloads',
          select: {
            customers: 1
          }
        }
      ]
    }
  });

  if (response.status !== 200) {
    console.log('Problem downloading launch data');
    throw new Error('Launch data download failed');
  }

  const launchDocs = response.data.docs;
  for(const launchDoc of launchDocs){
    const payloads = launchDoc['payloads'];
    const customers = payloads.flatMap((payload) => {
      //mongoose populates the payload.customers data
      return payload['customers'];
    })

    const launch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'],
      rocket: launchDoc['rocket']['name'],
      launchDate: launchDoc['date_local'],
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
      customers,
    };

    console.log(`${launch.flightNumber} ${launch.mission} ${customers}`);

    //Populate launches collection in database...
    await saveLaunch(launch);
  }
}

async function loadLaunchData(){
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat',
  });

  if(firstLaunch) {
    console.log('Launch data already exists');    
  } else {
    await populateLaunches();
  }  
}


//Returns a JS array with launch data, remove id and __v columns
async function getAllLaunches(skip, limit){
  return await launchesDatabase
  .find({}, {'id': 0, '__v': 0 })
  .sort({ flightNumber: 1 }) //ascending = 1, descending = -1
  .skip(skip)
  .limit(limit);
}

//Save launch
async function saveLaunch(launch){   
  await launchesDatabase.findOneAndUpdate({
    flightNumber: launch.flightNumber,
  }, launch, {
    upsert: true,
  });  
}


//Schedule a new launch
async function scheduleNewLaunch(launch){
  const planet = await planets.findOne({
    keplerName: launch.target,
  });
  if (!planet){
    throw new Error('No matching planet found');
  }
  const newFlightNumber = await getLatestFlightNumber() + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ['U.S.', 'NASA'],
    flightNumber: newFlightNumber,
  });
  try {
    await saveLaunch(newLaunch);
  } catch(err){
    console.log(err);
  }  
}


//Check if launch exists
async function launchExistsWithId(launchId){
  return await findLaunch({
    flightNumber: launchId,
  });
}

//Get the last flight number of launch
async function getLatestFlightNumber(){
  const latestLaunch = await launchesDatabase
    .findOne() //get the highest number
    .sort('-flightNumber');//sort results by flight number in descending order
  if(!latestLaunch){
    return DEFAULT_LAUNCH_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function abortLaunchById(launchId){
  //Update the launch to indicate it was aborted
  const aborted = await launchesDatabase.updateOne({
    flightNumber: launchId,
  }, {
    upcoming: false,
    success:false,
  });
  
  return aborted.modifiedCount === 1;
}

module.exports = {
  loadLaunchData,
  getAllLaunches,
  scheduleNewLaunch,
  launchExistsWithId,
  abortLaunchById,
};