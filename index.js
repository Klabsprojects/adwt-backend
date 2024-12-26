const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const routes = require("./src/routes");

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// CORS Configuration
const whitelist = [
  "http://localhost:4200",
  "http://localhost:3000",
  "http://a4f506a.online-server.cloud",
  "http://127.0.0.1:8000",
  "https://inspection1.proz.in",
  "https://shg.mathikalam.org",
  "https://mathikalam.org",
  "http://104.254.244.178",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || origin === undefined) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

// Serve static files
app.use("/uploads", express.static("/var/www/backend/uploads"));

// Use routes
app.use("/", routes);

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the server</h1>");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
