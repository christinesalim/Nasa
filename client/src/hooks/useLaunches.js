import { useCallback, useEffect, useState } from "react";

import {
  httpGetLaunches,
  httpSubmitLaunch,
  httpAbortLaunch,
} from './requests';

function useLaunches(onSuccessSound, onAbortSound, onFailureSound) {
  const [launches, saveLaunches] = useState([]);
  const [isPendingLaunch, setPendingLaunch] = useState(false);

  //Get all launches when this function first runs. The useCallback will ensure that
  //on re-render we don't get all the launches over and over again.
  const getLaunches = useCallback(async () => {
    const fetchedLaunches = await httpGetLaunches();
    saveLaunches(fetchedLaunches);
  }, []);

  //Since getLaunches is not redefined on every render, the useEffect() shouldn't 
  //re-run on each re-render
  useEffect(() => {
    getLaunches();
  }, [getLaunches]);

  const submitLaunch = useCallback(async (e) => {
    //prevent page re-load when form is submitted
    e.preventDefault();

    //Flag to track the app submitted a launch
    setPendingLaunch(true);

    //Get the launch values from the form
    const data = new FormData(e.target);
    const launchDate = new Date(data.get("launch-day"));
    const mission = data.get("mission-name");
    const rocket = data.get("rocket-name");
    const target = data.get("planets-selector");

    //Submit an HTTP POST request with the launch data
    //TODO: how do we not wait forever here for a response?
    const response = await httpSubmitLaunch({
      launchDate,
      mission,
      rocket,
      target,
    });

    //Set success based on response.ok
    const success = response.ok;
    if (success) {
      //console.log("Successfully submitted launch; getting updated list from server");
      getLaunches();
      setTimeout(() => {
        setPendingLaunch(false);
        onSuccessSound();
      }, 800);
    } else {
      onFailureSound();
    }
  }, [getLaunches, onSuccessSound, onFailureSound]);

  //Function to abort a launch given its id
  const abortLaunch = useCallback(async (id) => {
    const response = await httpAbortLaunch(id);

    const success = response.ok;
    if (success) {
      getLaunches();
      onAbortSound();
    } else {
      onFailureSound();
    }
  }, [getLaunches, onAbortSound, onFailureSound]);

  return {
    launches,
    isPendingLaunch,
    submitLaunch,
    abortLaunch,
  };
}

export default useLaunches;