const db = require('../db'); // Import your database connection
const crypto = require('crypto');
// Get dropdown options for Nature of Offence
exports.getNatureOfOffenceOptions = (req, res) => {
  db.query('SELECT id, offence_name FROM offence WHERE status = 1', (err, results) => {
    if (err) {
      console.error('Error fetching Nature of Offence options:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
};

// Fetch Nature of Offence Options
exports.getNatureOfOffences_new = (req, res) => {
  db.query('SELECT id, offence_name FROM offence WHERE status = 1', (err, results) => {
    if (err) {
      console.error('Error fetching Nature of Offences:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
};

// Fetch Offence Acts Options
exports.getOffenceActs_new = (req, res) => {
  db.query('SELECT id, offence_act_name FROM offence_acts WHERE status = 1', (err, results) => {
    if (err) {
      console.error('Error fetching Offence Acts:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
};
// Get dropdown options for Altered POA Sections
exports.getAlteredPoAOptions = (req, res) => {
  db.query('SELECT id, offence_act_name FROM offence_acts WHERE status = 1', (err, results) => {
    if (err) {
      console.error('Error fetching Altered POA options:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
};


exports.getVictimsByFirId = (req, res) => {
  const { fir_id } = req.query;
  const query = 'SELECT * FROM victims WHERE fir_id = ?';
  db.query(query, [fir_id], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Failed to fetch victims', error });
    }
    res.status(200).json(results);
  });
};


exports.updateVictims = (req, res) => {
  const { fir_id, victims } = req.body;

  if (!fir_id || !victims || victims.length === 0) {
    return res.status(400).json({ message: 'Invalid input. Missing FIR ID or victims data.' });
  }

  console.log('Received FIR ID:', fir_id);
  console.log('Victims:', victims);

  const updateQueries = victims.map((victim) => {
    const query = `
      UPDATE victims
      SET 
        offence_committed = ?, 
        scst_sections = ?, 
        fir_stage_as_per_act = ?, 
        fir_stage_ex_gratia = ?, 
        chargesheet_stage_as_per_act = ?, 
        chargesheet_stage_ex_gratia = ?, 
        final_stage_as_per_act = ?, 
        final_stage_ex_gratia = ?, 
        sectionsIPC = ?
      WHERE victim_id = ? AND fir_id = ?
    `;

    const values = [
      JSON.stringify(victim.offence_committed),
      JSON.stringify(victim.scst_sections),
      victim.fir_stage_as_per_act || null,
      victim.fir_stage_ex_gratia || null,
      victim.chargesheet_stage_as_per_act || null,
      victim.chargesheet_stage_ex_gratia || null,
      victim.final_stage_as_per_act || null,
      victim.final_stage_ex_gratia || null,
      victim.alteredSections || null,
      victim.victim_id || null, // Set to NULL if victim_id is missing
      fir_id,
    ];

    return new Promise((resolve, reject) => {
      db.query(query, values, (error) => {
        if (error) {
          console.error(`Failed to update victim ${victim.victim_id}:`, error);
          return reject(error);
        }
        resolve();
      });
    });
  });

  Promise.all(updateQueries)
    .then(() => {
      const updateFirQuery = `UPDATE fir_add SET status = 8 WHERE fir_id = ?`;
      db.query(updateFirQuery, [fir_id], (error) => {
        if (error) {
          console.error('Failed to update FIR status:', error);
          return res.status(500).json({ message: 'Victims updated but failed to update FIR status.' });
        }

        res.status(200).json({ message: 'Victims and FIR status updated successfully.' });
      });
    })
    .catch((error) => {
      console.error('Error updating victims:', error);
      res.status(500).json({ message: 'Failed to update victims.' });
    });
};


// Helper function to generate a random ID
function generateRandomId(length) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

exports.updateVictimCountAndDetails = (req, res) => {
  const { fir_id, number_of_victims, victims } = req.body;

  if (!fir_id || !number_of_victims || !victims || victims.length === 0) {
    return res.status(400).json({ message: 'Invalid input. Missing FIR ID, victim count, or victim details.' });
  }

  // Update victim count in the FIR table
  const updateVictimCountQuery = `
    UPDATE fir_add
    SET number_of_victim = ?
    WHERE fir_id = ?
  `;

  db.query(updateVictimCountQuery, [number_of_victims, fir_id], (err, result) => {
    if (err) {
      console.error('Error updating victim count:', err);
      return res.status(500).json({ message: 'Failed to update victim count.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'FIR not found.' });
    }

    // Process victims
    const victimPromises = victims.map((victim) => {
      return new Promise((resolve, reject) => {
        const {
          victim_id,
          name: victim_name,
          age: victim_age,
          gender: victim_gender,
          mobileNumber: mobile_number,
          address,
          victimPincode: victim_pincode,
          community,
          victimCaste: caste,
          guardianName: guardian_name,
          isNativeDistrictSame: is_native_district_same,
          nativeDistrict: native_district,
          selectedNatureOfOffence: offence_committed,
          selectedOffenceAct: scst_sections,
          alteredSections: sectionsIPC,
          fir_stage_as_per_act,
          fir_stage_ex_gratia,
          chargesheet_stage_as_per_act,
          chargesheet_stage_ex_gratia,
          final_stage_as_per_act,
          final_stage_ex_gratia,
        } = victim;

        if (victim_id) {
          // Update existing victim
          const updateVictimQuery = `
            UPDATE victims
            SET 
              victim_name = ?, 
              victim_age = ?, 
              victim_gender = ?, 
              mobile_number = ?, 
              address = ?, 
              victim_pincode = ?, 
              community = ?, 
              caste = ?, 
              guardian_name = ?, 
              is_native_district_same = ?, 
              native_district = ?, 
              offence_committed = ?, 
              scst_sections = ?, 
              sectionsIPC = ?, 
              fir_stage_as_per_act = ?, 
              fir_stage_ex_gratia = ?, 
              chargesheet_stage_as_per_act = ?, 
              chargesheet_stage_ex_gratia = ?, 
              final_stage_as_per_act = ?, 
              final_stage_ex_gratia = ?
            WHERE victim_id = ? AND fir_id = ?
          `;
          const updateVictimValues = [
            victim_name,
            victim_age,
            victim_gender,
            mobile_number || null,
            address || null,
            victim_pincode || null,
            community,
            caste,
            guardian_name,
            is_native_district_same,
            native_district || null,
            JSON.stringify(offence_committed || []),
            JSON.stringify(scst_sections || []),
            sectionsIPC || null,
            fir_stage_as_per_act || null,
            fir_stage_ex_gratia || null,
            chargesheet_stage_as_per_act || null,
            chargesheet_stage_ex_gratia || null,
            final_stage_as_per_act || null,
            final_stage_ex_gratia || null,
            victim_id,
            fir_id,
          ];

          db.query(updateVictimQuery, updateVictimValues, (err) => {
            if (err) {
              return reject(err);
            }
            resolve({ victimId: victim_id });
          });
        } else {
          // Insert new victim
          const newVictimId = generateRandomId(6); // Generate random ID for new victim
          const insertVictimQuery = `
            INSERT INTO victims (
              victim_id, fir_id, victim_name, victim_age, victim_gender,
              mobile_number, address, victim_pincode, community, caste,
              guardian_name, is_native_district_same, native_district,
              offence_committed, scst_sections, sectionsIPC,
              fir_stage_as_per_act, fir_stage_ex_gratia,
              chargesheet_stage_as_per_act, chargesheet_stage_ex_gratia,
              final_stage_as_per_act, final_stage_ex_gratia
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const insertVictimValues = [
            newVictimId,
            fir_id,
            victim_name,
            victim_age,
            victim_gender,
            mobile_number || null,
            address || null,
            victim_pincode || null,
            community,
            caste,
            guardian_name,
            is_native_district_same,
            native_district || null,
            JSON.stringify(offence_committed || []),
            JSON.stringify(scst_sections || []),
            sectionsIPC || null,
            fir_stage_as_per_act || null,
            fir_stage_ex_gratia || null,
            chargesheet_stage_as_per_act || null,
            chargesheet_stage_ex_gratia || null,
            final_stage_as_per_act || null,
            final_stage_ex_gratia || null,
          ];

          db.query(insertVictimQuery, insertVictimValues, (err) => {
            if (err) {
              return reject(err);
            }
            resolve({ victimId: newVictimId });
          });
        }
      });
    });

    Promise.all(victimPromises)
      .then((results) => {
        const updatedVictims = victims.map((victim, index) => ({
          ...victim,
          victim_id: results[index].victimId,
        }));
        res.status(200).json({
          message: 'Victim count and details updated successfully.',
          fir_id,
          victims: updatedVictims,
        });
      })
      .catch((err) => {
        console.error('Error processing victims:', err);
        res.status(500).json({ message: 'Failed to process victim data.', error: err });
      });
  });
};



exports.handleAccusedData = (req, res) => {
  const { firId, numberOfAccused, accuseds } = req.body;

  if (!firId || !accuseds || accuseds.length === 0) {
    return res.status(400).json({ message: 'FIR ID and accused data are required' });
  }

  // Update the `fir_add` table
  const updateFirQuery = `
    UPDATE fir_add
    SET number_of_accused = ?
    WHERE fir_id = ?
  `;
  const updateFirValues = [numberOfAccused, firId];

  db.query(updateFirQuery, updateFirValues, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to update FIR data', error: err });
    }

    // Process accused records
    const accusedPromises = accuseds.map((accused) => {
      return new Promise((resolve, reject) => {
        if (accused.accusedId) {
          // Update existing accused record
          const updateAccusedQuery = `
            UPDATE accuseds
            SET
              age = ?, name = ?, gender = ?, address = ?, pincode = ?,
              community = ?, caste = ?, guardian_name = ?, previous_incident = ?,
              previous_fir_number = ?, previous_fir_number_suffix = ?, scst_offence = ?,
              scst_fir_number = ?, scst_fir_number_suffix = ?, antecedents = ?, land_o_issues = ?,
              gist_of_current_case = ?
            WHERE accused_id = ?
          `;
          const accusedValues = [
            accused.age, accused.name, accused.gender, accused.address, accused.pincode,
            accused.community, accused.caste, accused.guardianName, accused.previousIncident,
            accused.previousFIRNumber, accused.previousFIRNumberSuffix, accused.scstOffence,
            accused.scstFIRNumber, accused.scstFIRNumberSuffix, accused.antecedents, accused.landOIssues,
            accused.gistOfCurrentCase, accused.accusedId,
          ];

          db.query(updateAccusedQuery, accusedValues, (err) => {
            if (err) return reject(err);
            resolve({ accusedId: accused.accusedId }); // Return existing accusedId
          });
        } else {
          // Insert new accused record
          const accusedId = generateRandomId(6); // Use your existing random ID generation logic
          const insertAccusedQuery = `
            INSERT INTO accuseds (
              accused_id, fir_id, age, name, gender, address, pincode, community, caste,
              guardian_name, previous_incident, previous_fir_number, previous_fir_number_suffix, scst_offence,
              scst_fir_number, scst_fir_number_suffix, antecedents, land_o_issues, gist_of_current_case
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const accusedValues = [
            accusedId, firId, accused.age, accused.name, accused.gender, accused.address,
            accused.pincode, accused.community, accused.caste, accused.guardianName,
            accused.previousIncident, accused.previousFIRNumber, accused.previousFIRNumberSuffix,
            accused.scstOffence, accused.scstFIRNumber, accused.scstFIRNumberSuffix,
            accused.antecedents, accused.landOIssues, accused.gistOfCurrentCase,
          ];

          db.query(insertAccusedQuery, accusedValues, (err) => {
            if (err) return reject(err);
            resolve({ accusedId }); // Return new accusedId
          });
        }
      });
    });

    Promise.all(accusedPromises)
      .then((results) => {
        const updatedAccuseds = accuseds.map((accused, index) => ({
          ...accused,
          accusedId: results[index].accusedId,
        }));
        res.status(200).json({
          message: 'Accused data saved successfully',
          fir_id: firId,
          accuseds: updatedAccuseds,
        });
      })
      .catch((err) => {
        console.error('Failed to process accused data:', err);
        res.status(500).json({ message: 'Failed to process accused data', error: err });
      });
  });
};


exports.getOffenceActsBySections = (req, res) => {
  const { selectedSections } = req.body; // Expecting selected sections in the body

  if (!selectedSections || selectedSections.length === 0) {
    return res.status(400).json({ message: "No sections provided" });
  }

  const placeholders = selectedSections.map(() => '?').join(', ');
  const query = `
    SELECT 
      offence_act_name,
      fir_stage_as_per_act,
      fir_stage_ex_gratia,
      chargesheet_stage_as_per_act,
      chargesheet_stage_ex_gratia,
      final_stage_as_per_act,
      final_stage_ex_gratia
    FROM offence_acts
    WHERE offence_act_name IN (${placeholders})
  `;

  db.query(query, selectedSections, (error, results) => {
    if (error) {
      console.error('Error fetching offence acts:', error);
      return res.status(500).json({ message: 'Failed to fetch offence acts' });
    }

    res.status(200).json(results);
  });
};


exports.getOffenceActsBySections_new = (req, res) => {
  let { selectedSections_new } = req.body; // Expecting sections in the body

  if (!selectedSections_new || selectedSections_new.length === 0) {
    return res.status(400).json({ message: "No sections provided" });
  }

  // Clean the input to remove prefixes and quotes
  selectedSections_new = selectedSections_new.map((section) => {
    const matches = section.match(/'([^']+)'/); // Extract value inside single quotes
    return matches ? matches[1] : section.trim(); // Default to trimmed input if no match
  });

  const placeholders = selectedSections_new.map(() => '?').join(', ');
  const query = `
    SELECT 
      offence_act_name,
      fir_stage_as_per_act,
      fir_stage_ex_gratia,
      chargesheet_stage_as_per_act,
      chargesheet_stage_ex_gratia,
      final_stage_as_per_act,
      final_stage_ex_gratia
    FROM offence_acts
    WHERE offence_act_name IN (${placeholders})
  `;

  console.log('Executing Query:', query);
  console.log('With Parameters:', selectedSections_new);

  db.query(query, selectedSections_new, (error, results) => {
    if (error) {
      console.error('Error fetching offence acts:', error);
      return res.status(500).json({ message: 'Failed to fetch offence acts' });
    }

    console.log('Fetched offence acts:', results);
    res.status(200).json(results);
  });
};






exports.getVictimNames = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required.' });
  }

  // const query = `
  //   SELECT 
  //     v.victim_name AS name, 
  //     CASE 
  //       WHEN v.victim_name IN (
  //         SELECT JSON_UNQUOTE(JSON_EXTRACT(deceased_person_names, CONCAT('$[', idx.i, ']')))
  //         FROM fir_add, JSON_TABLE(deceased_person_names, '$[*]' COLUMNS(idx INT PATH '$')) idx
  //         WHERE fir_add.fir_id = ?
  //       ) THEN 1 
  //       ELSE 0 
  //     END AS isSelected
  //   FROM victims v
  //   WHERE v.fir_id = ?
  // `;

  const query = `
  SELECT 
    victim_name AS name
  FROM victims
  WHERE fir_id = ?
`;

  db.query(query, [firId, firId], (err, results) => {
    if (err) {
      console.error('Error fetching victim names:', err);
      return res.status(500).json({ message: 'Failed to fetch victim names.' });
    }

    res.status(200).json(results);
  });
};




