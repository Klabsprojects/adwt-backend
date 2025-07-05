const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const routes = require("./src/routes");
const jwt = require('jsonwebtoken');
const authController = require("./src/controller/authController");
const helmet = require("helmet");
var morgan = require('morgan');
const db = require('./src/db');
const session = require('express-session');
const app = express();
const JWT_SECRET='0c60f8a33b9ccb3b8a0a8a5f9b4e34c1e2dd536f2174c9a9d12e34529c313e82053b1fe7'
// Middleware
app.use(express.json());
app.use(bodyParser.json());


// Enhanced HTTP Method Security Middleware
const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'];

app.use((req, res, next) => {
  // Check if the method is allowed
  if (!allowedMethods.includes(req.method)) {
    res.set('Allow', allowedMethods.join(', '));
    return res.status(405).json({ 
      message: `Method ${req.method} not allowed`,
      allowedMethods: allowedMethods 
    });
  }
  next();
});

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Only allow OPTIONS for CORS preflight requests
    const origin = req.headers.origin;
    const accessControlRequestMethod = req.headers['access-control-request-method'];
    
    // If it's not a proper CORS preflight request, block it
    if (!origin || !accessControlRequestMethod) {
      return res.status(405).json({ message: 'OPTIONS method not allowed for non-CORS requests' });
    }
  }
  next();
});

app.use((req, res, next) => {
  // Set X-Frame-Options to prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), usb=(), fullscreen=(self)");
  next();
});

app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));

// app.use(morgan('combined'));

app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: true,         // Make sure app is served over HTTPS
    sameSite: 'Strict',   // Use 'Lax' if needed, avoid 'None'
    maxAge: 8 * 60 * 60 * 1000 // Optional: 8h session
  }
}));

const disallowedMethods = ['TRACE', 'TRACK', 'CONNECT', 'HEAD'];

app.use((req, res, next) => {
  if (disallowedMethods.includes(req.method)) {
    return res.status(405).json({ message: `${req.method} not allowed` });
  }
  next();
});

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
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      const corsError = new Error("CORS_ORIGIN_NOT_ALLOWED");
      corsError.statusCode = 403;  // Attach status code for later handling
      callback(corsError);
    }
  },
  methods: allowedMethods,
  maxAge: 600
  
};
app.use(cors(corsOptions));

app.options('*', cors(corsOptions), (req, res) => {
  res.sendStatus(204);
});

// Serve static files
app.use("/uploads", express.static("/var/www/backend/uploads"));
app.use("/uploadedfile/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/CommonFileUpload/uploads", express.static(path.join(__dirname, "src/uploads")));

function JWTauthorization(req, res, next) {
  let token = req.headers['authorization'];
  if (token && token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  if (!token) {
    return res.status(403).json({ success: false, message: 'No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    // Check token against DB
    const checkQuery = `SELECT token FROM user_sessions WHERE user_id = ? LIMIT 1`;
    db.query(checkQuery, [decoded.user_id], (err, results) => {
      if (err || results.length === 0 || results[0].token !== token) {
        return res.status(401).json({ message: 'Session expired or logged in elsewhere' });
      }

      req.user = decoded;
      next();
    });
  });
}

app.use("/auth/login",authController.login);
app.post('/auth/send-otp', authController.sendOtp);
app.post('/auth/verify-otp', authController.verifyOtp);
app.post('/auth/reset-password', authController.resetPassword);
// Use routes
app.use("/",JWTauthorization, routes);



app.get("/", (req, res) => {
  res.send("<h1>Welcome to the server</h1>");
});

// Centralized error handler - must be last
app.use((err, req, res, next) => {
  console.error("Caught error:", err.stack || err.message);

  // CORS error
  if (err.message === 'CORS_ORIGIN_NOT_ALLOWED') {
    return res.status(err.statusCode || 403).json({
      message: "CORS policy does not allow access from this origin."
    });
  }

  // Handle based on status code if present
  const statusCode = err.statusCode || 500;

  let message = "Internal Server Error. Please try again later or contact support.";

  if (statusCode === 404) {
    message = "Resource not found. The requested endpoint or data does not exist.";
  } else if (statusCode === 403) {
    message = "Access denied. You do not have permission to perform this action.";
  } else if (statusCode === 401) {
    message = "Unauthorized. Please log in or provide valid authentication credentials.";
  }

  res.status(statusCode).json({ message });
});

// Start server
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
