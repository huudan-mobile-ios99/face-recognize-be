const express = require("express");
const router = express.Router();
const Customer = require("../model/customer");

const { randomLetters, randomNumbers } = require("../utils/randomUtil");


//
// 🧩 CUSTOMER CRUD
//

// ➕ Create customer
router.post("/", async (req, res) => {
  try {
    const { customerNumber, customerName } = req.body;

    // Validate input
    if (!customerNumber || !customerName) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields: customerNumber and customerName",
        data: null,
      });
    }

    // Create new customer
    const newCustomer = new Customer({ customerNumber, customerName });
    await newCustomer.save();

    // Success response
    res.status(201).json({
      status: true,
      message: "Customer created successfully",
      data: newCustomer,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to create customer",
      data: null,
    });
  }
});


// 🔍 Get latest customers with pagination
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // default to 10 items
    const page = parseInt(req.query.page) || 1;    // default to page 1
    const skip = (page - 1) * limit;

    // Find customers
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      status: true,
      message: `Get list customers successfully`,
      total,
      page,
      limit,
      totalPages,
      data: customers,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `Error fetching customer list: ${err.message}`,
      total: 0,
      page: 0,
      limit: 0,
      totalPages: 0,
      data: [],
    });
  }
});

// 🔍 Get one customer by number
router.get("/:customerNumber", async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerNumber: req.params.customerNumber });

    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found",
        data: null,
      });
    }
    res.json({
      status: true,
      message: `Get customer data successfully `,
      data: customer,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Error fetching customer data",
      error: err.message,
      data: null,
    });
  }
});


// ✏️ Update customer info
router.put("/:customerNumber", async (req, res) => {
  try {
    const { customerNumber } = req.params;

    // Validate if body has any fields to update
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        status: false,
        message: "No update fields provided",
        data: null,
      });
    }

    // Find and update customer
    const updatedCustomer = await Customer.findOneAndUpdate(
      { customerNumber },
      req.body,
      { new: true }
    );

    // If not found
    if (!updatedCustomer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found",
        data: null,
      });
    }

    // Success
    res.status(200).json({
      status: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to update customer",
      data: null,
    });
  }
});



// ❌ Delete customer
router.delete("/:customerNumber", async (req, res) => {
  try {
    const { customerNumber } = req.params;

    // Try to find and delete the customer
    const deletedCustomer = await Customer.findOneAndDelete({ customerNumber });

    if (!deletedCustomer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found",
        data: null,
      });
    }

    // Success
    res.status(200).json({
      status: true,
      message: `Customer ${customerNumber} deleted successfully`,
      data: deletedCustomer,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to delete customer",
      data: { error: err.message },
    });
  }
});
//
// 🧩 STREAM CRUD (inside customer)
//























// ➕ Add a stream to a customer
router.post("/:customerNumber/streams", async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerNumber: req.params.customerNumber });

    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found.",
        data: null,
      });
    }

    const newStream = {
      streamName: randomLetters(),
      streamId: randomNumbers(),
      streamMachine: req.body.streamMachine || "Unknown",
      streamUrl: req.body.streamUrl || "",
      status: true,
    };

    customer.streams.push(newStream);
    await customer.save();

    res.status(201).json({
      status: true,
      message: "Stream added successfully.",
      data: customer,
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: "Failed to add stream.",
      data: null,
    });
  }
});




// 📜 Get all streams of a customer
router.get("/:customerNumber/streams", async (req, res) => {
  try {
    const customer = await Customer.findOne({
      customerNumber: req.params.customerNumber,
    });

    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found.",
        data: [],
      });
    }

    res.status(200).json({
      status: true,
      message: "Stream list retrieved successfully.",
      data: customer.streams,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: err.message,
    });
  }
});


// 📄 GET /api/v1/customers/:customerNumber/streams/active
router.get("/:customerNumber/streams/active", async (req, res) => {
  try {
    const { customerNumber } = req.params;

    // Find customer
    const customer = await Customer.findOne({ customerNumber });
    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found",
        data: [],
      });
    }

    // Filter only active streams
    const activeStreams = customer.streams.filter(s => s.status === true);

    if (activeStreams.length === 0) {
      return res.json({
        status: true,
        message: "No active streams found for this customer",
        data: [],
      });
    }

    return res.json({
      status: true,
      message: `Active streams retrieved successfully for customer ${customerNumber}`,
      data: activeStreams,
    });
  } catch (err) {
    console.error("Error fetching active streams:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch active streams",
      data: err.message,
    });
  }
});



// ✏️ Update a specific stream
router.put("/:customerNumber/streams/:streamId", async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerNumber: req.params.customerNumber });
    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found",
        data: null,
      });
    }

    const stream = customer.streams.find(s => s.streamId === req.params.streamId);
    if (!stream) {
      return res.status(404).json({
        status: false,
        message: "Stream not found",
        data: null,
      });
    }

    // 🧩 Check if the request body is empty (no fields provided for update)
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        status: false,
        message: "No update fields provided",
        data: null,
      });
    }

    // 🛠️ Update stream with provided fields
    Object.assign(stream, req.body);
    customer.markModified("streams");
    await customer.save();

    return res.json({
      status: true,
      message: "Stream updated successfully",
      data: stream,
    });
  } catch (err) {
    return res.status(400).json({
      status: false,
      message: "Failed to update stream",
      data: err.message,
    });
  }
});


// ✏️ Update stream status (true or false)
router.put("/:customerNumber/streams/:streamId/status", async (req, res) => {
  try {
    const { customerNumber, streamId } = req.params;
    const { status } = req.body;

    // Validate 'status' field type
    if (typeof status !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "Status must be true or false",
        data: null,
      });
    }

    const customer = await Customer.findOne({ customerNumber });
    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found",
        data: null,
      });
    }

    const stream = customer.streams.find(s => s.streamId === streamId);
    if (!stream) {
      return res.status(404).json({
        status: false,
        message: "Stream not found",
        data: null,
      });
    }

    // Update status only
    stream.status = status;
    customer.markModified("streams");
    await customer.save();

    return res.json({
      status: true,
      message: "Stream status updated successfully",
      data: {
        streamName: stream.streamName,
        streamId: stream.streamId,
        status: stream.status,
        streamStartTime: stream.streamStartTime,
        streamEndTime: stream.streamEndTime,
        streamDuration: stream.streamDuration,
        streamMachine: stream.streamMachine,
        streamUrl: stream.streamUrl,
        _id: stream._id,
      },
    });
  } catch (err) {
    console.error("Error updating stream status:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to update stream status",
      data: null,
    });
  }
});



// ❌ Delete a specific stream
router.delete("/:customerNumber/streams/:streamId", async (req, res) => {
  try {
    const { customerNumber, streamId } = req.params;

    // Find customer
    const customer = await Customer.findOne({ customerNumber });
    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found",
        data: null,
      });
    }

    // Find the stream
    const streamIndex = customer.streams.findIndex(s => s.streamId === streamId);
    if (streamIndex === -1) {
      return res.status(404).json({
        status: false,
        message: "Stream not found",
        data: null,
      });
    }

    // Get the stream being deleted for response
    const deletedStream = customer.streams[streamIndex];

    // Remove the stream from array
    customer.streams.splice(streamIndex, 1);
    await customer.save();

    return res.json({
      status: true,
      message: "Stream deleted successfully",
      data: deletedStream,
    });
  } catch (err) {
    console.error("Error deleting stream:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to delete stream",
      data: err.message,
    });
  }
});






module.exports = router;
