const db = require('../db');

// Get all police divisions
const getAllPoliceStations = (req, res) => {
  const query = 'SELECT * FROM police_stations';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

// Add a new police division
const addPoliceStation = (req, res) => {
  const { city_or_district, station_name, circle, status } = req.body;
  const checkQuery = `
    SELECT * FROM police_stations 
    WHERE city_or_district = ? 
    AND station_name = ? 
    AND circle = ?
  `;
  db.query(checkQuery, [city_or_district, station_name, circle], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This police station division already exists with the same range and zone.' });
    }

    const insertQuery = `
      INSERT INTO police_stations (city_or_district, station_name, circle, status)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertQuery, [city_or_district, station_name, circle, status], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Police Station added successfully.' });
    });
  });
};

// Update a specific police division
const updatePoliceStation = (req, res) => {
  const id = req.params.id;
  const { city_or_district, station_name, circle, status } = req.body;
  const checkQuery = `
    SELECT * FROM police_stations 
    WHERE city_or_district = ? 
    AND station_name = ? 
    AND circle = ? 
    AND id != ?
  `;
  db.query(checkQuery, [city_or_district, station_name, circle, id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    if (result.length > 0) {
      return res.status(400).send({ error: 'This Police stations already exists with the same range and zone.' });
    }

    const updateQuery = `
      UPDATE police_stations 
      SET city_or_district = ?, station_name = ?, circle = ?, status = ? 
      WHERE id = ?
    `;
    db.query(updateQuery, [city_or_district, station_name, circle, status, id], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Police station updated successfully.' });
    });
  });
};

// Delete a specific police division
const deletePoliceStation = (req, res) => {
  const id = req.params.id;
  console.log("iyuiyuiyuiyy"+id);
  const deleteQuery = 'DELETE FROM police_stations WHERE id = ?';
  db.query(deleteQuery, [id], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send({ message: 'Police station deleted successfully.' });
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
  getAllPoliceStations,
  addPoliceStation,
  updatePoliceStation,
  deletePoliceStation,
  getAllDistricts,
};
