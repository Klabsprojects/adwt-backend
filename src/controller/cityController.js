const db = require('../db');

// Get all cities, including district information
const getAllCities = (req, res) => {
    const query = `
        SELECT c.id, c.city_name, c.status, d.district_name
        FROM city c
        JOIN district d ON c.district_name = d.district_name
        ORDER BY c.id ASC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        res.send(results);
    });
};

// Add a new city (with duplicate check)
const addCity = (req, res) => {
    const { district_name, city_name, status } = req.body;
    const checkQuery = `SELECT * FROM city WHERE city_name = ? AND district_name = ?`;
    db.query(checkQuery, [city_name, district_name], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        if (results.length > 0) {
            return res.status(400).send({ error: 'City already exists in this district' });
        }

        const query = `INSERT INTO city (district_name, city_name, status) VALUES (?, ?, ?)`;
        db.query(query, [district_name, city_name, status], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send({ error: 'Database error' });
            }
            res.send({ message: 'City added successfully', id: result.insertId });
        });
    });
};

// Update a city (with duplicate check)
const updateCity = (req, res) => {
    const { id } = req.params;
    const { district_name, city_name, status } = req.body;
    const checkQuery = `SELECT * FROM city WHERE city_name = ? AND district_name = ? AND id != ?`;
    db.query(checkQuery, [city_name, district_name, id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        if (results.length > 0) {
            return res.status(400).send({ error: 'City already exists in this district' });
        }

        const query = `UPDATE city SET district_name = ?, city_name = ?, status = ? WHERE id = ?`;
        db.query(query, [district_name, city_name, status, id], (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send({ error: 'Database error' });
            }
            res.send({ message: 'City updated successfully' });
        });
    });
};

// Delete a city
const deleteCity = (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM city WHERE id = ?`;
    db.query(query, [id], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        res.send({ message: 'City deleted successfully' });
    });
};

// Toggle city status
const toggleCityStatus = (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body;
    const query = `UPDATE city SET status = ? WHERE id = ?`;
    db.query(query, [newStatus, id], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error' });
        }
        res.send({ message: 'City status updated successfully' });
    });
};

module.exports = {
    getAllCities,
    addCity,
    updateCity,
    deleteCity,
    toggleCityStatus
};
