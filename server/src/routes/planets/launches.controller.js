const { 
  getAllLaunches, 
  scheduleNewLaunch,
  launchExistsWithId,
  abortLaunchById,
} = require ('../../models/launches.model');

const {
  getPagination
} = require ('../../services/query');

async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);
  const launches = await getAllLaunches(skip, limit);
  return res.status(200).json(launches);
}

function httpAddNewLaunch(req, res) {
  const launch = req.body;
  if(!launch.launchDate || !launch.rocket || !launch.mission ||
     !launch.target){
       return res.status(400).json({
         error: 'Missing required launch property',
       });
    }
  //Convert string to date object
  launch.launchDate = new Date(launch.launchDate);
  //JavaScript converts dates to numbers(unix timestamp date in ms since 1970)
  if(isNaN(launch.launchDate)){
    return res.status(400).json({
      error: 'Invalid launch date'
    });
  }
  try {
    scheduleNewLaunch(launch);
    return res.status(201).json(launch);
  } catch(err){
    console.error("Caught error in launch controller. Send 400 status", err);
    return res.status(400).json({err});
  }
}

async function httpAbortLaunch(req, res){
  //We called the param id in the launch router
  const launchId = Number(req.params.id);
  //If launch doesn't exist return 404
  const existsLaunch = await launchExistsWithId(launchId);
  if(!existsLaunch){
    return res.status(404).json({
      error: 'Launch not found'
    });
  }
  //Abort this launch in the launch model
  const abortedLaunch = await abortLaunchById(launchId);
  if (!abortedLaunch){
    return res.status(400).json({
      error: 'Launch not aborted',
    });
  } else{
    return res.status(200).json({
      ok: true,
    })
  }
}

module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch,
};
