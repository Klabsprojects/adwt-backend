
const db = require('../db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');


// Get all roles
const getAllRoles = (req, res) => {
    const query = `
      SELECT roles.*, COUNT(users.role) AS user_count
      FROM roles
      LEFT JOIN users ON roles.role_id = users.role
      GROUP BY roles.role_id;
    `;
    db.query(query, (err, roles) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        res.send(roles);
    });
};
  
  // Add a role
// Add a role with duplicate name check
const addRole = (req, res) => {
  const { name } = req.body;
  const checkQuery = `SELECT * FROM roles WHERE role_name = ?`;
  db.query(checkQuery, [name], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (results.length > 0) {
      return res.status(400).send({ error: 'Role name already exists' });
    }

    const insertQuery = `INSERT INTO roles (role_name) VALUES (?)`;
    db.query(insertQuery, [name], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Role added successfully', id: result.insertId });
    });
  });
};

// Update a role with duplicate name check
const updateRole = (req, res) => {
  const roleId = req.params.id;
  const { name } = req.body;
  const checkQuery = `SELECT * FROM roles WHERE role_name = ? AND role_id != ?`;
  db.query(checkQuery, [name, roleId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (results.length > 0) {
      return res.status(400).send({ error: 'Role name already exists' });
    }

    const updateQuery = `UPDATE roles SET role_name = ? WHERE role_id = ?`;
    db.query(updateQuery, [name, roleId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Role updated successfully' });
    });
  });
};

  
  // Delete a role
  const deleteRole = (req, res) => {
    const roleId = req.params.id;
    const query = `
      DELETE FROM roles WHERE role_id = ?;
    `;
    db.query(query, [roleId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Role deleted successfully' });
    });
  };
  
  const toggleRoleStatus = (req, res) => {
    const roleId = req.params.id;

    // Fetch the current status of the role
    const fetchQuery = `SELECT status FROM roles WHERE role_id = ?`;
    db.query(fetchQuery, [roleId], (fetchErr, result) => {
        if (fetchErr) {
            console.error('Database error while fetching status:', fetchErr);
            return res.status(500).send({ error: 'Database fetch error' });
        }

        if (result.length === 0) {
            return res.status(404).send({ error: 'Role not found' });
        }

        // Toggle the status (1 -> 0 or 0 -> 1)
        const currentStatus = result[0].status;
        const newStatus = currentStatus === 1 ? 0 : 1; // Corrected to toggle properly

        console.log(`Updating roleId: ${roleId}, currentStatus: ${currentStatus}, newStatus: ${newStatus}`); // Debug log

        const updateQuery = `
            UPDATE roles SET status = ? WHERE role_id = ?;
        `;
        db.query(updateQuery, [newStatus, roleId], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Database error while updating status:', updateErr);
                return res.status(500).send({ error: 'Database update error' });
            }

            if (updateResult.affectedRows > 0) {
                res.send({ message: `Role status updated successfully`, newStatus: newStatus });
            } else {
                res.status(400).send({ error: 'Failed to update role status' });
            }
        });
    });
};

module.exports = {
    getAllRoles,
    addRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
};
