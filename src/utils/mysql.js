const mysql = require('mysql2');
const dbConfig = require('../../config').dbConfig; // Assuming your config file has the MySQL configuration
// const connection = mysql.createPool({
//   host: dbConfig.host,
//   user: dbConfig.user,
//   password: dbConfig.password,
//   database: dbConfig.database,
//   namedPlaceholders: true, // Enable named placeholders,
//   waitForConnections: true,
//   connectionLimit: 10000,
//   queueLimit: 0
// });

// // Example of executing a query
// connection.query('SELECT 1 + 1 AS solution', (err, results) => {
// if (err) {
//     console.error('MySQL query error:', err);
//     return;
// }
// console.log('The solution is:', results[0].solution);
// });
const connection = mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: 3306
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('MySQL connected successfully');
});

// Handle connection errors
connection.on('error', (err) => {
  console.error('MySQL error:', err);
});

// Handle disconnection
connection.on('end', () => {
  console.log('MySQL disconnected');
});

module.exports = connection;
