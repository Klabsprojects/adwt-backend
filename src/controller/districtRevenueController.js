// districtRevenueController.js

const db = require('../db');

// Get all revenue districts
const getAllRevenueDistricts = (req, res) => {
  const query = 'SELECT * FROM district_revenue';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

// Get all districts for dropdown selection
const getAllDistricts = (req, res) => {
  const query = 'SELECT id, district_name FROM district';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

// Add a new revenue district
const addRevenueDistrict = (req, res) => {
  const { revenue_district_name, status } = req.body;
  const checkQuery = `SELECT * FROM district_revenue WHERE revenue_district_name = ?`;
  db.query(checkQuery, [revenue_district_name], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This revenue district already exists.' });
    }

    const insertQuery = `INSERT INTO district_revenue (revenue_district_name, status) VALUES (?, ?)`;
    db.query(insertQuery, [revenue_district_name, status || 1], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Revenue district added successfully.' });
    });
  });
};

// Update a revenue district
const updateRevenueDistrict = (req, res) => {
  const id = req.params.id;
  const { revenue_district_name, status } = req.body;
  const checkQuery = `SELECT * FROM district_revenue WHERE revenue_district_name = ? AND id != ?`;
  db.query(checkQuery, [revenue_district_name, id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This revenue district already exists.' });
    }

    const updateQuery = `UPDATE district_revenue SET revenue_district_name = ?, status = ? WHERE id = ?`;
    db.query(updateQuery, [revenue_district_name, status, id], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Revenue district updated successfully.' });
    });
  });
};

// Delete a revenue district
const deleteRevenueDistrict = (req, res) => {
  const id = req.params.id;
  const deleteQuery = 'DELETE FROM district_revenue WHERE id = ?';
  db.query(deleteQuery, [id], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send({ message: 'Revenue district deleted successfully.' });
  });
};

module.exports = {
  getAllRevenueDistricts,
  addRevenueDistrict,
  updateRevenueDistrict,
  deleteRevenueDistrict,
  getAllDistricts,
};
