const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const database = require("./config/connect-db");
const initRoutes = require("./routes");
const app = express();
const port = process.env.PORT || 5000;

app.use(cookieParser());
app.use(cors({ methods: ["GET", "POST", "PATCH", "DELETE"] }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "30mb" }));

app.get("/", (req, res) => {
  res.status(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

initRoutes(app);
database();
