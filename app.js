const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { connectDBLVMS } = require("./configurationDB/config_mongo");
const customerRoutes = require("./routes/customerRoutes");
const streamRoutes = require("./routes/streamRoutes");
const viewRoutes = require("./routes/viewRoutes");
const linkRoutes = require("./routes/linkRoutes");
const machineRoutes = require("./routes/machineRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
// Make io available to routes via middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/v1/view", viewRoutes);
app.use("/api/v1/customer", customerRoutes);       // ✅ User routes
app.use("/api/v1/link", linkRoutes);               // ✅ Link routes

//this is machine online status when inserted card
app.use("/api/machine", machineRoutes);         // ✅ machine routes
// Start server
const PORT = process.env.PORT || 8081;
server.listen(PORT, async () => {
  await connectDBLVMS();
  console.log(`🚀Face Recognize Server running on http://localhost:${PORT}`);
});


//run The CronJOB
// require('./configurationDB/cronjob');
