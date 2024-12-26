const db = require('../db'); // Your database connection

// Get victim relief details by FIR ID
exports.getVictimReliefDetails = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

  const query = `
    SELECT
      relief_id,
      fir_id,
      victim_name,
      community_certificate,
      relief_amount_scst,
      relief_amount_exgratia,
      relief_amount_first_stage,
      additional_relief,
      created_at,
      updated_at
    FROM
      victim_relief
    WHERE
      fir_id = ?
  `;

  db.query(query, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch victim relief details', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No victim relief details found for the given FIR ID.' });
    }

    res.json({ data: results });
  });
};

// Save or update victim relief details
exports.saveVictimReliefDetails = (req, res) => {
  const { relief_id, fir_id, victim_name, community_certificate, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief } = req.body;

  if (!fir_id) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

  const query = `
    INSERT INTO victim_relief (
      relief_id, fir_id, victim_name, community_certificate, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      victim_name = VALUES(victim_name),
      community_certificate = VALUES(community_certificate),
      relief_amount_scst = VALUES(relief_amount_scst),
      relief_amount_exgratia = VALUES(relief_amount_exgratia),
      relief_amount_first_stage = VALUES(relief_amount_first_stage),
      additional_relief = VALUES(additional_relief),
      updated_at = CURRENT_TIMESTAMP
  `;

  const values = [
    relief_id || require('uuid').v4(), // Generate a new relief_id if not provided
    fir_id,
    victim_name || null,
    community_certificate || null,
    relief_amount_scst || 0,
    relief_amount_exgratia || 0,
    relief_amount_first_stage || 0,
    additional_relief ? JSON.stringify(additional_relief) : null,
  ];

  db.query(query, values, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to save victim relief details', error: err });
    }

    res.json({ message: 'Victim relief details saved successfully.' });
  });
};
