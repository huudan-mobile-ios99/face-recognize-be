const express = require("express");
const router = express.Router();
const User = require("../model/customer");
const fs = require("fs");
const WebSocket = require("ws");


// Load config.json
function loadConfig() {
  return JSON.parse(fs.readFileSync("config.json", "utf-8"));
}

// ✅ API: Get current config.json
router.get("/config", (req, res) => {
  res.json(loadConfig());
});

// ✅ API: Validate code + return init player settings
router.get("/init", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }

    // Find user by code
    const user = await User.findOne({ code });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid code" });
    }

    if (!user.canview) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // If valid + canview=true
    res.json({
      success: true,
      streamUrl: "ws://192.168.101.169:3334/app/stream",
      player: "ovenplayer",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ API: Update visibility
router.post("/visibility", (req, res) => {
  const config = loadConfig();
  config.visible = req.body.visible;

  fs.writeFileSync("config.json", JSON.stringify(config, null, 2));

  // Notify clients via Socket.IO (attached in server.js)
  req.io.emit("visibilityUpdate", config.visible);

  res.json({ success: true, config });
});

// ✅ API: Force refresh clients
router.post("/refresh", (req, res) => {
  req.io.emit("refreshPage");
  res.json({ success: true, message: "Refresh signal sent to all clients" });
});

// ✅ API: Update WebRTC URL
router.post("/url", (req, res) => {
  const config = loadConfig();
  config.webrtcUrl = req.body.webrtcUrl;

  fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
  res.json({ success: true, config });
});





module.exports = router;
