const db = require('../db');

// Get all offences
const getAllOffenceReliefDetails = (req, res) => {
  const query = 'SELECT * FROM offence_relief_details';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

module.exports = {
  getAllOffenceReliefDetails,
};





