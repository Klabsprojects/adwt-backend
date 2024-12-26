const db = require('../db');

// Get all police divisions
const getAllcourt = (req, res) => {
  const query = 'SELECT * FROM court';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

// Add a new police division
const addCourt = (req, res) => {
  const { court_division_name, court_range_name, status } = req.body;
  const checkQuery = `
    SELECT * FROM court 
    WHERE court_division_name = ? 
    AND court_range_name = ?
  `;
  db.query(checkQuery, [court_division_name, court_range_name], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This Court already exists with the same range and zone.' });
    }

    const insertQuery = `
      INSERT INTO court (court_division_name, court_range_name, status)
      VALUES (?, ?, ?)
    `;
    db.query(insertQuery, [court_division_name, court_range_name, status], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Court added successfully.' });
    });
  });
};

// Update a specific police division
const updateCourt = (req, res) => {
  const id = req.params.id;
  const { court_division_name, court_range_name, status } = req.body;
  const checkQuery = `
    SELECT * FROM court 
    WHERE court_division_name = ? 
    AND court_range_name = ?
    AND id != ?
  `;
  db.query(checkQuery, [court_division_name, court_range_name, id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This Court already exists with the same range and zone.' });
    }

    const updateQuery = `
      UPDATE court 
      SET court_division_name = ?, court_range_name = ?, status = ? 
      WHERE id = ?
    `;
    db.query(updateQuery, [court_division_name, court_range_name, status, id], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Court updated successfully.' });
    });
  });
};

// Delete a specific police division
const deleteCourt = (req, res) => {
  const id = req.params.id;
  const deleteQuery = 'DELETE FROM court WHERE id = ?';
  db.query(deleteQuery, [id], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send({ message: 'Court deleted successfully.' });
  });
};

// Get all districts for dropdown selection
// const getAllDistricts = (req, res) => {
//   const query = 'SELECT district_name FROM district';
//   db.query(query, (err, result) => {
//     if (err) {
//       console.error('Database error:', err);
//       return res.status(500).send({ error: 'Database error' });
//     }
//     res.send(result);
//   });
// };

module.exports = {
  getAllcourt,
  addCourt,
  updateCourt,
  deleteCourt,
  // getAllDistricts,
};
