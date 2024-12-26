const db = require('../db'); // Ensure correct path to your database connection file

const getUserById = (req, res) => {
  const userId = req.params.id; // Extract user ID from route parameters
  const query = `
    SELECT id, name, email, role, user_role_name
    FROM users
    WHERE id = ?;
  `;

  // Execute the query
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length === 0) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(result[0]); // Send the user data
  });
};


module.exports = {
  getUserById,
};
