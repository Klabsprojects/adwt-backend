const db = require('../db'); // Update with actual DB connection

exports.getFIRReliefList = (req, res) => {
  const query = `
    SELECT 
      fir_id,
      police_city,
      police_station,
      number_of_victim,
      created_by,
      created_at,
      status
    FROM 
      fir_add
    ORDER BY 
      fir_id DESC
  `;

  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json(results);
  });
};

function generateRandomId(length = 36) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
exports.saveFirstInstallment = (req, res) => {
  const { firId, victims, proceedings } = req.body;

  if (!firId || !victims || !proceedings) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Transaction error', error: err });

    // Insert victims into victim_relief_first
    const victimPromises = victims.map((victim) => {
      return new Promise((resolve, reject) => {
        const victimReliefId = generateRandomId(6); // Generate random ID
        const query = `
          INSERT INTO victim_relief_first (
            victim_relif_id, victim_id, relief_id, fir_id, victim_name, bank_account_number,
            ifsc_code, bank_name, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          victimReliefId,
          victim.victimId,
          victim.reliefId,
          firId,
          victim.victimName,
          victim.bankAccountNumber,
          victim.ifscCode,
          victim.bankName,
          victim.reliefAmountScst || 0,
          victim.reliefAmountExGratia || 0,
          victim.reliefAmountFirstStage || 0,
        ];

        db.query(query, values, (err) => (err ? reject(err) : resolve()));
      });
    });

    // Insert proceedings into proceedings_victim_relief_first
    const proceedingsPromiseFirst = new Promise((resolve, reject) => {
      const proceedingId = generateRandomId(6); // Generate random ID
      const query = `
        INSERT INTO proceedings_victim_relief_first (
          proceeding_id, fir_id, proceedings_file_no, proceedings_date,
          proceedings_file, pfms_portal_uploaded
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [
        proceedingId,
        firId,
        proceedings.fileNo,
        proceedings.fileDate,
        proceedings.uploadDocument,
        proceedings.pfmsPortalUploaded,
      ];

      db.query(query, values, (err) => (err ? reject(err) : resolve()));
    });

    // Insert proceedings into proceedings_victim_relief
    const proceedingsPromise = new Promise((resolve, reject) => {
      const query = `
        INSERT INTO proceedings_victim_relief (
          proceedings_id, fir_id, total_compensation, proceedings_file_no,
          proceedings_date, proceedings_file
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [
        generateRandomId(6), // Generate random ID
        firId,
        proceedings.totalCompensation || 0.0,
        proceedings.fileNo,
        proceedings.fileDate,
        proceedings.uploadDocument,
      ];

      db.query(query, values, (err) => (err ? reject(err) : resolve()));
    });

    // Update status in fir_add table
    const updateFirStatus = new Promise((resolve, reject) => {
      const query = `
        UPDATE fir_add
        SET relief_status = ?
        WHERE fir_id = ?
      `;
      const values = [1, firId];

      db.query(query, values, (err) => (err ? reject(err) : resolve()));
    });

    // Execute all queries within the transaction
    Promise.all([...victimPromises, proceedingsPromiseFirst, proceedingsPromise, updateFirStatus])
      .then(() => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
          }
          res.status(200).json({ message: 'First Installment Details Saved and FIR status updated successfully.' });
        });
      })
      .catch((err) => {
        db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
      });
  });
};



exports.getVictimsReliefDetails_1 = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

  const query = `
    SELECT
      victim_id AS victimId,
      relief_id AS reliefId,
      victim_name AS victimName,
      relief_amount_scst AS firstInstallmentReliefScst,
      relief_amount_exgratia AS firstInstallmentReliefExGratia
    FROM victim_relief
    WHERE fir_id = ?
  `;

  db.query(query, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch victim relief details', error: err });
    }

    return res.status(200).json({ victimsReliefDetails: results });
  });
};


exports.getTrialReliefDetails = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

  const query = `
    SELECT
      trial_id AS trialId,
      victim_id AS victimId,
      fir_id AS firId,
      victim_name AS victimName,
      relief_amount_act AS reliefAmountAct,
      relief_amount_government AS reliefAmountGovernment,
      relief_amount_final_stage AS reliefAmountFinalStage
    FROM trial_relief
    WHERE fir_id = ?
  `;

  db.query(query, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch trial relief details', error: err });
    }

    return res.status(200).json({ trialReliefDetails: results });
  });
};


exports.getSecondInstallmentDetails = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required.' });
  }

  const query = `
    SELECT 
      fir_id, 
      victim_id, 
      chargesheet_id, 
      victim_name AS secondInstallmentVictimName,
      relief_amount_scst_1 AS secondInstallmentReliefScst, 
      relief_amount_ex_gratia_1 AS secondInstallmentReliefExGratia, 
      relief_amount_second_stage AS secondInstallmentTotalRelief
    FROM chargesheet_victims
    WHERE fir_id = ?
  `;

  db.query(query, [firId], (err, results) => {
    if (err) {
      console.error('Error fetching second installment details:', err);
      return res.status(500).json({ message: 'Failed to fetch second installment details.', error: err });
    }

    res.status(200).json({ victims: results });
  });
};

exports.saveSecondInstallment = (req, res) => {
  const { firId, victims, proceedings } = req.body;

  if (!firId || !victims || !proceedings) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Transaction error", error: err });

    // Insert victims into `victim_relief_second`
    const victimPromises = victims.map((victim) => {
      return new Promise((resolve, reject) => {
        const victimReliefId = generateRandomId(10); // Generate random ID
        const query = `
          INSERT INTO victim_relief_second (
            victim_chargesheet_id, victim_id, chargesheet_id, fir_id,
            victim_name, secondInstallmentReliefScst,
            secondInstallmentReliefExGratia, secondInstallmentTotalRelief
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          victimReliefId,
          victim.victimId,
          victim.chargesheetId,
          firId,
          victim.victimName,
          victim.secondInstallmentReliefScst || 0,
          victim.secondInstallmentReliefExGratia || 0,
          victim.secondInstallmentTotalRelief || 0,
        ];

        db.query(query, values, (err) => (err ? reject(err) : resolve()));
      });
    });

    // Insert proceedings into `second_installment_proceedings`
    const proceedingsPromise = new Promise((resolve, reject) => {
      const query = `
        INSERT INTO second_installment_proceedings (
          fir_id, file_number, file_date, upload_document,
          pfms_portal_uploaded, date_of_disbursement
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        firId,
        proceedings.fileNumber,
        proceedings.fileDate,
        proceedings.uploadDocument || null,
        proceedings.pfmsPortalUploaded,
        proceedings.dateOfDisbursement,
      ];

      db.query(query, values, (err) => (err ? reject(err) : resolve()));
    });

    // Update the status in the `fir_add` table
    const updateStatusPromise = new Promise((resolve, reject) => {
      const query = `
        UPDATE fir_add
        SET relief_status = 2
        WHERE fir_id = ?
      `;

      db.query(query, [firId], (err) => (err ? reject(err) : resolve()));
    });

    // Execute all queries in the transaction
    Promise.all([...victimPromises, proceedingsPromise, updateStatusPromise])
      .then(() => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() =>
              res.status(500).json({ message: "Commit error", error: err })
            );
          }
          res.status(200).json({ message: "Second Installment Data Saved Successfully and Status Updated" });
        });
      })
      .catch((err) => {
        db.rollback(() => res.status(500).json({ message: "Transaction failed", error: err }));
      });
  });
};


exports.saveThirdInstallmentDetails = (req, res) => {
  const { firId, victims, proceedings } = req.body;

  if (!firId || !victims || !proceedings) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Transaction error', error: err });

    // Insert or update victim details into `trial_stage_relief`
    const victimPromises = victims.map((victim) => {
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO trial_stage_relief (
            trial_stage_id, victim_id, trial_id, fir_id,
            victim_name, trialStageReliefAct,
            trialStageReliefGovernment, trialStageReliefTotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            victim_name = VALUES(victim_name),
            trialStageReliefAct = VALUES(trialStageReliefAct),
            trialStageReliefGovernment = VALUES(trialStageReliefGovernment),
            trialStageReliefTotal = VALUES(trialStageReliefTotal)
        `;

        const values = [
          generateRandomId(10), // Generate unique trial_stage_id
          victim.victimId,
          victim.trialId, // Use existing trial_id
          firId,
          victim.victimName || null,
          victim.thirdInstallmentReliefAct || 0,
          victim.thirdInstallmentReliefGovernment || 0,
          victim.thirdInstallmentReliefTotal || 0,
        ];

        db.query(query, values, (err) => (err ? reject(err) : resolve()));
      });
    });

    // Insert proceedings details into `trial_proceedings`
    const proceedingsPromise = new Promise((resolve, reject) => {
      const query = `
        INSERT INTO trial_proceedings (
          trial_id, fir_id, file_number, file_date, upload_document, pfms_portal_uploaded, date_of_disbursement
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          file_number = VALUES(file_number),
          file_date = VALUES(file_date),
          upload_document = VALUES(upload_document),
          pfms_portal_uploaded = VALUES(pfms_portal_uploaded),
          date_of_disbursement = VALUES(date_of_disbursement)
      `;

      const values = [
        proceedings.trialId, // Use the trialId from proceedings
        firId,
        proceedings.fileNumber,
        proceedings.fileDate,
        proceedings.uploadDocument || null,
        proceedings.pfmsPortalUploaded,
        proceedings.dateOfDisbursement,
      ];

      db.query(query, values, (err) => (err ? reject(err) : resolve()));
    });

    // Update the FIR status in `fir_add`
    const updateStatusPromise = new Promise((resolve, reject) => {
      const query = `
        UPDATE fir_add
        SET relief_status = 3
        WHERE fir_id = ?
      `;

      db.query(query, [firId], (err) => (err ? reject(err) : resolve()));
    });

    // Execute all queries
    Promise.all([...victimPromises, proceedingsPromise, updateStatusPromise])
      .then(() => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() =>
              res.status(500).json({ message: 'Commit error', error: err })
            );
          }
          res.status(200).json({ message: 'Third Installment Details Saved Successfully and Status Updated' });
        });
      })
      .catch((err) => {
        db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
      });
  });
};








