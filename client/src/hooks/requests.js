const API_URL='v1'; //use relative path for the client based on where the client is running
                    //this will work for localhost:8000 and any other host on the cloud

// Load planets and return as JSON.
async function httpGetPlanets() {
  const resp = await fetch(`${API_URL}/planets`);
  return await resp.json();
}

// Load launches, sort by flight number, and return as JSON.
async function httpGetLaunches() {
  //default method is GET with fetch()
  const resp = await fetch(`${API_URL}/launches`);
  const launches = await resp.json();
  return launches.sort( (a,b) => {
    return a.flightNumber - b.flightNumber;
  });
}


// Submit given launch data to launch system.
async function httpSubmitLaunch(launch) {
  try{
    //ok status of response is returned to caller useLaunches hook
    return await fetch(`${API_URL}/launches`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(launch),
    });
  } catch(err) {
    //In case of error return ok value of false to the caller
    return {
      ok: false,
      err,
    } 
  }
  
}

// Delete launch with given ID.
async function httpAbortLaunch(id) {
  try{
    //send HTTP delete request for this launch ID
    return await fetch(`${API_URL}/launches/${id}`, {
      method: "delete",
    });
  }catch(err){
    return{
      ok: false,
      err
    };
  }
}

export {
  httpGetPlanets,
  httpGetLaunches,
  httpSubmitLaunch,
  httpAbortLaunch,
};