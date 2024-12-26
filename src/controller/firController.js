const db = require('../db'); // Make sure the path to the database file is correct
const { v4: uuidv4 } = require('uuid');

// Get User Details
exports.getUserDetails = (req, res) => {
  const userId = req.body.userId;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch user data', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(results[0]);
  });
};

// Get Police Division Details
exports.getPoliceDivisionDetails = (req, res) => {
  const district = req.query.district;
  if (!district) {
    return res.status(400).json({ message: 'District is required' });
  }

  const query = 'SELECT * FROM police_division WHERE district_division_name = ?';
  db.query(query, [district], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch police division data', error: err });
    }
    res.json(results);
  });
};


// Function to generate a random ID
function generateRandomId(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Main function to handle saving or updating FIR
exports.handleStepOne = (req, res) => {
  const { firId, firData } = req.body;
  const {
    policeCity,
    policeZone,
    policeRange,
    revenueDistrict,
    stationName,
    officerName, // New Field
    officerDesignation, // New Field
    officerPhone, // New Field
  } = firData;

  const policeStation = stationName;
  let query, values;

  let newFirId = firId;
  if (!firId || firId === '1' || firId === null) {
    newFirId = generateRandomId(6);
  }

  if (!firId || firId === '1' || firId === null) {
    query = `
      INSERT INTO fir_add (fir_id, police_city, police_zone, police_range, revenue_district, police_station, officer_name, officer_designation, officer_phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
    `;
    values = [
      newFirId,
      policeCity,
      policeZone,
      policeRange,
      revenueDistrict,
      policeStation,
      officerName,
      officerDesignation,
      officerPhone,
    ];
  } else {
    query = `
      UPDATE fir_add
      SET police_city = ?, police_zone = ?, police_range = ?, revenue_district = ?, police_station = ?, officer_name = ?, officer_designation = ?, officer_phone = ?, updated_at = NOW()
      WHERE fir_id = ?
    `;
    values = [
      policeCity,
      policeZone,
      policeRange,
      revenueDistrict,
      policeStation,
      officerName,
      officerDesignation,
      officerPhone,
      firId,
    ];
  }

  db.query(query, values, (err) => {
    if (err) {
      console.error('Error saving FIR:', err);
      return res.status(500).json({ message: 'Failed to save FIR', error: err });
    }
    res.status(200).json({ message: 'FIR saved successfully', fir_id: newFirId });
  });
};





exports.handleStepTwo = (req, res) => {
  const { firId, firData } = req.body;

  if (!firId || firId === '1' || firId === null) {
    return res.status(400).json({ message: 'FIR ID is required for step 2' });
  }

  // Extract fields from firData
  let {
    firNumber,
    firNumberSuffix,
    dateOfOccurrence,
    timeOfOccurrence,
    placeOfOccurrence,
    dateOfRegistration,
    timeOfRegistration,
    natureOfOffence,

  } = firData;

  // Convert natureOfOffence to a single string if it's an array
  //natureOfOffence = Array.isArray(natureOfOffence) ? natureOfOffence.join(', ') : natureOfOffence;

  // Convert sectionsIPC to a single string if it's an array


  // Construct the query to update step 2 data
  const query = `
    UPDATE fir_add
    SET
      fir_number = ?,
      fir_number_suffix = ?,
      date_of_occurrence = ?,
      time_of_occurrence = ?,
      place_of_occurrence = ?,
      date_of_registration = ?,
      time_of_registration = ?,
      updated_at = NOW()
    WHERE fir_id = ?
  `;

  // Prepare the values array for the query
  const values = [
    firNumber,
    firNumberSuffix,
    dateOfOccurrence,
    timeOfOccurrence,
    placeOfOccurrence,
    dateOfRegistration,
    timeOfRegistration,


    firId,
  ];

  // Execute the query to update the existing FIR record
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating FIR for step 2:', err);
      return res.status(500).json({ message: 'Failed to update FIR for step 2', error: err });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'FIR updated successfully for step 2', fir_id: firId });
    } else {
      return res.status(404).json({ message: 'FIR not found for step 2', fir_id: firId });
    }
  });
};



