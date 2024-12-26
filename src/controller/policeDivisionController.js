const db = require('../db'); // Assuming the database instance is imported here

exports.getPoliceDivisions = (req, res) => {
  const userDistrict = req.query.district;

  db.query(
    'SELECT * FROM police_division WHERE district_division_name = ? AND status = 1',
    [userDistrict],
    (error, results) => {
      if (error) {
        res.status(500).send({ error: 'Database query error' });
      } else {
        res.status(200).json(results);
      }
    }
  );
};
