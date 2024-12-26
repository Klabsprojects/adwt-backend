const db = require('../db');

// Get all police divisions
const getAllPoliceDivisions = (req, res) => {
  const query = 'SELECT * FROM police_division';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

// Add a new police division
const addPoliceDivision = (req, res) => {
  const { district_division_name, police_range_name, police_zone_name, status } = req.body;
  const checkQuery = `
    SELECT * FROM police_division 
    WHERE district_division_name = ? 
    AND police_range_name = ? 
    AND police_zone_name = ?
  `;
  db.query(checkQuery, [district_division_name, police_range_name, police_zone_name], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This district division already exists with the same range and zone.' });
    }

    const insertQuery = `
      INSERT INTO police_division (district_division_name, police_range_name, police_zone_name, status)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertQuery, [district_division_name, police_range_name, police_zone_name, status], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Police division added successfully.' });
    });
  });
};

// Update a specific police division
const updatePoliceDivision = (req, res) => {
  const id = req.params.id;
  const { district_division_name, police_range_name, police_zone_name, status } = req.body;
  const checkQuery = `
    SELECT * FROM police_division 
    WHERE district_division_name = ? 
    AND police_range_name = ? 
    AND police_zone_name = ? 
    AND id != ?
  `;
  db.query(checkQuery, [district_division_name, police_range_name, police_zone_name, id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This district division already exists with the same range and zone.' });
    }

    const updateQuery = `
      UPDATE police_division 
      SET district_division_name = ?, police_range_name = ?, police_zone_name = ?, status = ? 
      WHERE id = ?
    `;
    db.query(updateQuery, [district_division_name, police_range_name, police_zone_name, status, id], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Police division updated successfully.' });
    });
  });
};

// Delete a specific police division
const deletePoliceDivision = (req, res) => {
  const id = req.params.id;
  const deleteQuery = 'DELETE FROM police_division WHERE id = ?';
  db.query(deleteQuery, [id], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send({ message: 'Police division deleted successfully.' });
  });
};

// Get all districts for dropdown selection
const getAllDistricts = (req, res) => {
  const query = 'SELECT district_name FROM district';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

module.exports = {
  getAllPoliceDivisions,
  addPoliceDivision,
  updatePoliceDivision,
  deletePoliceDivision,
  getAllDistricts,
};