exports.handleStepThree = (req, res) => {
  const { firId, complainantDetails, victims, isDeceased, deceasedPersonNames } = req.body;

  // Update FIR data in `fir_add` table
  const updateFirQuery = `
    UPDATE fir_add
    SET
      name_of_complainant = ?,
      mobile_number_of_complainant = ?,
      is_victim_same_as_complainant = ?,
      number_of_victim = ?,
      is_deceased = ?,
      deceased_person_names = ?
    WHERE fir_id = ?;
  `;
  const updateFirValues = [
    complainantDetails.nameOfComplainant,
    complainantDetails.mobileNumberOfComplainant,
    complainantDetails.isVictimSameAsComplainant,
    victims.length,
    isDeceased === 'yes' ? 1 : 0,
    JSON.stringify(deceasedPersonNames || []),
    firId,
  ];

  db.query(updateFirQuery, updateFirValues, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to update FIR data', error: err });
    }

    const victimPromises = victims.map((victim) => {
      return new Promise((resolve, reject) => {
        if (victim.victimId) {
          // Update existing victim
          const updateVictimQuery = `
            UPDATE victims
            SET
              victim_name = ?,
              victim_age = ?,
              victim_gender = ?,
              custom_gender = ?,
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
            WHERE victim_id = ?;
          `;
          const updateVictimValues = [
            victim.name,
            victim.age,
            victim.gender,
            victim.gender === 'Other' ? victim.customGender || null : null,
            victim.mobileNumber || null,
            victim.address || null,
            victim.victimPincode || null,
            victim.community,
            victim.caste,
            victim.guardianName,
            victim.isNativeDistrictSame,
            victim.nativeDistrict || null,
            JSON.stringify(victim.offenceCommitted || []),
            JSON.stringify(victim.scstSections || []),
            victim.sectionsIPC || null,
            victim.fir_stage_as_per_act || null,
            victim.fir_stage_ex_gratia || null,
            victim.chargesheet_stage_as_per_act || null,
            victim.chargesheet_stage_ex_gratia || null,
            victim.final_stage_as_per_act || null,
            victim.final_stage_ex_gratia || null,
            victim.victimId,
          ];
          db.query(updateVictimQuery, updateVictimValues, (err) => {
            if (err) return reject(err);
            resolve({ victimId: victim.victimId });
          });
        } else {
          // Insert new victim
          const victimId = generateRandomId(6);
          const insertVictimQuery = `
  INSERT INTO victims (
    victim_id, fir_id, victim_name, victim_age, victim_gender, custom_gender,
    mobile_number, address, victim_pincode, community, caste,
    guardian_name, is_native_district_same, native_district,
    offence_committed, scst_sections, sectionsIPC, fir_stage_as_per_act,
    fir_stage_ex_gratia, chargesheet_stage_as_per_act,
    chargesheet_stage_ex_gratia, final_stage_as_per_act,
    final_stage_ex_gratia
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

const insertVictimValues = [
  victimId, // 1. victim_id
  firId, // 2. fir_id
  victim.name || '', // 3. victim_name
  victim.age || '', // 4. victim_age
  victim.gender || '', // 5. victim_gender
  victim.gender === 'Other' ? victim.customGender || null : null, // 6. custom_gender
  victim.mobileNumber || null, // 7. mobile_number
  victim.address || null, // 8. address
  victim.victimPincode || null, // 9. victim_pincode
  victim.community || '', // 10. community
  victim.caste || '', // 11. caste
  victim.guardianName || '', // 12. guardian_name
  victim.isNativeDistrictSame || '', // 13. is_native_district_same
  victim.nativeDistrict || null, // 14. native_district
  JSON.stringify(victim.offenceCommitted || []), // 15. offence_committed
  JSON.stringify(victim.scstSections || []), // 16. scst_sections
  victim.sectionsIPC || null, // 17. sectionsIPC
  victim.fir_stage_as_per_act || null, // 18. fir_stage_as_per_act
  victim.fir_stage_ex_gratia || null, // 19. fir_stage_ex_gratia
  victim.chargesheet_stage_as_per_act || null, // 20. chargesheet_stage_as_per_act
  victim.chargesheet_stage_ex_gratia || null, // 21. chargesheet_stage_ex_gratia
  victim.final_stage_as_per_act || null, // 22. final_stage_as_per_act
  victim.final_stage_ex_gratia || null, // 23. final_stage_ex_gratia
];

db.query(insertVictimQuery, insertVictimValues, (err) => {
  if (err) {
    console.error("Database Insert Error:", err);
    return reject(err);
  }
  resolve({ victimId });
});

        }
      });
    });

    Promise.all(victimPromises)
      .then((results) => {
        const updatedVictims = victims.map((victim, index) => ({
          ...victim,
          victimId: results[index].victimId,
        }));
        res.status(200).json({
          message: 'Step 3 data saved successfully',
          fir_id: firId,
          victims: updatedVictims,
        });
      })
      .catch((err) => {
        res.status(500).json({ message: 'Failed to process victim data', error: err });
      });
  });
};








exports.handleStepFour = (req, res) => {
  const { firId, numberOfAccused } = req.body;
  const uploadedFilePath = req.file ? `/uploads/fir_copy/${req.file.filename}` : null;

  // Parse accuseds from JSON string
  let accuseds = [];
  try {
    accuseds = JSON.parse(req.body.accuseds || '[]');
  } catch (error) {
    return res.status(400).json({ message: 'Invalid accuseds data', error: error.message });
  }

  // Validate required fields
  if (!firId || !numberOfAccused || !accuseds) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  console.log("Uploaded File Path:", uploadedFilePath);
  console.log("Number of Accused:", numberOfAccused);
  console.log("Accuseds Data:", accuseds);

  // Update FIR data in the `fir_add` table
  const updateFirQuery = `
    UPDATE fir_add
    SET
      number_of_accused = ?,
      upload_fir_copy = ?
    WHERE fir_id = ?;
  `;
  const updateFirValues = [numberOfAccused, uploadedFilePath, firId];

  db.query(updateFirQuery, updateFirValues, (err) => {
    if (err) {
      console.error("Failed to update FIR data:", err);
      return res.status(500).json({ message: "Failed to update FIR data", error: err.message });
    }

    // Process accused data
    const accusedPromises = accuseds.map((accused) => {
      return new Promise((resolve, reject) => {
        if (accused.accusedId) {
          // Update existing accused record
          const updateAccusedQuery = `
            UPDATE accuseds
            SET
              age = ?, name = ?, gender = ?, custom_gender = ?, address = ?, pincode = ?,
              community = ?, caste = ?, guardian_name = ?, previous_incident = ?,
              previous_fir_number = ?, previous_fir_number_suffix = ?, scst_offence = ?,
              scst_fir_number = ?, scst_fir_number_suffix = ?, antecedents = ?, land_o_issues = ?,
              gist_of_current_case = ?
            WHERE accused_id = ?;
          `;
          const accusedValues = [
            accused.age,
            accused.name,
            accused.gender,
            accused.gender === 'Other' ? accused.customGender || '' : '', // Add customGender if applicable
            accused.address,
            accused.pincode,
            accused.community,
            accused.caste,
            accused.guardianName,
            accused.previousIncident,
            accused.previousFIRNumber,
            accused.previousFIRNumberSuffix,
            accused.scstOffence,
            accused.scstFIRNumber,
            accused.scstFIRNumberSuffix,
            accused.antecedents,
            accused.landOIssues,
            accused.gistOfCurrentCase,
            accused.accusedId,
          ];

          db.query(updateAccusedQuery, accusedValues, (err) => {
            if (err) return reject(err);
            resolve({ accusedId: accused.accusedId });
          });
        } else {
          // Insert new accused record
          const accusedId = generateRandomId(6);
          const insertAccusedQuery = `
            INSERT INTO accuseds (
              accused_id, fir_id, age, name, gender, custom_gender, address, pincode, community, caste,
              guardian_name, previous_incident, previous_fir_number, previous_fir_number_suffix, scst_offence,
              scst_fir_number, scst_fir_number_suffix, antecedents, land_o_issues, gist_of_current_case
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `;
          const accusedValues = [
            accusedId,
            firId,
            accused.age,
            accused.name,
            accused.gender,
            accused.gender === 'Other' ? accused.customGender || '' : '', // Add customGender if applicable
            accused.address,
            accused.pincode,
            accused.community,
            accused.caste,
            accused.guardianName,
            accused.previousIncident,
            accused.previousFIRNumber,
            accused.previousFIRNumberSuffix,
            accused.scstOffence,
            accused.scstFIRNumber,
            accused.scstFIRNumberSuffix,
            accused.antecedents,
            accused.landOIssues,
            accused.gistOfCurrentCase,
          ];

          db.query(insertAccusedQuery, accusedValues, (err) => {
            if (err) return reject(err);
            resolve({ accusedId });
          });
        }
      });
    });

    // Wait for all accused records to be processed
    Promise.all(accusedPromises)
      .then((results) => {
        const updatedAccuseds = accuseds.map((accused, index) => ({
          ...accused,
          accusedId: results[index].accusedId,
        }));
        res.status(200).json({
          message: "Step 4 data saved successfully",
          fir_id: firId,
          accuseds: updatedAccuseds,
        });
      })
      .catch((err) => {
        console.error("Failed to process accused data:", err);
        res.status(500).json({ message: "Failed to process accused data", error: err.message });
      });
  });
};








// Get number of victims and victim names by FIR ID
exports.getVictimsDetailsByFirId = (req, res) => {
  const { firId } = req.params;

  // Query to get the number of victims from fir_add table
  const getNumberOfVictimsQuery = `
    SELECT number_of_victims FROM fir_add WHERE fir_id = ?
  `;

  // Query to get victim names from the victims table
  const getVictimNamesQuery = `
    SELECT victim_name FROM victims WHERE fir_id = ?
  `;

  // Execute both queries using a transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ message: 'Transaction error', error: err });
    }

    // Execute the first query
    db.query(getNumberOfVictimsQuery, [firId], (err, numberOfVictimsResult) => {
      if (err) {
        db.rollback(() => {
          return res.status(500).json({ message: 'Failed to retrieve number of victims', error: err });
        });
      }

      // Check if the result is not empty
      if (numberOfVictimsResult.length === 0) {
        db.rollback(() => {
          return res.status(404).json({ message: 'No FIR record found for the provided FIR ID' });
        });
      }

      // Extract the number of victims
      const numberOfVictims = numberOfVictimsResult[0].number_of_victims;

      // Execute the second query
      db.query(getVictimNamesQuery, [firId], (err, victimNamesResult) => {
        if (err) {
          db.rollback(() => {
            return res.status(500).json({ message: 'Failed to retrieve victim names', error: err });
          });
        }

        // Commit the transaction if both queries succeed
        db.commit((err) => {
          if (err) {
            db.rollback(() => {
              return res.status(500).json({ message: 'Transaction commit error', error: err });
            });
          }

          // Extract victim names
          const victimNames = victimNamesResult.map((victim) => victim.victim_name);

          // Return the combined result
          return res.status(200).json({
            message: 'Victim details retrieved successfully',
            numberOfVictims: numberOfVictims,
            victimNames: victimNames,
          });
        });
      });
    });
  });
};







// Update FIR status based on the current step
exports.updateFirStatus = (req, res) => {
  const { firId, status } = req.body;

  // Check if FIR ID and status are provided
  if (!firId || !status) {
    return res.status(400).json({ message: 'FIR ID and status are required' });
  }

  // Update the status in the database
  const query = `
    UPDATE fir_add
    SET status = ?
    WHERE fir_id = ?
  `;
  const values = [status, firId];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to update FIR status', error: err });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'FIR status updated successfully' });
    } else {
      return res.status(404).json({ message: 'FIR not found' });
    }
  });
};



exports.handleStepFive = (req, res) => {
  const {
    firId,
    victimsRelief,
    totalCompensation,
    proceedingsFileNo,
    proceedingsDate,
    proceedingsFile,
    attachments, // Attachments array
  } = req.body;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is missing.' });
  }

  const generateRandomId = (length = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Transaction error', error: err });

    // Insert or update victimsRelief
    const victimPromises = victimsRelief.map((victim, index) => {
      return new Promise((resolve, reject) => {
        const victimId = victim.victimId || ''; // Use existing victim_id or generate a new one
        const reliefId = victim.reliefId || generateRandomId(6);

        const query = `
          INSERT INTO victim_relief (
            victim_id, relief_id, fir_id, victim_name, community_certificate,
            relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            victim_name = VALUES(victim_name),
            community_certificate = VALUES(community_certificate),
            relief_amount_scst = VALUES(relief_amount_scst),
            relief_amount_exgratia = VALUES(relief_amount_exgratia),
            relief_amount_first_stage = VALUES(relief_amount_first_stage),
            additional_relief = VALUES(additional_relief)
        `;
        const values = [
          victimId, // Add victim_id here
          reliefId,
          firId,
          victim.victimName || `Victim ${index + 1}`,
          victim.communityCertificate || 'no',
          victim.reliefAmountScst || '0.00',
          victim.reliefAmountExGratia || '0.00',
          victim.reliefAmountFirstStage || '0.00',
          JSON.stringify(victim.additionalRelief || []),
        ];

        db.query(query, values, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    // Insert or update proceedings data
    const proceedingsPromise = new Promise((resolve, reject) => {
      const proceedingsId = generateRandomId(6);
      const query = `
        INSERT INTO proceedings_victim_relief (
          proceedings_id, fir_id, total_compensation, proceedings_file_no,
          proceedings_date, proceedings_file
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_compensation = VALUES(total_compensation),
          proceedings_file_no = VALUES(proceedings_file_no),
          proceedings_date = VALUES(proceedings_date),
          proceedings_file = VALUES(proceedings_file)
      `;
      const values = [
        proceedingsId,
        firId,
        totalCompensation || '0.00',
        proceedingsFileNo || null,
        proceedingsDate || null,
        proceedingsFile || null,
      ];

      db.query(query, values, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Insert attachments into the `attachment_relief` table
    const attachmentPromises = attachments.map((attachment) => {
      return new Promise((resolve, reject) => {
        const attachmentId = generateRandomId(8);
        const query = `
          INSERT INTO attachment_relief (
            attachment_id, fir_id, file_name, file_path
          ) VALUES (?, ?, ?, ?)
        `;
        const values = [
          attachmentId,
          firId,
          attachment.fileName || null,
          attachment.filePath || null,
        ];

        db.query(query, values, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    // Combine all promises
    Promise.all([...victimPromises, proceedingsPromise, ...attachmentPromises])
      .then(() => {
        db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
          res.status(200).json({ message: 'Step 5 data saved successfully, including attachments.' });
        });
      })
      .catch((err) => {
        db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
      });
  });
};





exports.handleStepSix = (req, res) => {
  const {
    firId,
    chargesheetDetails,
    victimsRelief,
    attachments, // Attachments array
  } = req.body;



  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is missing.' });
  }

  const generateRandomId = (length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Transaction error', error: err });

    // Update FIR status in the `fir_add` table
    const updateFirStatusPromise = new Promise((resolve, reject) => {
      const query = `
        UPDATE fir_add
        SET status = 6
        WHERE fir_id = ?
      `;
      db.query(query, [firId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Insert or update chargesheet details
    const chargesheetId = chargesheetDetails.chargesheetId || generateRandomId();
    const chargesheetPromise = new Promise((resolve, reject) => {
      const query = `
        INSERT INTO chargesheet_details (
          chargesheet_id, fir_id, charge_sheet_filed, court_district,
          court_name, case_type, case_number, rcs_file_number,
          rcs_filing_date, mf_copy_path, total_compensation_1,
          proceedings_file_no, proceedings_date, upload_proceedings_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          charge_sheet_filed = VALUES(charge_sheet_filed),
          court_district = VALUES(court_district),
          court_name = VALUES(court_name),
          case_type = VALUES(case_type),
          case_number = VALUES(case_number),
          rcs_file_number = VALUES(rcs_file_number),
          rcs_filing_date = VALUES(rcs_filing_date),
          mf_copy_path = VALUES(mf_copy_path),
          total_compensation_1 = VALUES(total_compensation_1),
          proceedings_file_no = VALUES(proceedings_file_no),
          proceedings_date = VALUES(proceedings_date),
          upload_proceedings_path = VALUES(upload_proceedings_path)
      `;
      const values = [
        chargesheetId,
        firId,
        chargesheetDetails.chargeSheetFiled || null,
        chargesheetDetails.courtDistrict || null,
        chargesheetDetails.courtName || null,
        chargesheetDetails.caseType || null,
        chargesheetDetails.caseNumber || null,
        chargesheetDetails.rcsFileNumber || null,
        chargesheetDetails.rcsFilingDate || null,
        chargesheetDetails.mfCopyPath || null,
        chargesheetDetails.totalCompensation || null,
        chargesheetDetails.proceedingsFileNo || null,
        chargesheetDetails.proceedingsDate || null,
        chargesheetDetails.uploadProceedingsPath || null,
      ];

      db.query(query, values, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Insert or update victimsRelief
    const victimPromises = victimsRelief.map((victim, index) => {
      return new Promise((resolve, reject) => {
        const victimId = victim.victimId || generateRandomId();
        console.log('Victim Data:', victim);
        console.log('Relief Amounts:', {
          scst: victim.reliefAmountScst,
          exGratia: victim.reliefAmountExGratia,
          secondStage: victim.reliefAmountSecondStage,
        });

        const query = `
          INSERT INTO chargesheet_victims ( fir_id,
            victim_id, chargesheet_id, victim_name,
            relief_amount_scst_1, relief_amount_ex_gratia_1,
            relief_amount_second_stage
          ) VALUES (?, ?, ?, ?, ?, ?,?)
          ON DUPLICATE KEY UPDATE
            fir_id = VALUES(fir_id),
            victim_name = VALUES(victim_name),
            relief_amount_scst_1 = VALUES(relief_amount_scst_1),
            relief_amount_ex_gratia_1 = VALUES(relief_amount_ex_gratia_1),
            relief_amount_second_stage = VALUES(relief_amount_second_stage)
        `;
        const values = [
          firId,
          victimId,
          chargesheetId,
          victim.victimName || `Victim ${index + 1}`,
          victim.reliefAmountScst || '0.00',
          victim.reliefAmountExGratia || '0.00',
          victim.reliefAmountSecondStage || '0.00',
        ];

        db.query(query, values, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    // Insert attachments
    const attachmentPromises = attachments.map((attachment) => {
      return new Promise((resolve, reject) => {
        const attachmentId = generateRandomId();
        const query = `
          INSERT INTO chargesheet_attachments (fir_id,
            attachment_id, chargesheet_id, file_path
          ) VALUES (?, ?, ?,?)
        `;
        const values = [
          firId,
          attachmentId,
          chargesheetId,
          attachment.filePath || null,
        ];

        db.query(query, values, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    // Combine all promises
    Promise.all([updateFirStatusPromise, chargesheetPromise, ...victimPromises, ...attachmentPromises])
      .then(() => {
        db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
          res.status(200).json({ message: 'Step 6 data saved successfully, and FIR status updated to 6.' });
        });
      })
      .catch((err) => {
        db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
      });
  });
};





exports.getPoliceStations = (req, res) => {
  const { district } = req.query; // Get the district name from query parameters
  const query = 'SELECT station_name FROM police_stations WHERE city_or_district = ?';

  db.query(query, [district], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch police stations', error: err });
    }
    res.json(results.map(row => row.station_name)); // Return only station names as an array
  });
};



// Fetch all Offence Names
exports.getAllOffences = (req, res) => {
  const query = 'SELECT offence_name FROM offence';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch offences', error: err });
    }
    res.json(results);
  });
};

// Fetch all Offence Act Names
exports.getAllOffenceActs = (req, res) => {
  const query = `
    SELECT
      id,
      offence_act_name,
      fir_stage_as_per_act,
      fir_stage_ex_gratia,
      chargesheet_stage_as_per_act,
      chargesheet_stage_ex_gratia,
      final_stage_as_per_act,
      final_stage_ex_gratia
    FROM
      offence_acts
  `;
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch offence acts', error: err });
    }
    res.json(results);
  });
};


// Fetch all Caste Names (SC/ST Sections)
// exports.getAllCastes = (req, res) => {
//   const query = 'SELECT caste_name FROM caste_community';
//   db.query(query, (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to fetch caste names', error: err });
//     }
//     res.json(results);
//   });
// };

exports.getAllCommunities = (req, res) => {
  const query = 'SELECT DISTINCT community_name FROM caste_community';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch communities', error: err });
    }
    res.json(results.map(row => row.community_name));
  });
};


exports.getCastesByCommunity = (req, res) => {
  const { community } = req.query; // Extract community from query parameters
  const query = 'SELECT caste_name FROM caste_community WHERE community_name = ?';
  db.query(query, [community], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch caste names', error: err });
    }
    res.json(results.map(row => row.caste_name)); // Return only the caste names
  });
};


exports.getAllAccusedCommunities = (req, res) => {
  const query = 'SELECT DISTINCT community_name FROM acquest_community_caste';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch accused communities', error: err });
    }
    res.json(results.map(row => row.community_name));
  });
};


exports.getAccusedCastesByCommunity = (req, res) => {
  const { community } = req.query;
  const query = 'SELECT caste_name FROM acquest_community_caste WHERE community_name = ?';
  db.query(query, [community], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch accused castes', error: err });
    }
    res.json(results.map(row => row.caste_name));
  });
};


exports.getAllRevenues = (req, res) => {
  const query = 'SELECT revenue_district_name FROM district_revenue';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch revenue districts', error: err });
    }
    res.json(results);
  });
};


exports.getAllCourtDivisions = (req, res) => {
  const query = 'SELECT DISTINCT court_division_name FROM court';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch court divisions', error: err });
    }
    res.json(results.map(row => row.court_division_name));
  });
};


exports.getCourtRangesByDivision = (req, res) => {
  const { division } = req.query;
  const query = 'SELECT court_range_name FROM court WHERE court_division_name = ?';
  db.query(query, [division], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch court ranges', error: err });
    }
    res.json(results.map(row => row.court_range_name));
  });
};


exports.getAllDistricts = (req, res) => {
  const query = 'SELECT district_name FROM district';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch districts', error: err });
    }
    res.json(results.map(row => row.district_name));
  });
};



exports.getVictimsReliefDetails = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

  const query = `
    SELECT
      victim_id,
      victim_name,
      fir_stage_as_per_act,
      fir_stage_ex_gratia,
      chargesheet_stage_as_per_act,
      chargesheet_stage_ex_gratia,
      final_stage_as_per_act,
      final_stage_ex_gratia
    FROM victims
    WHERE fir_id = ?
  `;

  db.query(query, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch victim relief details', error: err });
    }

    return res.status(200).json({ victimsReliefDetails: results });
  });
};



exports.getFirDetails = (req, res) => {
  const { fir_id } = req.query;

  if (!fir_id) {
    return res.status(400).json({ message: 'FIR ID is required.' });
  }

  const query = `
    SELECT
      fir_id, police_station, fir_number, date_of_occurrence, place_of_occurrence, number_of_victim, number_of_accused,
      DATE_FORMAT(date_of_registration, '%d.%m.%Y') as date_of_registration
    FROM fir_add
    WHERE fir_id = ? LIMIT 1
  `;

  db.query(query, [fir_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error fetching FIR details.', error: err });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'FIR not found.' });
    }

    res.status(200).json(result[0]);
  });
};


exports.getFirStatus = (req, res) => {
  const { firId } = req.params;

  const query = `SELECT status FROM fir_add WHERE fir_id = ?`;
  db.query(query, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching FIR status', error: err });
    }

    if (results.length > 0) {
      res.status(200).json({ status: results[0].status });
    } else {
      res.status(404).json({ message: 'FIR not found' });
    }
  });
};

exports.updateFirStatus_1 = (req, res) => {
  const { status, firId } = req.body; // Get `status` and `firId` from request body

  // Check if both FIR ID and status are provided
  if (!firId || !status) {
    return res.status(400).json({ message: 'FIR ID and status are required' });
  }

  // Update the status in the database
  const query = `
    UPDATE fir_add
    SET status = ?
    WHERE fir_id = ?
  `;
  const values = [status, firId];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to update FIR status', error: err });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'FIR status updated successfully' });
    } else {
      return res.status(404).json({ message: 'FIR not found' });
    }
  });
};

exports.saveStepSevenAsDraft = (req, res) => {
  const { firId, trialDetails, compensationDetails, attachments, victimsDetails } = req.body;

  if (!firId || !trialDetails || !compensationDetails) {
      return res.status(400).json({ message: "Missing required fields." });
  }

  // console.log(trialDetails);

  // Generate random `case_id` for `case_details`
  const caseId = generateRandomId(8); // Example: Length = 8 characters

  db.beginTransaction((err) => {
      if (err) return res.status(500).json({ message: "Transaction error", error: err });

      // Insert into `case_details` with the generated `case_id`
      const caseDetailsQuery = `
          INSERT INTO case_details (
              fir_id, case_id, court_name, court_district, trial_case_number,
              public_prosecutor, prosecutor_phone, first_hearing_date, judgement_awarded
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const caseDetailsValues = [
          firId,
          caseId,
          trialDetails.courtName,
          trialDetails.courtDistrict,
          trialDetails.trialCaseNumber,
          trialDetails.publicProsecutor,
          trialDetails.prosecutorPhone,
          trialDetails.firstHearingDate,
          trialDetails.judgementAwarded
          
      ];

      db.query(caseDetailsQuery, caseDetailsValues, (err) => {
          if (err) return db.rollback(() => res.status(500).json({ message: "Error saving case details.", error: err }));

          // Insert or Update `fir_trial` Table
          const firTrialQuery = `
              INSERT INTO fir_trial (
                  fir_id, case_id, total_amount_third_stage, proceedings_file_no,
                  proceedings_date, Commissionerate_file
              ) VALUES (?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                  total_amount_third_stage = VALUES(total_amount_third_stage),
                  proceedings_file_no = VALUES(proceedings_file_no),
                  proceedings_date = VALUES(proceedings_date),
                  Commissionerate_file = VALUES(Commissionerate_file)
          `;
          const firTrialValues = [
              firId,
              caseId,
              compensationDetails.totalCompensation,
              compensationDetails.proceedingsFileNo,
              compensationDetails.proceedingsDate,
              compensationDetails.uploadProceedings
          ];

          db.query(firTrialQuery, firTrialValues, (err) => {
              if (err) return db.rollback(() => res.status(500).json({ message: "Error saving fir_trial details.", error: err }));

              // Insert into `trial_relief` Table (Victim Details)
              const victimPromises = victimsDetails.map((victim) => {
                  return new Promise((resolve, reject) => {
                      const trialId = generateRandomId(8); // Generate a random `trial_id` for each victim
                      const victimQuery = `
                          INSERT INTO trial_relief (
                              fir_id, case_id, trial_id, victim_id, victim_name,
                              relief_amount_act, relief_amount_government, relief_amount_final_stage
                          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                      `;
                      const victimValues = [
                          firId,
                          caseId,
                          trialId,
                          victim.victimId,
                          victim.victimName,
                          victim.reliefAmountAct,
                          victim.reliefAmountGovernment,
                          victim.reliefAmountFinalStage
                      ];

                      db.query(victimQuery, victimValues, (err) => (err ? reject(err) : resolve()));
                  });
              });

              // Update `fir_add` Table
              const firAddQuery = `
                  UPDATE fir_add
                  SET nature_of_judgement = ?, judgement_copy = ?
                  WHERE fir_id = ?
              `;
              const firAddValues = [
                  trialDetails.judgementNature,
                  compensationDetails.uploadProceedings,
                  firId
              ];

              db.query(firAddQuery, firAddValues, (err) => {
                  if (err) return db.rollback(() => res.status(500).json({ message: "Error updating fir_add.", error: err }));

                  // Execute Victim Promises
                  Promise.all(victimPromises)
                      .then(() => {
                          db.commit((err) => {
                              if (err) return db.rollback(() => res.status(500).json({ message: "Transaction commit failed.", error: err }));
                              res.status(200).json({ message: "Draft data saved successfully.", caseId });
                          });
                      })
                      .catch((err) => {
                          db.rollback(() => res.status(500).json({ message: "Error saving victim details.", error: err }));
                      });
              });
          });
      });
  });
};

// // Function to Generate Random IDs
// function generateRandomId(length) {
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   let result = '';
//   for (let i = 0; i < length; i++) {
//       result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// }





