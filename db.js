const mysql = require('mysql2');

const db = mysql.createConnection({
  host: '104.254.244.178', // Server IP
  user: 'app_user',        // Replace with your MySQL username
  password: '#!_71V#i%&', // Replace with the password
  database: 'adw_database', // Database name
});


// const db = mysql.createConnection({
//   host: 'localhost', // Server IP
//   user: 'root',        // Replace with your MySQL username
//   password: 'Pass', // Replace with the password
//   database: 'adw', // Database name
// });

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

module.exports = db;
