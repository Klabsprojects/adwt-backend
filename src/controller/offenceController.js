const db = require('../db');

// Get all offences
const getAllOffences = (req, res) => {
  const query = 'SELECT * FROM offence';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

// Add a new offence
const addOffence = (req, res) => {
  const { offence_name, status } = req.body;
  const checkQuery = `SELECT * FROM offence WHERE offence_name = ?`;
  db.query(checkQuery, [offence_name], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This offence already exists.' });
    }

    const insertQuery = `INSERT INTO offence (offence_name, status) VALUES (?, ?)`;
    db.query(insertQuery, [offence_name, status || 1], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Offence added successfully.' });
    });
  });
};

// Update a specific offence
const updateOffence = (req, res) => {
  const id = req.params.id;
  const { offence_name, status } = req.body;
  const checkQuery = `SELECT * FROM offence WHERE offence_name = ? AND id != ?`;
  db.query(checkQuery, [offence_name, id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This offence already exists.' });
    }

    const updateQuery = `UPDATE offence SET offence_name = ?, status = ? WHERE id = ?`;
    db.query(updateQuery, [offence_name, status, id], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Offence updated successfully.' });
    });
  });
};

// Delete a specific offence
const deleteOffence = (req, res) => {
  const id = req.params.id;
  const deleteQuery = 'DELETE FROM offence WHERE id = ?';
  db.query(deleteQuery, [id], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send({ message: 'Offence deleted successfully.' });
  });
};



module.exports = {
  getAllOffences,
  addOffence,
  updateOffence,
  deleteOffence,

};





