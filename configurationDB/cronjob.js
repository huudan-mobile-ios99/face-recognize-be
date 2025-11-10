const cron = require('node-cron');
const dboperation = require('./dboperation');
const axios = require('axios');
let countTotal = 0;             // Count total job executions
let currentCronJob = null;
let isExecuting = false;        // Prevent overlapping runs
let previousPlayers = new Set(); // store customer numbers currently playing
const { randomLetters, randomNumbers } = require("../utils/randomUtil");



async function executeJob() {
    if (isExecuting) {
        console.log("Job already running, skipping...");
        return;
    }

    isExecuting = true;
    const currentDate = new Date().toISOString().split('T')[0];

    try {
        const data = await dboperation.getSlotOnlineStatus(currentDate);
        countTotal++;

        console.log(`[${countTotal}] Machine Online Status Count: ${data.length}`);
        // Extract list of active customer numbers (always as string)
        const currentPlayers = new Set(data.map(d => String(d.Number)));

        // Detect new players (joined)
        const newPlayers = [...currentPlayers].filter(x => !previousPlayers.has(x));

        // Detect players who stopped playing
        const endedPlayers = [...previousPlayers].filter(x => !currentPlayers.has(x));

        // If any new player joined → show screen
        if (newPlayers.length > 0) {
            const newPlayersData = data.filter(d => newPlayers.includes(String(d.Number)));
            console.log(`🎮 New players joined: ${newPlayers.map(n => `#${n}`).join(", ")}`);
            await myJobCreateStream(newPlayersData);
        }

        // If any player stopped → show ads
        if (endedPlayers.length > 0) {
            console.log(`🏁 Players stopped: ${endedPlayers.join(", ")}`);
            myJobEndStream(endedPlayers); // make sure this function exists
        }

        // ✅ Always update tracking after each run
        previousPlayers = currentPlayers;

    } catch (error) {
        console.log(`Error fetching machine status: ${error}`);
    } finally {
        isExecuting = false;
    }
}



async function myJobCreateStream(playersData) {
  console.log("Running Create Stream for detected players...");

  for (const player of playersData) {
    const customerNumber = String(player.Number);
    const customerName = player.PreferredName || `Player_${customerNumber}`;
    const machineNumber = player.MachineNumber || "Unknown";

    try {
      // Try to get the customer
      const res = await axios.get(`http://localhost:8081/api/v1/customer/${customerNumber}`);
      const existingCustomer = res.data;

      console.log(`✅ Customer ${customerNumber} exists (${customerName}). Adding new stream...`);

      // ✅ Add a new stream to existing customer
      const newStream = {
        streamId: randomNumbers(),
        streamName: randomLetters(),
        streamMachine: machineNumber,
        streamUrl: "ws://192.168.101.169:3333/app/stream",
        status: true,
        streamStartTime: new Date(),
      };

      await axios.post(
        `http://localhost:8081/api/v1/customer/${customerNumber}/streams`,
        newStream
      );

      console.log(`🎮 Added stream ${newStream.streamName} for ${customerName} (#${customerNumber})`);

    } catch (err) {
      // 404 means customer doesn’t exist — create a new one
      if (err.response && err.response.status === 404) {
        console.log(`➕ Customer ${customerNumber} not found. Creating new with first stream...`);

        const newStream = {
          streamId: randomNumbers(),
          streamName: randomLetters(),
          streamMachine: machineNumber,
          streamUrl: "ws://192.168.101.169:3333/app/stream",
          status: true,
          streamStartTime: new Date(),
        };

        await axios.post(`http://localhost:8081/api/v1/customer/`, {
          customerNumber,
          customerName,
          streams: [newStream],
        });

        console.log(`🎉 Created new customer: ${customerName} (#${customerNumber}) with stream ${newStream.streamName}`);
      } else {
        console.error(`❌ Error handling player ${customerNumber}:`, err.response?.data || err.message);
      }
    }
  }
}


async function myJobEndStream(stoppedPlayers) {
  console.log("🏁 Running job end stream for stopped players...");

  for (const playerNumber of stoppedPlayers) {
    try {
      // Step 1️⃣ Get the customer by number
      const res = await axios.get(`http://localhost:8081/api/v1/customer/${playerNumber}`);
      const customer = res.data;

      if (!customer || !customer.streams || customer.streams.length === 0) {
        console.log(`⚠️ No streams found for player #${playerNumber}`);
        continue;
      }

      // Step 2️⃣ Find the latest active stream (status: true)
      const activeStream = customer.streams
        .filter(s => s.status === true)
        .sort((a, b) => new Date(b.streamStartTime) - new Date(a.streamStartTime))[0];

      if (!activeStream) {
        console.log(`ℹ️ No active stream found for player #${playerNumber}`);
        continue;
      }

      // Step 3️⃣ Calculate duration and mark stream as ended
      const endTime = new Date();
      const startTime = new Date(activeStream.streamStartTime);
      const durationSeconds = Math.floor((endTime - startTime) / 1000); // duration in seconds

      // Step 4️⃣ Update stream (status, endTime, duration)
      await axios.put(
        `http://localhost:8081/api/v1/customer/${playerNumber}/streams/${activeStream.streamId}/status`,
        { status: false }
      );

      // Step 5️⃣ Update other fields (endTime & duration)
      await axios.put(
        `http://localhost:8081/api/v1/customer/${playerNumber}/streams/${activeStream.streamId}`,
        {
          streamEndTime: endTime,
          streamDuration: durationSeconds,
        }
      );

      console.log(
        `🛑 Stream ${activeStream.streamName} (ID: ${activeStream.streamId}) ended for player #${playerNumber}`,
        `Duration: ${durationSeconds}s`
      );
    } catch (err) {
      console.error(
        `❌ Error ending stream for player #${playerNumber}:`,
        err.response?.data || err.message
      );
    }
  }
}





function startCronJob() {
    console.log("Starting cron job to check machine status every 5 seconds...");
    currentCronJob = cron.schedule('*/5 * * * * *', executeJob);
    currentCronJob.start();
}

function stopCronJob() {
    if (currentCronJob) {
        currentCronJob.stop();
        console.log('Cron job stopped.');
        logToFile('Cron job stopped.');
        currentCronJob = null;
    } else {
        console.log('No cron job running.');
    }
}

function reStartCronJob() {
    stopCronJob();
    startCronJob();
    console.log('Cron job restarted.');
    logToFile('Cron job restarted.');
}

// Start automatically
startCronJob();

module.exports = {
    cron,
    stopCronJob,
    reStartCronJob,
};
