const express = require("express");
const router = express.Router();
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const dboperation = require('../configurationDB/dboperation');



// Machine online status
router.route('/machine_online_status').post((request, response) => {
    const { date } = request.body;
    dboperation.getMachineOnlineStatus(date).then(result => { response.json(result) });
});



// Machine online status
router.route('/machine_online_status_slot').post((request, response) => {
    const { date } = request.body;
    dboperation.getSlotOnlineStatus(date).then(result => { response.json(result) });
});



module.exports = router;
