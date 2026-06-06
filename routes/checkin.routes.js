
const express = require("express");
const router = express.Router();

const { checkIn } = require("../controllers/checkin.controller");


router.post("/", checkIn);

module.exports = router ;