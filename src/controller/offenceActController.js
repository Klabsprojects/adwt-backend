const db = require('../db');

// Get all offence acts
exports.getAllOffenceActs = (req, res) => {
  db.query('SELECT * FROM offence_acts', (err, results) => {
    if (err) {
      console.error('Error fetching offence acts:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
};



// Add a new offence act
exports.addOffenceAct = (req, res) => {
  const { offence_act_name } = req.body;
  const status = 1;

  if (!offence_act_name) {
    return res.status(400).send('Offence act name is required');
  }

  db.query(
    'INSERT INTO offence_acts (offence_act_name, status) VALUES (?, ?)',
    [offence_act_name, status],
    (err, result) => {
      if (err) {
        console.error('Error adding offence act:', err);
        return res.status(500).send('Server error');
      }
      res.status(201).json({ message: 'Offence act added successfully', id: result.insertId });
    }
  );
};

// Update an offence act by ID
exports.updateOffenceAct = (req, res) => {
  const { id } = req.params;
  const { offence_act_name, status } = req.body;

  if (!offence_act_name) {
    return res.status(400).send('Offence act name is required');
  }

  db.query(
    'UPDATE offence_acts SET offence_act_name = ?, status = ? WHERE id = ?',
    [offence_act_name, status, id],
    (err) => {
      if (err) {
        console.error('Error updating offence act:', err);
        return res.status(500).send('Server error');
      }
      res.status(200).json({ message: 'Offence act updated successfully' });
    }
  );
};

// Delete an offence act by ID
exports.deleteOffenceAct = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM offence_acts WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting offence act:', err);
      return res.status(500).send('Server error');
    }
    res.status(200).json({ message: 'Offence act deleted successfully' });
  });
};

// Toggle the status of an offence act by ID
exports.toggleOffenceActStatus = (req, res) => {
  const { id } = req.params;

  db.query(
    'UPDATE offence_acts SET status = IF(status = 1, 0, 1) WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        console.error('Error toggling offence act status:', err);
        return res.status(500).send('Server error');
      }
      res.status(200).json({ message: 'Offence act status updated successfully' });
    }
  );
};

// Get specific fields for relief values from the offence_acts table
exports.getOffenceActsForRelief = (req, res) => {
  db.query(
    'SELECT id, offence_act_name, fir_stage_as_per_act, chargesheet_stage_as_per_act, final_stage_as_per_act FROM offence_acts WHERE status = 1',
    (err, results) => {
      if (err) {
        console.error('Error fetching offence acts:', err);
        return res.status(500).send('Server error');
      }
      res.json(results);
    }
  );
};
