const mysql = require('mysql2');

// const db = mysql.createConnection({
//   host: '104.254.244.178', // Your server's IP
//   user: 'root',            // Your database username
//   password: '#!_71V#i%&',  // Your database password
//   database: 'adw_database',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
  
// });

const db = mysql.createConnection({
  host: 'localhost', // Server IP
  user: 'root',        // Replace with your MySQL username
  password: 'Pass', // Replace with the password
  database: 'adw', // Database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  console.log('Connected to MySQL database');


});

module.exports = db;
