const express = require("express");
const router = express.Router();

const {chatResponse }= require("../controllers/chat.controller");


router.post("/", chatResponse);

module.exports = router ;