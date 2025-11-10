"use strict";
const mongoose = require("mongoose");
const AutoIncrementFactory = require("mongoose-sequence");
const username = "LeHuuDan99";
const password = "3lyIxDXEzwCtzw2i";
const database = "L_VMS";
const URL = `mongodb+srv://${username}:${password}@clustervegas.ym3zd.mongodb.net/${database}?retryWrites=true&w=majority`;
let lastConnectionEvent = Date.now(); // ⏱️ Track last event time
const DB_OPTIONS = {
  serverSelectionTimeoutMS: 30000, // 30s
  socketTimeoutMS: 60000,          // 60s
};
let AutoIncrement;

async function connectDBLVMS() {
  try {
    // 👇 ACTUALLY CONNECT TO DATABASE
   const mongooseSub= await mongoose.connect(URL, DB_OPTIONS);
    // 👇 INIT AUTO INCREMENT PLUGIN (after connect)
    console.log("✅ Connected DB L-VMS");

    // Optional: Start a heartbeat ping
    setInterval(async () => {
      try {
          await mongooseSub.connection.db.admin().ping();
          console.log("MongoDB DB L-VMS ping successful");
        } catch (err) {
          console.log("MongoDB DB L-VMS ping failed:", err.message);
        }
    }, 25 * 60 * 1000);

    // Connection lifecycle logs
    mongooseSub.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB DB L-VMS disconnected. Retrying...");
    });

    mongooseSub.connection.on("reconnected", () => {
      console.log("✅ MongoDB DB L-VMS reconnected");
    });

    mongooseSub.connection.on("error", (err) => {
      console.log("❌ MongoDB DB L-VMS connection error:", err.message);
    });
  } catch (err) {
    console.log("❌ MongoDB DB L-VMS connection failed:", err.message);
    setTimeout(connectDBLVMS, 25000); // Retry after 25 seconds
  }
}

function getAutoIncrement() {
  return AutoIncrement;
}

module.exports = {
  connectDBLVMS,
  getAutoIncrement,
};

