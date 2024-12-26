
const db = require('../db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
// Get all users





const getAllUsers = async (req, res) => {
  const query = `
    SELECT users.*, 
           roles.role_name AS role_name,
           createdRole.role_name AS created_by_role_name,
           updatedRole.role_name AS updated_by_role_name
    FROM users
    LEFT JOIN roles ON users.role = roles.role_id
    LEFT JOIN roles AS createdRole ON users.createdBy = createdRole.role_id
    LEFT JOIN roles AS updatedRole ON users.updatedBy = updatedRole.role_id
  `;

  db.query(query, (err, data) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }

    //console.log('getAllUsers: Query successful. Users:', data);
    res.send(data);
  });
};









const createUser = async (req, res) => {
  console.log('Incoming request body:', req.body); // Debug: Log the request body to verify data

  

  const { user_role_name, name, email, role, district, password, confirmPassword, createdBy } = req.body;

  // Validate if required fields are not empty
  // if (!name || !email || !password || !user_role_name || !role || !district) {
  //   return res.status(400).send({ error: 'All fields are required' });
  // }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).send({ error: 'Passwords do not match' });
  }

  // Check if the email is already registered
  const emailQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(emailQuery, [email], (err, result) => {
    if (err) {
      console.error('Database error on email check:', err); // Log error if occurs
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'Email already registered' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err); // Log error if occurs
        return res.status(500).send({ error: 'Error hashing password' });
      }

      // Save the user to the database
      const query = `
        INSERT INTO users (
          user_role_name, name, email, role, district, password, status, createdBy, updatedBy, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      db.query(query, [user_role_name, name, email, role, district, hashedPassword, '1', createdBy, createdBy], (err, result) => {
        if (err) {
          console.error('Database error on user insertion:', err); // Log error if occurs
          return res.status(500).send({ error: 'Database error' });
        }
        res.send({ message: 'User created successfully', id: result.insertId });
      });
    });
  });
};





  
  
  // Update a user
  const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { user_role_name, name, email, role, district, updatedBy } = req.body;
  
    // Update user details
    const query = `
      UPDATE users SET user_role_name = ?, name = ?, email = ?, role = ?, district = ?, updatedBy = ?, updated_at = NOW()
      WHERE id = ?
    `;
    db.query(query, [user_role_name, name, email, role, district, updatedBy, userId], (err, result) => {
      if (err) {
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'User updated successfully' });
    });
  };
  

// Delete a user
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  const query = `DELETE FROM users WHERE id = ?`;
  db.query(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send({ message: 'User deleted successfully' });
  });
};



// Toggle user status
const toggleUserStatus = async (req, res) => {
  const userId = req.params.id;
  const { status, updatedBy } = req.body;

  const query = `
    UPDATE users SET status = ?, updatedBy = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  db.query(query, [status, updatedBy, userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }

    res.send({ message: `User status changed to ${status === '1' ? 'Active' : 'Inactive'}` });
  });
};

module.exports = {
  // Other controller methods...
  toggleUserStatus,
};





  const getAllRoles = async (req, res) => {
    const query = 'SELECT * FROM roles'; // Assuming you have a roles table
    db.query(query, (err, data) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send(data);
    });
  };
  module.exports = {
    
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getAllRoles,
    toggleUserStatus,
}