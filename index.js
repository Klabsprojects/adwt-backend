const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const routes = require("./src/routes");
const jwt = require('jsonwebtoken');
const authController = require("./src/controller/authController");

const app = express();
const JWT_SECRET='0c60f8a33b9ccb3b8a0a8a5f9b4e34c1e2dd536f2174c9a9d12e34529c313e82053b1fe7'
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
  "https://adwatrocity.onlinetn.com"
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
app.use("/uploadedfile/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/CommonFileUpload/uploads", express.static(path.join(__dirname, "src/uploads")));


function JWTauthorization(req, res, next) { 
  // console.log('in check authentication function');

  var token = req.body.token || req.query.token || req.headers['authorization'];

  if (token && token.startsWith("Bearer ")) {
    token = token.slice(7, token.length); // Remove "Bearer " from token
  }
         
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
  
      req.user = user;
      next();
    });
  } else {
    return res.status(403).send({ 
      success: false, 
      message: 'No token provided.'
    });
  }
}

app.use("/auth/login",authController.login);
// Use routes
app.use("/",JWTauthorization, routes);

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the server</h1>");
});

// Start server
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
