const db = require('../db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Get all districts
const getAllDistricts = (req, res) => {
    const query = `SELECT * FROM district ORDER BY id ASC`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        res.send(results);
    });
};

// Add a new district (with duplicate check)
const addDistrict = (req, res) => {
  const { district_name, status } = req.body;
  const checkQuery = `SELECT * FROM district WHERE district_name = ?`;
  db.query(checkQuery, [district_name], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ error: 'Database error' });
      }
      if (results.length > 0) {
          return res.status(400).send({ error: 'District already exists' });
      }

      const query = `INSERT INTO district (district_name, status) VALUES (?, ?)`;
      db.query(query, [district_name, status], (err, result) => {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).send({ error: 'Database error' });
          }
          res.send({ message: 'District added successfully', id: result.insertId });
      });
  });
};

// Update a district (with duplicate check)
const updateDistrict = (req, res) => {
  const { id } = req.params;
  const { district_name, status } = req.body;
  const checkQuery = `SELECT * FROM district WHERE district_name = ? AND id != ?`;
  db.query(checkQuery, [district_name, id], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ error: 'Database error' });
      }
      if (results.length > 0) {
          return res.status(400).send({ error: 'District already exists' });
      }

      const query = `UPDATE district SET district_name = ?, status = ? WHERE id = ?`;
      db.query(query, [district_name, status, id], (err) => {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).send({ error: 'Database error' });
          }
          res.send({ message: 'District updated successfully' });
      });
  });
};

// Delete a district
const deleteDistrict = (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM district WHERE id = ?`;
    db.query(query, [id], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        res.send({ message: 'District deleted successfully' });
    });
};

// Toggle district status
const toggleDistrictStatus = (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body;
    const query = `UPDATE district SET status = ? WHERE id = ?`;
    db.query(query, [newStatus, id], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        res.send({ message: 'District status updated successfully' });
    });
};

module.exports = {
    getAllDistricts,
    addDistrict,
    updateDistrict,
    deleteDistrict,
    toggleDistrictStatus
};
