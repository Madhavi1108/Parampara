const express = require("express");

const router = express.Router();

const { createPath, getPaths } = require("../controllers/path.controller");

router.get("/", getPaths);

router.post("/", createPath);

module.exports = router;