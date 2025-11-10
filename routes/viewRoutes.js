const express = require("express");
const router = express.Router();
const Customer = require("../model/customer"); // adjust path if different

// Serve static HTML (webview)
router.use(express.static("public"));


// GET /api/view/:customerNumber
router.get("/:customerNumber", async (req, res) => {
  try {
    const { customerNumber } = req.params;
    const customer = await Customer.findOne({ customerNumber });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (!customer.streams || customer.streams.length === 0) {
      return res.status(200).json({
        message: "No streams available for this customer",
        streams: [],
      });
    }

    // Filter only active streams
    const activeStreams = customer.streams.filter(s => s.status === true);
    const baseUrl = `${req.protocol}://${req.get("host")}`;


    const streams = activeStreams.map(stream => ({
      streamName: stream.streamName,
      streamId: stream.streamId,
      machine: stream.streamMachine,
      status:stream.status,
      streamStartTime: stream.streamStartTime,
      viewLink: `${baseUrl}/api/view/view_single.html?customerNumber=${customerNumber}&streamId=${stream.streamId}`,
    }));

    res.json({
      message: "List active streams view",
      totalActive: streams.length,
      streams,
    });
  } catch (err) {
    console.error("Error fetching view links:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET APIs view all customer

/**
 * ✅ GET all streams (active + inactive)
 * Example: GET /api/view/1/all
 */
router.get("/:customerNumber/all", async (req, res) => {
  try {
    const { customerNumber } = req.params;
    const customer = await Customer.findOne({ customerNumber });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (!customer.streams || customer.streams.length === 0) {
      return res.status(200).json({
        message: "No streams available for this customer",
        streams: [],
      });
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;


    // ✅ Include all streams regardless of status
    const streams = customer.streams.map(stream => ({
      streamName: stream.streamName,
      streamId: stream.streamId,
      machine: stream.streamMachine,
      status: stream.status,
      streamStartTime: stream.streamStartTime,
      streamEndTime: stream.streamEndTime,
      viewLink: `${baseUrl}/api/view/view_single.html?customerNumber=${customerNumber}&streamId=${stream.streamId}`,
    }));


    res.json({
      message: "List of all streams (active and inactive)",
      total: streams.length,
      streams,
    });
  } catch (err) {
    console.error("Error fetching all view links:", err);
    res.status(500).json({ message: "Server error" });
  }
});






//check total live stream
router.get("/check_live/:customerNumber", async (req, res) => {
  try {
    const { customerNumber } = req.params;
    const customer = await Customer.findOne({ customerNumber });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const totalStreams = customer.streams?.length || 0;
    const liveStreams = customer.streams?.filter(s => s.status === true) || [];
    const activeStreams = liveStreams.length;

    if (activeStreams > 0) {
      return res.json({
        message: "Live streams status",
        total: totalStreams,
        activeStreams,
        status: true,
        streams: liveStreams.map(s => ({
          streamName: s.streamName,
          streamId: s.streamId,
          machine: s.streamMachine,
          streamStartTime: s.streamStartTime,
        })),
      });
    } else {
      return res.json({
        message: "No live streams",
        total: totalStreams,
        activeStreams,
        status: false,
      });
    }
  } catch (err) {
    console.error("Error checking live stream:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
