const db = require('../db');

const generateRandomId = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

exports.addOfficerDetails = (req, res) => {
  const {
    firId,
    officerName,
    officerDesignation,
    officerPhone,
    chargesheetCheckbox,
    chargesheetDate,
    chargesheetType,
    courtDistrict,
    courtName,
    caseNumber,
    rcsFilingNumber,
  } = req.body;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is missing.' });
  }

  const misId = generateRandomId(); // Generate a random `mis_id`

  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ message: 'Transaction start error', error: err });
    }

    // Determine the status based on chargesheetType
    const status = chargesheetType === 'Chargesheet' ? 5 : 9;

    // Update FIR status in the `fir_add` table
    const updateFirStatusQuery = `UPDATE fir_add SET status = ? WHERE fir_id = ?`;
    const updateFirStatusPromise = new Promise((resolve, reject) => {
      db.query(updateFirStatusQuery, [status, firId], (err) => {
        if (err) {
          console.error('Failed to update FIR status:', err);
          return reject(err);
        }
        resolve();
      });
    });

    // Insert officer details into `mistake_of_fact_officers`
    const insertOfficerQuery = `
      INSERT INTO mistake_of_fact_officers (
        mis_id, fir_id, officer_name, officer_designation, officer_phone,
        chargesheet_checkbox, chargesheet_date, chargesheet_type,
        court_district, court_name, case_number, rcs_filing_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const officerValues = [
      misId,
      firId,
      officerName,
      officerDesignation || null,
      officerPhone,
      chargesheetCheckbox,
      chargesheetDate || null,
      chargesheetType,
      courtDistrict || null,
      courtName || null,
      caseNumber || null,
      rcsFilingNumber || null,
    ];

    const insertOfficerPromise = new Promise((resolve, reject) => {
      db.query(insertOfficerQuery, officerValues, (err) => {
        if (err) {
          console.error('Failed to insert officer details:', err);
          return reject(err);
        }
        resolve();
      });
    });

    // Execute all promises and commit transaction
    Promise.all([updateFirStatusPromise, insertOfficerPromise])
      .then(() => {
        db.commit((err) => {
          if (err) {
            console.error('Commit error:', err);
            return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
          }
          res.status(200).json({
            message: 'Officer details added successfully, and FIR status updated.',
            mis_id: misId,
          });
        });
      })
      .catch((err) => {
        console.error('Transaction failed:', err);
        db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
      });
  });
};
