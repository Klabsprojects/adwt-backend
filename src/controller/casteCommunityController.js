const db = require('../db');

// Get all caste and community entries
exports.getAllCastes = (req, res) => {
  db.query('SELECT * FROM caste_community', (err, results) => {
    if (err) {
      console.error('Error fetching castes:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
};

// Add a new caste and community
exports.addCaste = (req, res) => {
  const { caste_name, community_name } = req.body;
  const status = 1;

  if (!caste_name || !community_name) {
    return res.status(400).send('Caste name and community name are required');
  }

  db.query(
    'INSERT INTO caste_community (caste_name, community_name, status) VALUES (?, ?, ?)',
    [caste_name, community_name, status],
    (err, result) => {
      if (err) {
        console.error('Error adding caste:', err);
        return res.status(500).send('Server error');
      }
      res.status(201).json({ message: 'Caste added successfully', id: result.insertId });
    }
  );
};

// Update a caste and community by ID
exports.updateCaste = (req, res) => {
  const { id } = req.params;
  const { caste_name, community_name, status } = req.body;

  if (!caste_name || !community_name) {
    return res.status(400).send('Caste name and community name are required');
  }

  db.query(
    'UPDATE caste_community SET caste_name = ?, community_name = ?, status = ? WHERE id = ?',
    [caste_name, community_name, status, id],
    (err) => {
      if (err) {
        console.error('Error updating caste:', err);
        return res.status(500).send('Server error');
      }
      res.status(200).json({ message: 'Caste updated successfully' });
    }
  );
};

// Delete a caste and community by ID
exports.deleteCaste = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM caste_community WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting caste:', err);
      return res.status(500).send('Server error');
    }
    res.status(200).json({ message: 'Caste deleted successfully' });
  });
};

// Toggle the status of a caste and community by ID
exports.toggleCasteStatus = (req, res) => {
  const { id } = req.params;

  db.query(
    'UPDATE caste_community SET status = IF(status = 1, 0, 1) WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        console.error('Error toggling caste status:', err);
        return res.status(500).send('Server error');
      }
      res.status(200).json({ message: 'Caste status updated successfully' });
    }
  );
};
