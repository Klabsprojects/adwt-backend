
const db = require('../db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');



// Get all roles (within permissions controller)
const getAllRoles = (req, res) => {
  const query = `SELECT * FROM roles;`;
  db.query(query, (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ error: 'Database error' });
      }
      res.send(result);
  });
};

// Get all permissions
const getAllPermissions = (req, res) => {
  const query = `SELECT * FROM permissions;`;
  db.query(query, (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ error: 'Database error' });
      }
      res.send(result);
  });
};

// Add a new permission
const addPermission = (req, res) => {
  const { name, description } = req.body;
  const query = `INSERT INTO permissions (name, description) VALUES (?, ?);`;
  db.query(query, [name, description], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Permission added successfully', id: result.insertId });
  });
};

// Update a permission
const updatePermission = (req, res) => {
  const permissionId = req.params.id;
  const { name, description } = req.body;
  const query = `UPDATE permissions SET name = ?, description = ? WHERE id = ?;`;
  db.query(query, [name, description, permissionId], (err) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Permission updated successfully' });
  });
};

// Delete a permission
const deletePermission = (req, res) => {
  const permissionId = req.params.id;
  const query = `DELETE FROM permissions WHERE id = ?;`;
  db.query(query, [permissionId], (err) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Permission deleted successfully' });
  });
};

const getPermissionsByRoleId = (req, res) => {
  const roleId = req.params.roleId;

  // Update the query to use the correct column names
  const query = `
      SELECT p.permission_id, p.permission_name, 
             CASE WHEN rp.has_permission IS NULL THEN 0 ELSE rp.has_permission END AS has_permission
      FROM permissions p
      LEFT JOIN rolepermissions rp ON p.permission_id = rp.permission_id AND rp.role_id = ?;
  `;

  db.query(query, [roleId], (err, result) => {
      if (err) {
          console.error('Database error:', err); // Log any database error
          return res.status(500).send({ error: 'Database error' });
      }
      res.send(result);
  });
};




// Update permission for a specific role
const updateRolePermission = (req, res) => {
  const { roleId, permissionId } = req.params;
  const { has_permission } = req.body;

  const query = `
      INSERT INTO rolepermissions (role_id, permission_id, has_permission) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE has_permission = ?;
  `;

  db.query(query, [roleId, permissionId, has_permission, has_permission], (err) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Permission updated successfully' });
  });
};





module.exports = {
  getAllRoles,
  getAllPermissions,
  addPermission,
  updatePermission,
  deletePermission,
  getPermissionsByRoleId,
  updateRolePermission, // Added updateRolePermission for rolepermissions table
};
