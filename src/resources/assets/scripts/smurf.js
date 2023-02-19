const { fromUnixTime, intervalToDuration } = require("date-fns");

/**
 * Check if the NG player is a Smurf (alt?) account or not
 * @param {Object} player NG Player Object
 * @returns Probability of the player being a Smurf account as a float
 */
function checkSmurfAccountProbability(player) {
  /**
   * Age would be like less than a month
   * Stats would be that, all 0's or one stat just high (focusing on losses)
   * Playtime, less than an hour or 2 perhaps, or 12/24 hours
   * Rank(s) would be empty probably
   */

  const probabilityList = [];

  // Check the age if less than a month

  const length = intervalToDuration({
    start: fromUnixTime(player.lastQuit),
    end: new Date()
  });

  // Check if the months is less than a month
  if (length.months <= 1) {
    // Check if the days is less than or equal to a month (with the least days)
    if (length.days <= 28) {
      // Calculate the probability from the amount of days it's been since the account has been created
      // New = Maybe
      // Been a while = Probably not?
      probabilityList.push((28 - length.days) / 28).toFixed(2);
    }
  }

  // Check if the stats are all 0's with nothing high

  // Set some variables to check stats
  let zeroStats = 0;
  const hasStatsNumbers = [];

  // Get the values of all the winsData
  const winsDataValues = Object.values(player.winsData);

  // Loop through each stat
  for (const entry of winsDataValues) {
    // If the entry is 0, increment the zeroStats variable (they didn't play the game yet probably)
    if (entry === 0) zeroStats++;
    // Otherwise push the entry to the hasStatsNumbers to check below
    else hasStatsNumbers.push(entry);
  }

  // If zeroStats is one less than the length, and hasStatsNumbers has 1 entry that is more than 10 (could adjust), probably a high amount
  if (zeroStats == winsDataValues.length - 1 && hasStatsNumbers.length === 1 && hasStatsNumbers[0] > 10)
    probabilityList.push(100);
  // Otherwise calculate the probability from the length of winsDataValues
  else probabilityList.push((winsDataValues.length - zeroStats) / winsDataValues.length);

  // Check if the playtime is less than 1 hour (could change this)

  const hour = 1000 * 60 * 60;

  // Get the playtime probability by checking how close the value is from 1 hour, but flipped (0 playtime is high, an hour of playtime is low)
  probabilityList.push((1 - (player.extra.onlineTime / (hour - player.extra.onlineTime)).toFixed(2)) * 100);

  // Check for ranks?

  // Check if the ranks is more than 1. If they have a rank, probably not a big deal
  if (player.ranks.length > 0) probabilityList.push(0);
  // If they don't have any ranks, but the playtime is less than an hour, probably
  else if (player.ranks.length === 0 && player.extra.onlineTime < hour) probabilityList.push(100); // REVIEW Possibly not right?

  // Calculate the total % out of the length of the array
  let total = 0;
  for (const percent of probabilityList) {
    total += +percent;
  }
  const final = +(total / probabilityList.length / 100).toFixed(2);

  // Return the final percent as a float
  return final;
}

module.exports = checkSmurfAccountProbability;