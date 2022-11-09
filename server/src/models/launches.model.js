const axios = require('axios');
const launchesDatabase = require('./launches.mongo');

//Getting the planets list to check if user entered planet is valid by
//comparing it with this list.
const planets = require('./planets.mongo');

const DEFAULT_LAUNCH_NUMBER = 100;

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';


// Get launches from SpaceX api
// The populate field gets the referenced data from the rocket and payloads paths
// and the fields from those paths
async function populateLaunches() {
  //console.log('Downloading launch data...');
  const response = await axios.post( SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false, //gets all launches in one request from API
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

    //Process an array of payloads
    const customers = payloads.flatMap((payload) => {
      //mongoose populates the payload.customers data
      //consolidate multiple customers into one array of customers
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

    //Populate launches collection in database...
    await saveLaunch(launch);
  }
}

// Find a launch given the filter settings
async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

// Load launch data from the external SpaceX API
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


//Returns a JS array with launch data, 
//Remove document id and __v mongoose version key columns
//sort the documents first by flight number and then get results based on pagination
//skip: how many results to skip in the database based on which page we are on
//limit: the number of documents to return per page
//For e.g. If we display limit=10, then on page 2 we skip the first 10 results
async function getAllLaunches(skip, limit){
  return await launchesDatabase
  .find({}, {'id': 0, '__v': 0 })
  .sort({ flightNumber: 1 }) //ascending = 1, descending = -1
  .skip(skip)
  .limit(limit);
}

//Save launch by inserting it into database
//Some launches won't have a target planet such as the SpaceX launches
//Launches scheduled in the client will have a target set and that information
//is validated in the scheduleNewLaunch() function
async function saveLaunch(launch){   
  await launchesDatabase.findOneAndUpdate({
    flightNumber: launch.flightNumber,
  }, launch, {
    upsert: true,
  });  
}


// Schedule a new launch. Used when the client tries to schedule a new launch.
// The target planet for the launch is validated before saving the launch.
// For now the launch customers are hard-coded; we could add this to the client user
// interface in the future.
async function scheduleNewLaunch(launch){
  const planet = await planets.findOne({
    keplerName: launch.target,
  });
  if (!planet){
    throw new Error('No matching planet found');
  }

  //Get the latest flight number and increment it
  const newFlightNumber = await getLatestFlightNumber() + 1;

  //User will provide date, mission, rocket and target properties of a launch
  //Server adds additional properties that are part of a new launch 
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ['U.S.A.', 'NASA'],
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

//Cancel a mission by using the id to find it in the database and mark it
//as not upcoming and not successful
async function abortLaunchById(launchId){
  //Update the launch to indicate it was aborted
  const aborted = await launchesDatabase.updateOne({
    flightNumber: launchId,
  }, {
    //Changing the upcoming status to false aborts the launch
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