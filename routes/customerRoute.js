const express = require("express");
const router = express.Router();
const Customer = require("../model/customer");
const dboperation = require('../configurationDB/dboperation');
const { randomLetters, randomNumbers } = require("../utils/randomUtil");



//face_recognize_pagin new ver 2
router.route('/face_recognize').get((req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const number = req.query.number ? parseInt(req.query.number) : null;

  if (limit > 300) {
    return res.status(400).json({
      status: false,
      message: "Limit cannot exceed 300.",
    });
  }
  dboperation.getFaceRecognizeFull(page, limit, number).then(result => {
    res.json(result);
  });
});
//END FACE RECOGNITION


module.exports = router;
