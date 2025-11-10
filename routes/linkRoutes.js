const express = require("express");
const router = express.Router();
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const axios = require('axios');
// ✅ Check if WebSocket stream link is alive
router.get("/check_link", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: "Missing 'url' query parameter" });
  }

  if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
    return res.status(400).json({ success: false, message: "Invalid WebSocket URL" });
  }

  let responded = false;

  try {
    const ws = new WebSocket(url);
    ws.on("open", () => {
      if (!responded) {
        responded = true;
        res.json({
          status: true,
          message: "Stream link is alive",
          url,
        });
        ws.close();
      }
    });
    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
      if (!responded) {
        responded = true;
        res.json({
          status: false,
          message: "Failed to connect to stream",
          error: err.message,
          url,
        });
      }
      ws.terminate();
    });

    ws.on("close", () => {
      if (!responded) {
        responded = true;
        res.json({
          status: false,
          message: "Stream not reachable",
          url,
        });
      }
    });

    // Timeout protection
    setTimeout(() => {
      if (!responded) {
        responded = true;
        ws.terminate();
        res.json({
          status: false,
          message: "Stream connection timed out",
          url,
        });
      }
    }, 1500); //1.5second to check
  } catch (err) {
    console.error("Error checking stream link:", err);
    if (!responded) {
      responded = true;
      res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
  }
});











// Utility: check one WebSocket link
function checkWebSocketLink(url, timeout = 1750) {
  return new Promise((resolve) => {
    let responded = false;

    if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      return resolve({
        url,
        status: false,
        message: "Invalid WebSocket URL",
      });
    }

    try {
      const ws = new WebSocket(url);

      ws.on("open", () => {
        if (!responded) {
          responded = true;
          ws.close();
          resolve({
            url,
            status: true,
            message: "Stream alive",
          });
        }
      });

      ws.on("error", (err) => {
        if (!responded) {
          responded = true;
          ws.terminate();
          resolve({
            url,
            status: false,
            message: "Failed to connect to stream",
            error: err.message,
          });
        }
      });

      ws.on("close", () => {
        if (!responded) {
          responded = true;
          resolve({
            url,
            status: false,
            message: "Stream not reachable",
          });
        }
      });

      // Timeout
      setTimeout(() => {
        if (!responded) {
          responded = true;
          ws.terminate();
          resolve({
            url,
            status: false,
            message: "Stream connection timed out",
          });
        }
      }, timeout);
    } catch (err) {
      resolve({
        url,
        status: false,
        message: "Error creating WebSocket",
        error: err.message,
      });
    }
  });
}
router.get("/check_links", async (req, res) => {
  try {
    // Read config.json
    const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

    // Collect all ws links
    const urls = Object.values(config);

    const checkStream = (url) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(url, { handshakeTimeout: 3000 });
        let isAlive = false;

        ws.on("open", () => {
          isAlive = true;
          ws.close();
        });

        ws.on("close", () => {
          resolve({
            url,
            status: isAlive,
            name: `Stream${url.match(/:(\d+)\//)[1]}`, // <-- extract port number
            message: isAlive ? "Stream alive" : "Stream not responding",
          });
        });

        ws.on("error", () => {
          resolve({
            url,
            status: false,
            name: `Stream${url.match(/:(\d+)\//)[1]}`,
            message: "Stream connection timed out",
          });
        });

        setTimeout(() => {
          if (!isAlive) {
            ws.terminate();
            resolve({
              url,
              status: false,
              name: `Stream${url.match(/:(\d+)\//)[1]}`,
              message: "Stream connection timed out",
            });
          }
        }, 3000);
      });
    };

    const results = await Promise.all(urls.map((u) => checkStream(u)));

    const aliveCount = results.filter((r) => r.status).length;

    res.json({
      total: results.length,
      alive: aliveCount,
      results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking links" });
  }
});









// // ✅ GET /api/link/check_stream?customerNumber=1&streamId=575121

router.get("/check_stream", async (req, res) => {
  const { customerNumber, streamId } = req.query;

  if (!customerNumber || !streamId) {
    return res.status(400).json({
      message: "Missing parameters: customerNumber and streamId are required.",
      totalActive: 0,
      streams: [],
    });
  }

  try {
    const customerResponse = await axios.get(`http://localhost:8081/api/v1/customer/${customerNumber}`);
    const customer = customerResponse.data?.data || customerResponse.data; // ✅ handle wrapped data

    if (!customer.streams || !Array.isArray(customer.streams)) {
      return res.status(404).json({
        message: `No streams found for customer ${customerNumber}`,
        totalActive: 0,
        streams: [],
      });
    }

    const stream = customer.streams.find((s) => s.streamId === streamId);

    if (!stream) {
      return res.status(404).json({
        message: `Stream ID ${streamId} not found for customer ${customerNumber}`,
        totalActive: 0,
        streams: [],
      });
    }

    if (!stream.status) {
      return res.json({
        message: "Stream disabled",
        totalActive: 0,
        streams: [],
      });
    }

    const checkStream = (url) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(url, { handshakeTimeout: 2000 });
        let isAlive = false;

        ws.on("open", () => {
          isAlive = true;
          ws.close();
        });

        ws.on("close", () => {
          resolve({
            message: isAlive ? "Stream alive" : "Stream not reachable",
            status: isAlive,
          });
        });

        ws.on("error", () => {
          resolve({
            message: "Stream connection failed",
            status: false,
          });
        });

        setTimeout(() => {
          if (!isAlive) {
            ws.terminate();
            resolve({
              message: "Stream connection timed out",
              status: false,
            });
          }
        }, 3000);
      });
    };

    const result = await checkStream(stream.streamUrl);

    if (!result.status) {
      return res.json({
        message: result.message,
        totalActive: 0,
        streams: [],
      });
    }

    return res.json({
      message: "List active streams view",
      totalActive: 1,
      streams: [
        {
          streamName: stream.streamName,
          streamId: stream.streamId,
          machine: stream.streamMachine,
          status: stream.status,
          streamStartTime: stream.streamStartTime,
          viewLink: `http://localhost:8081/api/view/view_single.html?customerNumber=${customerNumber}&streamId=${streamId}`,
        },
      ],
    });
  } catch (error) {
    console.error("Error checking stream link:", error.message);
    res.status(500).json({
      message: "Error checking stream link",
      totalActive: 0,
      streams: [],
    });
  }
});


module.exports = router;
