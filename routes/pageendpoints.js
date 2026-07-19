const express = require('express');
const path = require("path");

const pagerouter = express.Router();

const verifyjwt = require("../middlewares/jwtverify")

pagerouter.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/templates/index.html"));
});

pagerouter.get("/dashboard", verifyjwt,(req, res) => {
    res.sendFile(path.join(__dirname, "../public/templates/dashboard.html"));
});

pagerouter.get("/call", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/templates/caller.html"));
});





module.exports = pagerouter;