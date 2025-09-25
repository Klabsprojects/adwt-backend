const mysql = require('mysql2');

// const db = mysql.createConnection({
//   host: '104.254.244.178', // Server IP
//   user: 'app_user',        // Replace with your MySQL username
//   password: '#!_71V#i%&', // Replace with the password
//   database: 'adw_database', // Database name
// });


// const db = mysql.createConnection({
//   host: 'localhost', // Server IP
//   user: 'root',        // Replace with your MySQL username
//   password: 'Pass', // Replace with the password
//   database: 'adw', // Database name
// });


// const db = mysql.createConnection({
//   host: 'localhost', // Your server's IP
//   user: 'onlinetn_adw_usr',            // Your database username
//   password: 'KharW4UQuQhA',  // Your database password
//   database: 'onlinetn_adw_database',
// });

// const db = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'Pass',
//   database: 'adw',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'onlinetn_adw_database',
  waitForConnections: true,
  connectionLimit: 70,
  queueLimit: 0
});


// Connect to the database
// db.connect((err) => {
//   if (err) {
//     console.error('Error connecting to the database:', err.message);
//     return;
//   }
//   console.log('Connected to MySQL database');


// });

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
  } else {
    console.log('✅ Successfully connected to MySQL database');
    connection.release(); // Always release after use
  }
});

module.exports = db;
