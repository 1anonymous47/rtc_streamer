const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs");
require("dotenv").config();
const PORT = process.env.PORT

const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());


const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const { initializeSocket } = require("./packages/socketpackage");
initializeSocket(server);
require("./routes/socketroutes")


const apiroutes = require("./routes/apiendpoints")
const pageroutes = require("./routes/pageendpoints")


app.use("/api",apiroutes);
app.use("/",pageroutes);


app.use(express.static(path.join(__dirname, "public/static")));

app.get("/test", (req, res) => {
    res.send("Service is running......");
});

server.listen(PORT,"0.0.0.0", () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});