

const express = require("express");
const { getProgress, updateProgress } = require("../controllers/progress.controller");

const router = express.Router();



router.get("/:userId", getProgress);

router.post("/:userId",updateProgress);

module.exports = router;