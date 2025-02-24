const db = require('../db'); // Make sure the path to the database file is correct
const { v4: uuidv4 } = require('uuid');

const multer = require('multer');
const path = require('path');
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

// exports.getPoliceDivisionDetailsedit = (req, res) => {

//   const query = 'SELECT * FROM police_division';
//   db.query(query, (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to fetch police division data', error: err });
//     }
//     res.json(results);
//   });
// };

exports.getPoliceDivisionDetailsedit = (req, res) => {

  const queryCities = 'SELECT DISTINCT district_division_name FROM police_division';
  const queryZones = 'SELECT DISTINCT police_zone_name FROM police_division';
  const queryRanges = 'SELECT DISTINCT police_range_name FROM police_division';
  const queryDistricts = 'SELECT DISTINCT revenue_district_name FROM police_division';

  // Execute the queries one by one
  db.query(queryCities, (err, district_division_name) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch city data', error: err });
    }
    db.query(queryZones, (err, police_zone_name) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch zone data', error: err });
      }
      db.query(queryRanges, (err, police_range_name) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to fetch range data', error: err });
        }
        db.query(queryDistricts, (err, revenue_district_name) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to fetch district data', error: err });
          }
          res.json({
            district_division_name: district_division_name.map(item => item.district_division_name),
            police_zone_name: police_zone_name.map(item => item.police_zone_name),
            police_range_name: police_range_name.map(item => item.police_range_name),
            revenue_district_name: revenue_district_name.map(item => item.revenue_district_name)
          });
        });
      });
    });
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
    officerName,
    officerDesignation,
    officerPhone,
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

  let {
    firNumber,
    firNumberSuffix,
    dateOfOccurrence,
    timeOfOccurrence,
    placeOfOccurrence,
    dateOfRegistration,
    timeOfRegistration,

  } = firData;

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

  // console.log(isDeceased);

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

        console.log(victim.victimId);
        if (victim.victimId) {

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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          const insertVictimValues = [
            victimId,
            firId,
            victim.name || '',
            victim.age || '',
            victim.gender || '',
            victim.gender === 'Other' ? victim.customGender || null : null,
            victim.mobileNumber || null,
            victim.address || null,
            victim.victimPincode || null,
            victim.community || '',
            victim.caste || '',
            victim.guardianName || '',
            victim.isNativeDistrictSame || '',
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








// exports.handleStepFour = (req, res) => {
//   const { firId, numberOfAccused } = req.body;

//   const uploadedFilePath = req.file ? `/uploads/fir_copy/${req.file.filename}` : null;
//   let accuseds = [];
//   try {
//     accuseds = JSON.parse(req.body.accuseds || '[]');
//   } catch (error) {
//     return res.status(400).json({ message: 'Invalid accuseds data', error: error.message });
//   }

//   if (!firId || !numberOfAccused || !accuseds) {
//     return res.status(400).json({ message: "Missing required fields" });
//   }

//   const updateFirQuery = `
//     UPDATE fir_add
//     SET
//       number_of_accused = ?,
//       upload_fir_copy = ?
//     WHERE fir_id = ?;
//   `;
//   const updateFirValues = [numberOfAccused, uploadedFilePath, firId];

//   db.query(updateFirQuery, updateFirValues, (err) => {
//     if (err) {
//       console.error("Failed to update FIR data:", err);
//       return res.status(500).json({ message: "Failed to update FIR data", error: err.message });
//     }

//     const accusedPromises = accuseds.map((accused) => {
//       return new Promise((resolve, reject) => {
//         if (accused.accusedId) {
//           const updateAccusedQuery = `
//             UPDATE accuseds
//             SET
//               age = ?, name = ?, gender = ?, custom_gender = ?, address = ?, pincode = ?,
//               community = ?, caste = ?, guardian_name = ?, previous_incident = ?,
//               previous_fir_number = ?, previous_fir_number_suffix = ?, scst_offence = ?,
//               scst_fir_number = ?, scst_fir_number_suffix = ?, antecedents = ?, land_o_issues = ?,
//               gist_of_current_case = ?
//             WHERE accused_id = ?;
//           `;
//           const accusedValues = [
//             accused.age,
//             accused.name,
//             accused.gender,
//             accused.gender === 'Other' ? accused.customGender || '' : '', // Add customGender if applicable
//             accused.address,
//             accused.pincode,
//             accused.community,
//             accused.caste,
//             accused.guardianName,
//             accused.previousIncident,
//             accused.previousFIRNumber,
//             accused.previousFIRNumberSuffix,
//             accused.scstOffence,
//             accused.scstFIRNumber,
//             accused.scstFIRNumberSuffix,
//             accused.antecedents,
//             accused.landOIssues,
//             accused.gistOfCurrentCase,
//             accused.accusedId,
//           ];

//           db.query(updateAccusedQuery, accusedValues, (err) => {
//             if (err) return reject(err);
//             resolve({ accusedId: accused.accusedId });
//           });
//         } else {
//           // Insert new accused record
//           const accusedId = generateRandomId(6);
//           const insertAccusedQuery = `
//             INSERT INTO accuseds (
//               accused_id, fir_id, age, name, gender, custom_gender, address, pincode, community, caste,
//               guardian_name, previous_incident, previous_fir_number, previous_fir_number_suffix, scst_offence,
//               scst_fir_number, scst_fir_number_suffix, antecedents, land_o_issues, gist_of_current_case
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
//           `;
//           const accusedValues = [
//             accusedId,
//             firId,
//             accused.age,
//             accused.name,
//             accused.gender,
//             accused.gender === 'Other' ? accused.customGender || '' : '', // Add customGender if applicable
//             accused.address,
//             accused.pincode,
//             accused.community,
//             accused.caste,
//             accused.guardianName,
//             accused.previousIncident,
//             accused.previousFIRNumber,
//             accused.previousFIRNumberSuffix,
//             accused.scstOffence,
//             accused.scstFIRNumber,
//             accused.scstFIRNumberSuffix,
//             accused.antecedents,
//             accused.landOIssues,
//             accused.gistOfCurrentCase,
//           ];

//           db.query(insertAccusedQuery, accusedValues, (err) => {
//             if (err) return reject(err);
//             resolve({ accusedId });
//           });
//         }
//       });
//     });

//     // Wait for all accused records to be processed
//     Promise.all(accusedPromises)
//       .then((results) => {
//         const updatedAccuseds = accuseds.map((accused, index) => ({
//           ...accused,
//           accusedId: results[index].accusedId,
//         }));
//         res.status(200).json({
//           message: "Step 4 data saved successfully",
//           fir_id: firId,
//           accuseds: updatedAccuseds,
//         });
//       })
//       .catch((err) => {
//         console.error("Failed to process accused data:", err);
//         res.status(500).json({ message: "Failed to process accused data", error: err.message });
//       });
//   });
// };

exports.handleStepFour = (req, res) => {
  const { firId, numberOfAccused, accuseds: accusedsRaw } = req.body;

  let accuseds = [];

  try {
    if (typeof accusedsRaw === 'string') {
      accuseds = JSON.parse(accusedsRaw);
    } else if (Array.isArray(accusedsRaw) || typeof accusedsRaw === 'object') {
      accuseds = accusedsRaw;
    } else {
      throw new Error("Invalid format for 'accuseds'");
    }
  } catch (error) {
    console.error("Error parsing accuseds:", error.message);
    return res.status(400).json({ error: "Invalid data format for 'accuseds'" });
  }

  const updateFirQuery = `
    UPDATE fir_add
    SET
      number_of_accused = ?
    WHERE fir_id = ?;
  `;
  const updateFirValues = [numberOfAccused, firId];

  db.query(updateFirQuery, updateFirValues, (err) => {
    if (err) {
      console.error("Failed to update FIR data:", err);
      return res.status(500).json({ message: "Failed to update FIR data", error: err.message });
    }

    const accusedPromises = accuseds.map((accused) => {

      return new Promise((resolve, reject) => {
        if (accused.accusedId) {

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
            accused.gender === 'Other' ? accused.customGender || '' : '',
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
            accused.gender === 'Other' ? accused.customGender || '' : '',
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



// mahi

const storage_step5 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload_step5 = multer({ storage: storage_step5 }).fields([
  { name: 'proceedingsFile', maxCount: 1 },
  { name: 'attachments', maxCount: 10 }
]);
exports.updateStepFive = (req, res) => {
  upload_step5(req, res, (err) => {
    if (err) return res.status(500).json({ message: 'File upload error', error: err });

    const {
      firId,
      totalCompensation,
      proceedingsFileNo,
      proceedingsDate,
    } = req.body;

    const victimsRelief = req.body.victimsRelief ? JSON.parse(req.body.victimsRelief) : [];
    const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].filename : null;
    const attachments = req.files['attachments'] || [];

    if (!firId) {
      return res.status(400).json({ message: 'FIR ID is missing.' });
    }

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ message: 'Transaction error', error: err });

      const updatedData = { victims: [], proceedings: null, attachments: [] };

      const updateVictimPromises = victimsRelief.map((victim) => {
        return new Promise((resolve, reject) => {
          if (!victim.victimId) return resolve();
      
          db.query('SELECT * FROM victim_relief WHERE victim_id = ?', [victim.victimId], (err, existingData) => {
            if (err) return reject({ step: 'fetch_victim_data', error: err });
      
            if (existingData.length === 0) {
              const insertQuery = `
                INSERT INTO victim_relief (victim_id, victim_name, community_certificate, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `;
              const insertValues = [
                victim.victimId,
                victim.victimName,
                victim.communityCertificate,
                victim.reliefAmountScst,
                victim.reliefAmountExGratia,
                victim.reliefAmountFirstStage,
                victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : null,
              ];
      
              db.query(insertQuery, insertValues, (err) => {
                if (err) return reject({ step: 'insert_victim_data', error: err });
      
                // After insertion, fetch the newly inserted data to return it
                db.query('SELECT * FROM victim_relief WHERE victim_id = ?', [victim.victimId], (err, result) => {
                  if (err) return reject({ step: 'select_inserted_victim_relief', error: err });
                  updatedData.victims.push(result[0]);
                  resolve();
                });
              });
            } else {
              const updates = [];
              const values = [];
      
              updates.push('victim_name = ?', 'community_certificate = ?', 'relief_amount_scst = ?', 'relief_amount_exgratia = ?', 'relief_amount_first_stage = ?', 'additional_relief = ?');
              values.push(
                victim.victimName || existingData[0].victim_name,
                victim.communityCertificate || existingData[0].community_certificate,
                victim.reliefAmountScst || existingData[0].relief_amount_scst,
                victim.reliefAmountExGratia || existingData[0].relief_amount_exgratia,
                victim.reliefAmountFirstStage || existingData[0].relief_amount_first_stage,
                victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : existingData[0].additional_relief
              );
      
              const updateQuery = `UPDATE victim_relief SET ${updates.join(', ')} WHERE victim_id = ?`;
              values.push(victim.victimId);
      
              db.query(updateQuery, values, (err) => {
                if (err) return reject({ step: 'update_victim_relief', error: err });
      
                db.query('SELECT * FROM victim_relief WHERE victim_id = ?', [victim.victimId], (err, result) => {
                  if (err) return reject({ step: 'select_updated_victim_relief', error: err });
                  updatedData.victims.push(result[0]);
                  resolve();
                });
              });
            }
          });
        });
      });
      

      const updateProceedingsPromise = new Promise((resolve, reject) => {
        db.query('SELECT * FROM proceedings_victim_relief WHERE fir_id = ?', [firId], (err, existingData) => {
          if (err) return reject({ step: 'fetch_proceedings_data', error: err });

          const updates = [];
          const values = [];

          updates.push('total_compensation = ?', 'proceedings_file_no = ?', 'proceedings_date = ?', 'proceedings_file = ?');
          values.push(
            totalCompensation || existingData[0].total_compensation,
            proceedingsFileNo || existingData[0].proceedings_file_no,
            proceedingsDate || existingData[0].proceedings_date,
            proceedingsFile || existingData[0].proceedings_file
          );

          const updateQuery = `UPDATE proceedings_victim_relief SET ${updates.join(', ')} WHERE fir_id = ?`;
          values.push(firId);

          db.query(updateQuery, values, (err) => {
            if (err) return reject({ step: 'update_proceedings_victim_relief', error: err });

            db.query('SELECT * FROM proceedings_victim_relief WHERE fir_id = ?', [firId], (err, result) => {
              if (err) return reject({ step: 'select_updated_proceedings_victim_relief', error: err });
              updatedData.proceedings = result[0];
              resolve();
            });
          });
        });
      });
      const attachmentPromises = attachments.map((attachment) => {
        return new Promise((resolve, reject) => {
          const attachmentId = generateRandomId(8);
          const insertQuery = `
            INSERT INTO attachment_relief (
              attachment_id, fir_id, file_name, file_path
            ) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              file_name = VALUES(file_name),
              file_path = VALUES(file_path)
          `;

          const values = [
            attachmentId,
            firId,
            attachment.originalname,
            attachment.filename,
          ];

          db.query(insertQuery, values, (err) => {
            if (err) return reject({ step: 'attachment_relief', error: err });

            const selectQuery = 'SELECT * FROM attachment_relief WHERE attachment_id = ?';
            db.query(selectQuery, [attachmentId], (err, result) => {
              if (err) return reject({ step: 'select_attachment_relief', error: err });
              updatedData.attachments.push(result[0]);
              resolve();
            });
          });
        });
      });

      Promise.all([...updateVictimPromises, updateProceedingsPromise,...attachmentPromises])
        .then(() => {
          db.commit((err) => {
            if (err) {
              return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
            }
            res.status(200).json({ message: 'Step 5 data updated successfully.', data: updatedData });
          });
        })
        .catch((err) => {
          db.rollback(() => {
            console.error('Transaction failed at:', err.step, err.error);
            res.status(500).json({ message: `Transaction failed at ${err.step}`, error: err.error });
          });
        });
    });
  });
};




// end mahi



// exports.handleStepFive = (req, res) => {
//   const {
//     firId,
//     victimsRelief,
//     totalCompensation,
//     proceedingsFileNo,
//     proceedingsDate,
//     proceedingsFile,
//     attachments,
//   } = req.body;

//   if (!firId) {
//     return res.status(400).json({ message: 'FIR ID is missing.' });
//   }

//   const generateRandomId = (length = 6) => {
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let result = '';
//     for (let i = 0; i < length; i++) {
//       result += characters.charAt(Math.floor(Math.random() * characters.length));
//     }
//     return result;
//   };

//   db.beginTransaction((err) => {
//     if (err) return res.status(500).json({ message: 'Transaction error', error: err });

//     // Insert or update victimsRelief
//     const victimPromises = victimsRelief.map((victim, index) => {
//       return new Promise((resolve, reject) => {
//         const victimId = victim.victimId || ''; // Use existing victim_id or generate a new one
//         const reliefId = victim.reliefId || generateRandomId(6);

//         const query = `
//           INSERT INTO victim_relief (
//             victim_id, relief_id, fir_id, victim_name, community_certificate,
//             relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//           ON DUPLICATE KEY UPDATE
//             victim_name = VALUES(victim_name),
//             community_certificate = VALUES(community_certificate),
//             relief_amount_scst = VALUES(relief_amount_scst),
//             relief_amount_exgratia = VALUES(relief_amount_exgratia),
//             relief_amount_first_stage = VALUES(relief_amount_first_stage),
//             additional_relief = VALUES(additional_relief)
//         `;
//         const values = [
//           victimId, // Add victim_id here
//           reliefId,
//           firId,
//           victim.victimName || `Victim ${index + 1}`,
//           victim.communityCertificate || 'no',
//           victim.reliefAmountScst || '0.00',
//           victim.reliefAmountExGratia || '0.00',
//           victim.reliefAmountFirstStage || '0.00',
//           JSON.stringify(victim.additionalRelief || []),
//         ];

//         db.query(query, values, (err) => {
//           if (err) return reject(err);
//           resolve();
//         });
//       });
//     });

//     // Insert or update proceedings data
//     const proceedingsPromise = new Promise((resolve, reject) => {
//       const proceedingsId = generateRandomId(6);
//       const query = `
//         INSERT INTO proceedings_victim_relief (
//           proceedings_id, fir_id, total_compensation, proceedings_file_no,
//           proceedings_date, proceedings_file
//         ) VALUES (?, ?, ?, ?, ?, ?)
//         ON DUPLICATE KEY UPDATE
//           total_compensation = VALUES(total_compensation),
//           proceedings_file_no = VALUES(proceedings_file_no),
//           proceedings_date = VALUES(proceedings_date),
//           proceedings_file = VALUES(proceedings_file)
//       `;
//       const values = [
//         proceedingsId,
//         firId,
//         totalCompensation || '0.00',
//         proceedingsFileNo || null,
//         proceedingsDate || null,
//         proceedingsFile || null,
//       ];

//       db.query(query, values, (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });

//     // Insert attachments into the `attachment_relief` table
//     const attachmentPromises = attachments.map((attachment) => {
//       return new Promise((resolve, reject) => {
//         const attachmentId = generateRandomId(8);
//         const query = `
//           INSERT INTO attachment_relief (
//             attachment_id, fir_id, file_name, file_path
//           ) VALUES (?, ?, ?, ?)
//         `;
//         const values = [
//           attachmentId,
//           firId,
//           attachment.fileName || null,
//           attachment.filePath || null,
//         ];

//         db.query(query, values, (err) => {
//           if (err) return reject(err);
//           resolve();
//         });
//       });
//     });

//     // Combine all promises
//     Promise.all([...victimPromises, proceedingsPromise, ...attachmentPromises])
//       .then(() => {
//         db.commit((err) => {
//           if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
//           res.status(200).json({ message: 'Step 5 data saved successfully, including attachments.' });
//         });
//       })
//       .catch((err) => {
//         db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
//       });
//   });
// };


exports.handleStepFive = (req, res) => {
  const {
    firId,
    victimsRelief,
    totalCompensation,
    proceedingsFileNo,
    proceedingsDate,
    proceedingsFile,
    attachments,
  } = req.body;

  // console.log(req.body);
  // console.log(firId);
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
  const protocol = req.protocol;

  const host = req.get('host');

  const domainName = `${protocol}://${host}`;
  let imageUrls = [];
  let judgementUrl = '';

  if (Array.isArray(req.files)) {

    req.files.forEach(file => {
      if (file.fieldname === 'images') {
        const imageUrl = `${domainName}/uploads/fir_data/${req.body.firId}/proceedings/images/${file.filename}`;
        imageUrls.push(imageUrl);
      } else if (file.fieldname === 'uploadJudgement') {
        judgementUrl = `${domainName}/uploads/fir_data/${req.body.firId}/proceedings/judgement/${file.filename}`;
      }
    });

  } else {

    if (req.files['images']) {
      req.files['images'].forEach(file => {
        const imageUrl = `${domainName}/uploads/fir_data/${req.body.firId}/proceedings/images/${file.filename}`;
        imageUrls.push(imageUrl);
      });
    }

    if (req.files['uploadJudgement']) {
      const file = req.files['uploadJudgement'][0];
      judgementUrl = `${domainName}/uploads/fir_data/${req.body.firId}/proceedings/judgement/${file.filename}`;
    }
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Transaction error', error: err });
    let victimPromises = [];
    if (Array.isArray(victimsRelief)) {
      const victimPromises = victimsRelief.map((victim, index) => {
        return new Promise((resolve, reject) => {
          const victimId = victim.victimId || '';
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
    } else {
      console.error("victimsRelief is not an array", victimsRelief);
    }

    const deletequery = `Delete from proceedings_victim_relief where fir_id=?`;
    const deletequeryvalues = [
      firId,
    ];
    db.query(deletequery, deletequeryvalues, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete FIR data', error: err });
      }
    });

    // Insert or update proceedings data
    const proceedingsPromise = new Promise((resolve, reject) => {
      const proceedingsId = generateRandomId(6);
      const query = `
        INSERT INTO proceedings_victim_relief (
          proceedingsId, fir_id, total_compensation, proceedings_file_no,
          proceedings_date, proceedings_file, all_files
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_compensation = VALUES(total_compensation),
          proceedings_file_no = VALUES(proceedings_file_no),
          proceedings_date = VALUES(proceedings_date),
          proceedings_file = VALUES(proceedings_file),
          all_files = VALUES(all_files)
      `;

      const values = [
        proceedingsId,
        firId,
        totalCompensation || '0.00',
        proceedingsFileNo || null,
        proceedingsDate || null,
        judgementUrl || null,
        JSON.stringify(imageUrls) || null,
      ];


      db.query(query, values, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    let attachmentPromises = [];
    // Insert attachments into the `attachment_relief` table
    const attachments = imageUrls;
    attachmentPromises = attachments.map((attachment) => {
      return new Promise((resolve, reject) => {
        const attachmentId = generateRandomId(8);
        const query = `
          INSERT INTO attachment_relief (
             fir_id, file_path
          ) VALUES (?, ?)
        `;
        const values = [
          firId,
          attachment || null,
        ];

        db.query(query, values, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    // Combine all promises
    Promise.all([...victimPromises, proceedingsPromise, attachmentPromises])
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




// exports.handleStepSix = (req, res) => {
//   const {
//     firId,
//     chargesheetDetails,
//     victimsRelief,
//     attachments,
//   } = req.body;


// console.log(firId);


// if (!firId) {
//   return res.status(400).json({ message: 'FIR ID is missing.' });
// }

// const generateRandomId = (length = 8) => {
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   let result = '';
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// };

// db.beginTransaction((err) => {
//   if (err) return res.status(500).json({ message: 'Transaction error', error: err });

//   // Update FIR status in the `fir_add` table
//   const updateFirStatusPromise = new Promise((resolve, reject) => {
//     const query = `
//       UPDATE fir_add
//       SET status = 6
//       WHERE fir_id = ?
//     `;
//     db.query(query, [firId], (err) => {
//       if (err) return reject(err);
//       resolve();
//     });
//   });

//   // Insert or update chargesheet details
//   const chargesheetId = chargesheetDetails.chargesheetId || generateRandomId();
//   const chargesheetPromise = new Promise((resolve, reject) => {
//     const query = `
//       INSERT INTO chargesheet_details (
//         chargesheet_id, fir_id, charge_sheet_filed, court_district,
//         court_name, case_type, case_number, rcs_file_number,
//         rcs_filing_date, mf_copy_path, total_compensation_1,
//         proceedings_file_no, proceedings_date, upload_proceedings_path
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       ON DUPLICATE KEY UPDATE
//         charge_sheet_filed = VALUES(charge_sheet_filed),
//         court_district = VALUES(court_district),
//         court_name = VALUES(court_name),
//         case_type = VALUES(case_type),
//         case_number = VALUES(case_number),
//         rcs_file_number = VALUES(rcs_file_number),
//         rcs_filing_date = VALUES(rcs_filing_date),
//         mf_copy_path = VALUES(mf_copy_path),
//         total_compensation_1 = VALUES(total_compensation_1),
//         proceedings_file_no = VALUES(proceedings_file_no),
//         proceedings_date = VALUES(proceedings_date),
//         upload_proceedings_path = VALUES(upload_proceedings_path)
//     `;
//     const values = [
//       chargesheetId,
//       firId,
//       chargesheetDetails.chargeSheetFiled || null,
//       chargesheetDetails.courtDistrict || null,
//       chargesheetDetails.courtName || null,
//       chargesheetDetails.caseType || null,
//       chargesheetDetails.caseNumber || null,
//       chargesheetDetails.rcsFileNumber || null,
//       chargesheetDetails.rcsFilingDate || null,
//       chargesheetDetails.mfCopyPath || null,
//       chargesheetDetails.totalCompensation || null,
//       chargesheetDetails.proceedingsFileNo || null,
//       chargesheetDetails.proceedingsDate || null,
//       chargesheetDetails.uploadProceedingsPath || null,
//     ];

//     db.query(query, values, (err) => {
//       if (err) return reject(err);
//       resolve();
//     });
//   });

//   // Insert or update victimsRelief
//   const victimPromises = victimsRelief.map((victim, index) => {
//     return new Promise((resolve, reject) => {
//       const victimId = victim.victimId || generateRandomId();
//       console.log('Victim Data:', victim);
//       console.log('Relief Amounts:', {
//         scst: victim.reliefAmountScst,
//         exGratia: victim.reliefAmountExGratia,
//         secondStage: victim.reliefAmountSecondStage,
//       });

//       const query = `
//         INSERT INTO chargesheet_victims ( fir_id,
//           victim_id, chargesheet_id, victim_name,
//           relief_amount_scst_1, relief_amount_ex_gratia_1,
//           relief_amount_second_stage
//         ) VALUES (?, ?, ?, ?, ?, ?,?)
//         ON DUPLICATE KEY UPDATE
//           fir_id = VALUES(fir_id),
//           victim_name = VALUES(victim_name),
//           relief_amount_scst_1 = VALUES(relief_amount_scst_1),
//           relief_amount_ex_gratia_1 = VALUES(relief_amount_ex_gratia_1),
//           relief_amount_second_stage = VALUES(relief_amount_second_stage)
//       `;
//       const values = [
//         firId,
//         victimId,
//         chargesheetId,
//         victim.victimName || `Victim ${index + 1}`,
//         victim.reliefAmountScst || '0.00',
//         victim.reliefAmountExGratia || '0.00',
//         victim.reliefAmountSecondStage || '0.00',
//       ];

//       db.query(query, values, (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });
//   });

//   // Insert attachments
//   const attachmentPromises = attachments.map((attachment) => {
//     return new Promise((resolve, reject) => {
//       const attachmentId = generateRandomId();
//       const query = `
//         INSERT INTO chargesheet_attachments (fir_id,
//           attachment_id, chargesheet_id, file_path
//         ) VALUES (?, ?, ?,?)
//       `;
//       const values = [
//         firId,
//         attachmentId,
//         chargesheetId,
//         attachment.filePath || null,
//       ];

//       db.query(query, values, (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });
//   });

//   // Combine all promises
//   Promise.all([updateFirStatusPromise, chargesheetPromise, ...victimPromises, ...attachmentPromises])
//     .then(() => {
//       db.commit((err) => {
//         if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
//         res.status(200).json({ message: 'Step 6 data saved successfully, and FIR status updated to 6.' });
//       });
//     })
//     .catch((err) => {
//       db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
//     });
// });
// };



// exports.handleStepSix = (req, res) => {
//   const {
//     firId,
//     chargeSheetFiled,
//     courtDistrict,
//     courtName,
//     caseType,
//     caseNumber,
//     rcsFileNumber,
//     rcsFilingDate,
//     mfCopyPath,
//     totalCompensation,
//     proceedingsFileNo,
//     proceedingsDate,
//     victimsRelief,
//     attachments,
//   } = req.body; 

//   console.log(firId);
//   const protocol = req.protocol;

  
//   const host = req.get('host');

//   const domainName = `${protocol}://${host}`;

//   if (!firId) {
//     return res.status(400).json({ message: 'FIR ID is missing.' });
//   }

//   const generateRandomId = (length = 8) => {
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let result = '';
//     for (let i = 0; i < length; i++) {
//       result += characters.charAt(Math.floor(Math.random() * characters.length));
//     }
//     return result;
//   };


//   let imageUrls = [];
//   let judgementUrl = '';
//   if (Array.isArray(req.files)) {
//     // If req.files is an array (like when using .array()), loop through each file
//     req.files.forEach(file => {
//       if (file.fieldname === 'images') {
//         const imageUrl = `${domainName}/uploads/fir_data/${req.body.firId}/chargesheet/images/${file.filename}`;
//         imageUrls.push(imageUrl);
//       } else if (file.fieldname === 'uploadProceedings_1') {
//         judgementUrl = `${domainName}/uploads/fir_data/${req.body.firId}/chargesheet/proceedings/${file.filename}`;
//       }
//     });
//   } else {
//     // If req.files is an object (like when using .fields()), handle each field separately
//     if (req.files['images']) {
//       req.files['images'].forEach(file => {
//         const imageUrl = `${domainName}/uploads/fir_data/${req.body.firId}/chargesheet/images/${file.filename}`;
//         imageUrls.push(imageUrl);
//       });
//     }
  
//     if (req.files['uploadProceedings_1']) {
//       const file = req.files['uploadProceedings_1'][0];  // Assuming only one judgement file
//       judgementUrl = `${domainName}/uploads/fir_data/${req.body.firId}/chargesheet/proceedings/${file.filename}`;
//     }
//   }
  
//   db.beginTransaction((err) => {
//     if (err) return res.status(500).json({ message: 'Transaction error', error: err });

//     // Update FIR status in the `fir_add` table
//     const updateFirStatusPromise = new Promise((resolve, reject) => {
//       const query = `
//         UPDATE fir_add 
//         SET status = 6 
//         WHERE fir_id = ?
//       `;
//       db.query(query, [firId], (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });

//     // console.log(firId);

//     const deletequery = `Delete from chargesheet_details where fir_id=?`;
//     const deletequeryvalues = [ 
//       firId,
//     ];
//     db.query(deletequery, deletequeryvalues, (err) => {
//       if (err) {
//         return res.status(500).json({ message: 'Failed to delete FIR data', error: err });
//       }
      
//     });

//     // Insert or update chargesheet details
//     const chargesheetId = generateRandomId();
//     const chargesheetPromise = new Promise((resolve, reject) => {
//       const query = `
//         INSERT INTO chargesheet_details (
//           chargesheet_id, fir_id, charge_sheet_filed, court_district,
//           court_name, case_type, case_number, rcs_file_number, 
//           rcs_filing_date, mf_copy_path, total_compensation_1, 
//           proceedings_file_no, proceedings_date, upload_proceedings_path,all_files
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
//       const values = [
//         chargesheetId,
//         firId,
//         chargeSheetFiled || null,
//         courtDistrict || null,
//         courtName || null,
//         caseType || null,
//         caseNumber || null,
//         rcsFileNumber || null,
//         rcsFilingDate || null,
//         mfCopyPath || null,
//         totalCompensation || null,
//         proceedingsFileNo || null,
//         proceedingsDate || null,
//         judgementUrl || null,
//         JSON.stringify(imageUrls) || null,
//       ];
//       console.log(values);

//       db.query(query, values, (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });
//     let victimPromises = []; 
    
//     if (Array.isArray(victimsRelief)) {
//     // Insert or update victimsRelief
//     const victimPromises = victimsRelief.map((victim, index) => {
//       return new Promise((resolve, reject) => {
//         const victimId = victim.victimId || generateRandomId();
//         console.log('Victim Data:', victim);
//         console.log('Relief Amounts:', {
//           scst: victim.reliefAmountScst,
//           exGratia: victim.reliefAmountExGratia,
//           secondStage: victim.reliefAmountSecondStage,
//         });

//         const query = `
//           INSERT INTO chargesheet_victims ( fir_id,
//             victim_id, chargesheet_id, victim_name,
//             relief_amount_scst_1, relief_amount_ex_gratia_1,
//             relief_amount_second_stage
//           ) VALUES (?, ?, ?, ?, ?, ?,?)
//           ON DUPLICATE KEY UPDATE
//             fir_id = VALUES(fir_id),
//             victim_name = VALUES(victim_name),
//             relief_amount_scst_1 = VALUES(relief_amount_scst_1),
//             relief_amount_ex_gratia_1 = VALUES(relief_amount_ex_gratia_1),
//             relief_amount_second_stage = VALUES(relief_amount_second_stage)
//         `;
//         const values = [
//           firId,
//           victimId,
//           chargesheetId,
//           victim.victimName || `Victim ${index + 1}`,
//           victim.reliefAmountScst || '0.00',
//           victim.reliefAmountExGratia || '0.00',
//           victim.reliefAmountSecondStage || '0.00',
//         ];

//         db.query(query, values, (err) => {
//           if (err) return reject(err);
//           resolve();
//         });
//       });
//     });
//   }
//   const attachments = imageUrls;
//   let attachmentPromises = [];
//   if (Array.isArray(attachments)) {
//     console.log("sdjfbsjf hsdbfsd fhsbfhsd fhjsdfsd fhsd fh sdhfjs dhf sdhf ");
//     // Insert attachments
//     const attachmentPromises = attachments.map((attachment) => {
//       return new Promise((resolve, reject) => {
//         const attachmentId = generateRandomId();
//         const query = `
//           INSERT INTO chargesheet_attachments (fir_id, chargesheet_id, file_path
//           ) VALUES (?, ?, ?)
//         `;
//         const values = [
//           firId, 
//           chargesheetId,
//           attachment || null,
//         ];

//         db.query(query, values, (err) => {
//           if (err) return reject(err);
//           resolve();
//         });
//       });
//     });
//   } 
//   console.log('Victim Data:', updateFirStatusPromise);
//   console.log('Victim Data:', chargesheetPromise);
//   console.log('Victim Data:', victimPromises);
//   console.log('Victim Data:', attachmentPromises);
//     // Combine all promises
//     Promise.all([updateFirStatusPromise, chargesheetPromise, ...victimPromises, ...attachmentPromises])
//       .then(() => {
//         db.commit((err) => {
//           if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
//           res.status(200).json({ message: 'Step 6 data saved successfully, and FIR status updated to 6.' });
//         });
//       })
//       .catch((err) => {
//         db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
//       });
//   });
// };
const update_step6 = multer({ storage: storage_step5 }).fields([
  { name: 'proceedingsFile', maxCount: 1 },
  { name: 'attachments', maxCount: 10 }
]);
// exports.Update_step6 = (req, res) => {
//   update_step6(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error', error: err });

//     const { firId, chargesheetDetails, chargesheet_id, victimsRelief } = req.body;
//     const parsedChargesheetDetails = JSON.parse(chargesheetDetails);

//     console.log('Parsed chargesheetDetails:', parsedChargesheetDetails);

//     if (!parsedChargesheetDetails || !chargesheet_id) {
//       return res.status(400).json({ message: 'Missing chargesheet details or chargesheet_id.' });
//     }

//     const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].path : null;
//     const attachments = req.files['attachments'] || [];
//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     const generateRandomId = (length = 8) => {
//       const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//       let result = '';
//       for (let i = 0; i < length; i++) {
//         result += characters.charAt(Math.floor(Math.random() * characters.length));
//       }
//       return result;
//     };

//     db.beginTransaction((err) => {
//       if (err) return res.status(500).json({ message: 'Transaction error', error: err });

//     // Update FIR status in the `fir_add` table
//     const updateFirStatusPromise = new Promise((resolve, reject) => {
//       const query = `
//         UPDATE fir_add 
//         SET status = 6 
//         WHERE fir_id = ?
//       `;
//       db.query(query, [firId], (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });

//       const chargesheetId = chargesheet_id;

//       if (!chargesheetId) {
//         return res.status(400).json({ message: 'Chargesheet ID is missing or invalid' });
//       }

//       const chargesheetUpdates = [];
//       const chargesheetValues = [];
      
//       if (parsedChargesheetDetails.chargeSheetFiled) {
//         chargesheetUpdates.push('charge_sheet_filed = ?');
//         chargesheetValues.push(parsedChargesheetDetails.chargeSheetFiled);
//       }
//       if (parsedChargesheetDetails.courtDistrict) {
//         chargesheetUpdates.push('court_district = ?');
//         chargesheetValues.push(parsedChargesheetDetails.courtDistrict);
//       }
//       if (parsedChargesheetDetails.courtName) {
//         chargesheetUpdates.push('court_name = ?');
//         chargesheetValues.push(parsedChargesheetDetails.courtName);
//       }
//       if (parsedChargesheetDetails.caseType) {
//         chargesheetUpdates.push('case_type = ?');
//         chargesheetValues.push(parsedChargesheetDetails.caseType);
//       }
//       if (parsedChargesheetDetails.caseNumber) {
//         chargesheetUpdates.push('case_number = ?');
//         chargesheetValues.push(parsedChargesheetDetails.caseNumber);
//       }
//       if (parsedChargesheetDetails.rcsFileNumber) {
//         chargesheetUpdates.push('rcs_file_number = ?');
//         chargesheetValues.push(parsedChargesheetDetails.rcsFileNumber);
//       }
//       if (parsedChargesheetDetails.rcsFilingDate) {
//         chargesheetUpdates.push('rcs_filing_date = ?');
//         chargesheetValues.push(parsedChargesheetDetails.rcsFilingDate);
//       }
//       if (parsedChargesheetDetails.mfCopyPath) {
//         chargesheetUpdates.push('mf_copy_path = ?');
//         chargesheetValues.push(parsedChargesheetDetails.mfCopyPath);
//       }
//       if (parsedChargesheetDetails.totalCompensation) {
//         chargesheetUpdates.push('total_compensation_1 = ?');
//         chargesheetValues.push(parsedChargesheetDetails.totalCompensation);
//       }
//       if (parsedChargesheetDetails.proceedingsFileNo) {
//         chargesheetUpdates.push('proceedings_file_no = ?');
//         chargesheetValues.push(parsedChargesheetDetails.proceedingsFileNo);
//       }
//       if (parsedChargesheetDetails.proceedingsDate) {
//         chargesheetUpdates.push('proceedings_date = ?');
//         chargesheetValues.push(parsedChargesheetDetails.proceedingsDate);
//       }
//       if (proceedingsFile) {
//         chargesheetUpdates.push('upload_proceedings_path = ?');
//         chargesheetValues.push(proceedingsFile);
//       }

//       const chargesheetPromise = new Promise((resolve, reject) => {
//         const checkQuery = `SELECT upload_proceedings_path FROM chargesheet_details WHERE chargesheet_id = ?`;


//         if (chargesheetUpdates.length > 0) {
//           const query = `
//             UPDATE chargesheet_details
//             SET ${chargesheetUpdates.join(', ')}
//             WHERE chargesheet_id = ?
//           `;
//           db.query(query, [...chargesheetValues, chargesheetId], (err) => {
//             if (err) return reject(err);
//             resolve();
//           });
//         } else {
//           resolve(); 
//         }
//       });
//       let parsedVictimsRelief;
//       try {
//         parsedVictimsRelief = JSON.parse(victimsRelief);
//       } catch (error) {
//         console.error('Error parsing victimsRelief:', error);
//         return res.status(400).json({ message: 'Invalid victimsRelief data format' });
//       }

   
//       const victimPromises = parsedVictimsRelief.map((victim) => {
//         const victimUpdates = [];
//         const victimValues = [];

//         if (victim.victimName) {
//           victimUpdates.push('victim_name = ?');
//           victimValues.push(victim.victimName);
//         }
//         if (victim.reliefAmountScst) {
//           victimUpdates.push('relief_amount_scst_1 = ?');
//           victimValues.push(victim.reliefAmountScst);
//         }
//         if (victim.reliefAmountExGratia) {
//           victimUpdates.push('relief_amount_ex_gratia_1 = ?');
//           victimValues.push(victim.reliefAmountExGratia);
//         }
//         if (victim.reliefAmountSecondStage) {
//           victimUpdates.push('relief_amount_second_stage = ?');
//           victimValues.push(victim.reliefAmountSecondStage);
//         }

//         return new Promise((resolve, reject) => {
//           const query = `
//             UPDATE chargesheet_victims 
//             SET ${victimUpdates.join(', ')}
//             WHERE fir_id = ? AND victim_id = ? AND chargesheet_id = ?
//           `;
//           db.query(query, [...victimValues, firId, victim.victimId, chargesheetId], (err) => {
//             if (err) return reject(err);
//             resolve();
//           });
//         });
//       });

//       const attachmentPromises = attachments.map((attachment) => {
//         return new Promise((resolve, reject) => {
//           const query = `
//             UPDATE chargesheet_attachments 
//             SET file_path = ? 
//             WHERE fir_id = ? AND chargesheet_id = ? AND attachment_id = ?
//           `;
//           const values = [
//             attachment.path || null,
//             firId,
//             chargesheetId,
//             generateRandomId() 
//           ];

//           db.query(query, values, (err) => {
//             if (err) return reject(err);
//             resolve();
//           });
//         });
//       });

//       // Execute all promises
//       Promise.all([updateFirStatusPromise, chargesheetPromise, ...victimPromises, ...attachmentPromises])
//         .then(() => {
//           db.commit((err) => {
//             if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
//             res.status(200).json({ message: 'Step 6 data updated successfully, and FIR status updated to 6.' });
//           });
//         })
//         .catch((err) => {
//           db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
//         });
//     });
//   });
// };



exports.Update_step6 = (req, res) => {
  update_step6(req, res, (err) => {
    if (err) return res.status(500).json({ message: 'File upload error', error: err });

    const { firId, chargesheetDetails, chargesheet_id, victimsRelief } = req.body;

    if (!firId) {
      return res.status(400).json({ message: 'FIR ID is missing.' });
    }

    if (!chargesheetDetails || !chargesheet_id) {
      return res.status(400).json({ message: 'Missing chargesheet details or chargesheet_id.' });
    }

    let parsedChargesheetDetails;
    try {
      parsedChargesheetDetails = JSON.parse(chargesheetDetails);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid chargesheetDetails format', error });
    }

    let parsedVictimsRelief;
    try {
      parsedVictimsRelief = JSON.parse(victimsRelief);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid victimsRelief data format', error });
    }

    const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].path : null;
    const attachments = req.files['attachments'] || [];

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ message: 'Transaction error', error: err });

      // Update FIR status
      const updateFirStatusPromise = new Promise((resolve, reject) => {
        const query = `UPDATE fir_add SET status = 6 WHERE fir_id = ?`;
        db.query(query, [firId], (err) => (err ? reject(err) : resolve()));
      });

      const chargesheetId = chargesheet_id;

      const chargesheetUpdates = [];
      const chargesheetValues = [];

      if (parsedChargesheetDetails.chargeSheetFiled) {
        chargesheetUpdates.push('charge_sheet_filed = ?');
        chargesheetValues.push(parsedChargesheetDetails.chargeSheetFiled);
      }
      if (parsedChargesheetDetails.courtDistrict) {
        chargesheetUpdates.push('court_district = ?');
        chargesheetValues.push(parsedChargesheetDetails.courtDistrict);
      }
      if (parsedChargesheetDetails.courtName) {
        chargesheetUpdates.push('court_name = ?');
        chargesheetValues.push(parsedChargesheetDetails.courtName);
      }
      if (parsedChargesheetDetails.caseType) {
        chargesheetUpdates.push('case_type = ?');
        chargesheetValues.push(parsedChargesheetDetails.caseType);
      }
      if (parsedChargesheetDetails.caseNumber) {
        chargesheetUpdates.push('case_number = ?');
        chargesheetValues.push(parsedChargesheetDetails.caseNumber);
      }
      if (parsedChargesheetDetails.rcsFileNumber) {
        chargesheetUpdates.push('rcs_file_number = ?');
        chargesheetValues.push(parsedChargesheetDetails.rcsFileNumber);
      }
      if (parsedChargesheetDetails.rcsFilingDate) {
        chargesheetUpdates.push('rcs_filing_date = ?');
        chargesheetValues.push(parsedChargesheetDetails.rcsFilingDate);
      }
      if (parsedChargesheetDetails.mfCopyPath) {
        chargesheetUpdates.push('mf_copy_path = ?');
        chargesheetValues.push(parsedChargesheetDetails.mfCopyPath);
      }
      if (parsedChargesheetDetails.totalCompensation) {
        chargesheetUpdates.push('total_compensation_1 = ?');
        chargesheetValues.push(parsedChargesheetDetails.totalCompensation);
      }
      if (parsedChargesheetDetails.proceedingsFileNo) {
        chargesheetUpdates.push('proceedings_file_no = ?');
        chargesheetValues.push(parsedChargesheetDetails.proceedingsFileNo);
      }
      if (parsedChargesheetDetails.proceedingsDate) {
        chargesheetUpdates.push('proceedings_date = ?');
        chargesheetValues.push(parsedChargesheetDetails.proceedingsDate);
      }

      const chargesheetPromise = new Promise((resolve, reject) => {
        if (chargesheetUpdates.length > 0) {
          const query = `UPDATE chargesheet_details SET ${chargesheetUpdates.join(', ')} WHERE chargesheet_id = ?`;
          db.query(query, [...chargesheetValues, chargesheetId], (err) => (err ? reject(err) : resolve()));
        } else {
          resolve();
        }
      });

      // Check if upload_proceedings_path exists
      const proceedingsFilePromise = new Promise((resolve, reject) => {
        if (!proceedingsFile) return resolve();

        const checkQuery = `SELECT upload_proceedings_path FROM chargesheet_details WHERE chargesheet_id = ?`;

        db.query(checkQuery, [chargesheetId], (err, results) => {
          if (err) return reject(err);

          const updateQuery = `
            UPDATE chargesheet_details 
            SET upload_proceedings_path = ? 
            WHERE chargesheet_id = ?
          `;
          db.query(updateQuery, [proceedingsFile, chargesheetId], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      // Update victims details
      const victimPromises = parsedVictimsRelief.map((victim) => {
        const victimUpdates = [];
        const victimValues = [];

        if (victim.victimName) {
          victimUpdates.push('victim_name = ?');
          victimValues.push(victim.victimName);
        }
        if (victim.reliefAmountScst) {
          victimUpdates.push('relief_amount_scst_1 = ?');
          victimValues.push(victim.reliefAmountScst);
        }
        if (victim.reliefAmountExGratia) {
          victimUpdates.push('relief_amount_ex_gratia_1 = ?');
          victimValues.push(victim.reliefAmountExGratia);
        }
        if (victim.reliefAmountSecondStage) {
          victimUpdates.push('relief_amount_second_stage = ?');
          victimValues.push(victim.reliefAmountSecondStage);
        }

        return new Promise((resolve, reject) => {
          const query = `
            UPDATE chargesheet_victims 
            SET ${victimUpdates.join(', ')}
            WHERE fir_id = ? AND victim_id = ? AND chargesheet_id = ?
          `;
          db.query(query, [...victimValues, firId, victim.victimId, chargesheetId], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      // Update attachments
      const attachmentPromises = attachments.map((attachment) => {
        return new Promise((resolve, reject) => {
          const query = `
            UPDATE chargesheet_attachments 
            SET file_path = ? 
            WHERE fir_id = ? AND chargesheet_id = ? AND attachment_id = ?
          `;
          const values = [
            attachment.path || null,
            firId,
            chargesheetId,
            attachment.filename || Math.random().toString(36).substr(2, 9),
          ];

          db.query(query, values, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      // Execute all promises
      Promise.all([updateFirStatusPromise, chargesheetPromise, proceedingsFilePromise, ...victimPromises, ...attachmentPromises])
        .then(() => {
          db.commit((err) => {
            if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
            res.status(200).json({ message: 'Step 6 data updated successfully, and FIR status updated to 6.' });
          });
        })
        .catch((err) => {
          db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
        });
    });
  });
};




exports.getPoliceStations = (req, res) => {
  const { district } = req.query;
  const query = 'SELECT station_name FROM police_stations WHERE city_or_district = ?';

  db.query(query, [district], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch police stations', error: err });
    }
    res.json(results.map(row => row.station_name));
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
exports.getAllCastes = (req, res) => {
  const query = 'SELECT caste_name FROM caste_community';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch caste names', error: err });
    }
    res.json(results);
  });
};

exports.removechargesheetrelief = (req, res) => {
  const { id } = req.query;
  console.log(id);
  const deletequery = `Delete from attachment_relief where id=?`;
  const deletequeryvalues = [
    id,
  ];
  db.query(deletequery, deletequeryvalues, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete FIR data', error: err });
    }
    return res.status(200).json({ status: true, message: "Deleted Successfully" });
  });
}

exports.removechargesheet = (req, res) => {
  const { id } = req.query;
  console.log(id);
  const deletequery = `Delete from chargesheet_attachments where id=?`;
  const deletequeryvalues = [
    id,
  ];
  db.query(deletequery, deletequeryvalues, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete FIR data', error: err });
    }
    return res.status(200).json({ status: true, message: "Deleted Successfully" });
  });
}

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



exports.getFirDetailsFirEdit = async (req, res) => {
  const { fir_id } = req.query;

  if (!fir_id) {
    return res.status(400).json({ message: 'FIR ID is required.' });
  }

  try {
    // Query 1: Fetch FIR details
    const firDetails = await queryDb(`SELECT * FROM fir_add WHERE fir_id = ?`, [fir_id]);

    // Query 2: Fetch Victim details
    const victims = await queryDb(`SELECT * FROM victims WHERE fir_id = ?`, [fir_id]);

    // Query 3: Fetch Accused details
    const accuseds = await queryDb(`SELECT * FROM accuseds WHERE fir_id = ?`, [fir_id]);

    // Query 4: Fetch Proceedings details
    const proceedingsQuery = `
      SELECT 
        cd.fir_id,
        cd.total_compensation,
        cd.proceedings_file_no,
        cd.proceedings_file,
        cd.proceedings_date
      FROM 
        proceedings_victim_relief cd
      LEFT JOIN 
        attachment_relief ca ON cd.fir_id = ca.fir_id
      WHERE 
        cd.fir_id = ?
      GROUP BY
        cd.fir_id,
        cd.total_compensation,
        cd.proceedings_file_no,
        cd.proceedings_file,
        cd.proceedings_date
    `;
    const proceedings = await queryDb(proceedingsQuery, [fir_id]);

    // Query 5: Fetch Chargesheet details
    const chargesheetQuery = `
      SELECT  
        cd.fir_id,
        cd.charge_sheet_filed,
        cd.court_district,
        cd.court_name,
        cd.case_type,
        cd.case_number,
        cd.rcs_file_number,
        cd.rcs_filing_date,
        cd.mf_copy_path,
        cd.total_compensation_1,
        cd.proceedings_file_no,
        cd.proceedings_date,
        cd.upload_proceedings_path
      FROM 
        chargesheet_details cd
      LEFT JOIN 
        chargesheet_attachments ca ON cd.fir_id = ca.fir_id
      WHERE 
        cd.fir_id = ?
      GROUP BY
        cd.fir_id, 
        cd.charge_sheet_filed, 
        cd.court_district,
        cd.court_name, 
        cd.case_type, 
        cd.case_number, 
        cd.rcs_file_number,
        cd.rcs_filing_date, 
        cd.mf_copy_path, 
        cd.total_compensation_1, 
        cd.proceedings_file_no, 
        cd.proceedings_date, 
        cd.upload_proceedings_path
    `;
    const chargesheetDetails = await queryDb(chargesheetQuery, [fir_id]);

    // Query 6: Fetch Case details
    const caseDetails = await queryDb(`SELECT * FROM case_details WHERE fir_id = ?`, [fir_id]);

    // Respond with all the data
    return res.status(200).json({
      data: firDetails[0],
      data1: victims,
      data2: accuseds,
      data3: proceedings[0],
      data4: chargesheetDetails[0],
      data5: caseDetails,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching FIR details.', error: err });
  }
};

// Helper function to execute queries using Promises
function queryDb(query, params) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}




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

exports.editStepSevenAsDraft = (req, res) => {

  const {
    firId,
    case_id,
    Court_name,
    courtDistrict1,
    caseNumber,
    publicProsecutor,
    prosecutorPhone,
    firstHearingDate,
    judgementAwarded,

    case_id1,
    Court_one,
    courtDistrict_one,
    caseNumber_one,
    publicProsecutor_one,
    prosecutorPhone_one,
    firstHearingDate_one,
    judgementAwarded_one,

    case_id2,
    Court_three,
    courtDistrict_two,
    caseNumber_two,
    publicProsecutor_two,
    prosecutorPhone_two,
    firstHearingDate_two,
    judgementAwarded_two,

  } = req.body;


  if (case_id) {
    db.query(
      'UPDATE fir_details SET Court_name = ?, court_district = ?, trial_case_number = ?, public_prosecutor = ?, prosecutor_phone = ?,first_hearing_date = ?,judgement_awarded = ? WHERE fir_id = ? AND case_id = ?',
      [Court_name, courtDistrict1, caseNumber, publicProsecutor, prosecutorPhone, firstHearingDate, judgementAwarded, firId, case_id]
    )

      .then(() => {
        if (case_id1) {
          return db.query(
            'UPDATE fir_details SET Court_name = ?, court_district = ?, trial_case_number = ?, public_prosecutor = ?, prosecutor_phone = ?,first_hearing_date = ?,judgement_awarded = ? WHERE fir_id = ? AND case_id = ?',
            [Court_one, courtDistrict_one, caseNumber_one, publicProsecutor_one, prosecutorPhone_one, firstHearingDate_one, judgementAwarded_one, firId, case_id1]
          )
        }
      })
      .then(() => {
        if (case_id2) {
          db.query(
            'UPDATE fir_details SET Court_name = ?, court_district = ?, trial_case_number = ?, public_prosecutor = ?, prosecutor_phone = ?,first_hearing_date = ?,judgement_awarded = ? WHERE fir_id = ? AND case_id = ?',
            [Court_three, courtDistrict_two, caseNumber_two, publicProsecutor_two, prosecutorPhone_two, firstHearingDate_two, judgementAwarded_two, firId, case_id2]
          )
        }
      })
      .then(() => {
        res.status(200).json({ success: true, message: 'FIR details updated successfully' });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update FIR details' });
      });
  }

}

const storage_step7 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where files will be stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = uniqueSuffix + path.extname(file.originalname);
    cb(null, newFilename);
  }
});

const upload_step7 = multer({ storage: storage_step7 }).array('attachments', 10);

exports.saveEditStepSevenAsDraft = (req, res) => {
  console.log(req.body);

  const {
    firId, trialDetails, trialDetails_one, trialDetails_two, compensationDetails, attachments,
    appealDetails, appealDetailsOne, caseAppealDetailsTwo, hearingdetail,compensationDetails_1,compensationDetails_2
  } = req.body;

  const ogId = firId.replace(/(^")|("$)/g, '');

  const parseJSON = (data) => {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return {};
    }
  };
  const parsedHearingDetails = parseJSON(hearingdetail);
  const parsedTrialDetails = parseJSON(trialDetails);
  const parsedTrialDetailsOne = parseJSON(trialDetails_one);
  const parsedTrialDetailsTwo = parseJSON(trialDetails_two);
  const parsedCompensationDetails = parseJSON(compensationDetails);
  const parsedAppealDetails = parseJSON(appealDetails);
  const parsedAppealDetailsOne = parseJSON(appealDetailsOne);
  const parsedCaseAppealDetailsTwo = parseJSON(caseAppealDetailsTwo);

  const parsedCompensationDetails_1 = parseJSON(compensationDetails_1);
  const parsedCompensationDetails_2 = parseJSON(compensationDetails_2);

  if (!ogId) {
    return res.status(400).json({ message: 'Missing required firId field.' });
  }

  db.beginTransaction(async (err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ message: 'Transaction error', error: err });
    }

    try {
   
      const existingCaseDetails = await queryAsync('SELECT * FROM case_details WHERE fir_id = ?', [ogId]);

      if (existingCaseDetails.length > 0) {
        await queryAsync(`
          UPDATE case_details SET
            court_name = ?,
            court_district = ?,
            trial_case_number = ?,
            public_prosecutor = ?,
            prosecutor_phone = ?,
            first_hearing_date = ?,
            judgement_awarded = ?,
            CaseHandledBy = ?,
            NameOfAdvocate = ?,
            advocateMobNumber = ?,
            judgementAwarded1 = ?
          WHERE fir_id = ?
        `, [
          parsedTrialDetails.courtName,
          parsedTrialDetails.courtDistrict,
          parsedTrialDetails.trialCaseNumber,
          parsedTrialDetails.publicProsecutor,
          parsedTrialDetails.prosecutorPhone,
          parsedTrialDetails.firstHearingDate,
          parsedTrialDetails.judgementAwarded,
          parsedTrialDetails.CaseHandledBy,
          parsedTrialDetails.NameOfAdvocate,
          parsedTrialDetails.advocateMobNumber,
          parsedTrialDetails.judgementAwarded1,
          ogId,
        ]);
      } else {
        await queryAsync(`
          INSERT INTO case_details (fir_id, court_name, court_district, trial_case_number, public_prosecutor, prosecutor_phone, first_hearing_date, judgement_awarded, CaseHandledBy, NameOfAdvocate, advocateMobNumber, judgementAwarded1)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ogId,
          parsedTrialDetails.courtName,
          parsedTrialDetails.courtDistrict,
          parsedTrialDetails.trialCaseNumber,
          parsedTrialDetails.publicProsecutor,
          parsedTrialDetails.prosecutorPhone,
          parsedTrialDetails.firstHearingDate,
          parsedTrialDetails.judgementAwarded,
          parsedTrialDetails.CaseHandledBy,
          parsedTrialDetails.NameOfAdvocate,
          parsedTrialDetails.advocateMobNumber,
          parsedTrialDetails.judgementAwarded1,
        ]);
      }

    

const existingCaseCourtDetailOne = await queryAsync('SELECT * FROM case_court_detail_one WHERE fir_id = ?', [ogId]);

if (existingCaseCourtDetailOne.length > 0) {
  await queryAsync(`
    UPDATE case_court_detail_one SET
    fir_id = ?,
      court_name = ?,
      court_district = ?,
      case_number = ?,
      public_prosecutor = ?,
      prosecutor_phone = ?,
      second_hearing_date = ?,
      judgement_awarded = ?,
      judgementNature = ?
  
    WHERE fir_id = ?
  `, [
    ogId,
    parsedTrialDetailsOne.courtName,
    parsedTrialDetailsOne.courtDistrict,
    parsedTrialDetailsOne.trialCaseNumber,
    parsedTrialDetailsOne.publicProsecutor,
    parsedTrialDetailsOne.prosecutorPhone,
    parsedTrialDetailsOne.firstHearingDate,
    parsedTrialDetailsOne.judgementAwarded,
    parsedTrialDetailsOne.judgementNature,
  
    ogId
  ]);
} else {
  await queryAsync(`
    INSERT INTO case_court_detail_one (
      fir_id, court_name, court_district, case_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    ogId,
    parsedTrialDetailsOne.courtName,
    parsedTrialDetailsOne.courtDistrict,
    parsedTrialDetailsOne.trialCaseNumber,
    parsedTrialDetailsOne.publicProsecutor,
    parsedTrialDetailsOne.prosecutorPhone,
    parsedTrialDetailsOne.firstHearingDate,
    parsedTrialDetailsOne.judgementAwarded,
    parsedTrialDetailsOne.judgementNature,

  ]);
}


const existingCaseCourtDetailTwo = await queryAsync('SELECT * FROM case_court_details_two WHERE fir_id = ?', [ogId]);

if (existingCaseCourtDetailTwo.length > 0) {
  await queryAsync(`
    UPDATE case_court_details_two SET
    fir_id = ?,
      court_name = ?,
      court_district = ?,
      case_number = ?,
      public_prosecutor = ?,
      prosecutor_phone = ?,
      second_hearing_date = ?,
      judgement_awarded = ?,
      judgementNature = ?

    WHERE fir_id = ?
  `, [
    ogId,
    parsedTrialDetailsTwo.courtName,
    parsedTrialDetailsTwo.courtDistrict,
    parsedTrialDetailsTwo.trialCaseNumber,
    parsedTrialDetailsTwo.publicProsecutor,
    parsedTrialDetailsTwo.prosecutorPhone,
    parsedTrialDetailsTwo.firstHearingDate,
    parsedTrialDetailsTwo.judgementAwarded,
    parsedTrialDetailsTwo.judgementNature,

    ogId
  ]);
} else {
  await queryAsync(`
    INSERT INTO case_court_details_two (
      fir_id, court_name, court_district, case_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    ogId,
    parsedTrialDetailsTwo.courtName,
    parsedTrialDetailsTwo.courtDistrict,
    parsedTrialDetailsTwo.trialCaseNumber,
    parsedTrialDetailsTwo.publicProsecutor,
    parsedTrialDetailsTwo.prosecutorPhone,
    parsedTrialDetailsTwo.firstHearingDate,
    parsedTrialDetailsTwo.judgementAwarded,
    parsedTrialDetailsTwo.judgementNature,

  ]);
}


      await queryAsync(`
        UPDATE fir_add SET
          nature_of_judgement = COALESCE(?, nature_of_judgement),
          judgement_copy = COALESCE(?, judgement_copy)
        WHERE fir_id = ?
      `, [parsedTrialDetails.judgementNature, parsedTrialDetails.uploadJudgement, ogId]);

      await queryAsync(`
        INSERT INTO fir_trial (fir_id, total_amount_third_stage, proceedings_file_no, proceedings_date, Commissionerate_file)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_amount_third_stage = VALUES(total_amount_third_stage),
          proceedings_file_no = VALUES(proceedings_file_no),
          proceedings_date = VALUES(proceedings_date),
          Commissionerate_file = VALUES(Commissionerate_file)
      `, [
        ogId,
        parsedCompensationDetails.totalCompensation,
        parsedCompensationDetails.proceedingsFileNo,
        parsedCompensationDetails.proceedingsDate,
        parsedCompensationDetails.uploadProceedings,
      ]);


      const existingCompensation = await queryAsync(
        'SELECT * FROM compensation_details WHERE fir_id = ? AND case_id = ?',
        [ogId, parsedCompensationDetails_1.caseId]
    );
    
    if (existingCompensation.length > 0) {
        await queryAsync(`
            UPDATE compensation_details 
            SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, upload_proceedings = ?
            WHERE fir_id = ? AND case_id = ?
        `, [
            parsedCompensationDetails_1.totalCompensation,
            parsedCompensationDetails_1.proceedingsFileNo,
            parsedCompensationDetails_1.proceedingsDate,
            parsedCompensationDetails_1.uploadProceedings,
            ogId,
            parsedCompensationDetails_1.caseId
        ]);
    } else {
        await queryAsync(`
            INSERT INTO compensation_details 
                (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            ogId,
            parsedCompensationDetails_1.caseId,
            parsedCompensationDetails_1.totalCompensation,
            parsedCompensationDetails_1.proceedingsFileNo,
            parsedCompensationDetails_1.proceedingsDate,
            parsedCompensationDetails_1.uploadProceedings
        ]);
    }
    
      const existingCompensation1 = await queryAsync(
        'SELECT * FROM compensation_details_1 WHERE fir_id = ? AND case_id = ?',
        [ogId, parsedCompensationDetails_1.caseId]
    );
    
    if (existingCompensation1.length > 0) {
  
        await queryAsync(`
            UPDATE compensation_details_1 
            SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, upload_proceedings = ?
            WHERE fir_id = ? AND case_id = ?
        `, [
            parsedCompensationDetails_1.totalCompensation,
            parsedCompensationDetails_1.proceedingsFileNo,
            parsedCompensationDetails_1.proceedingsDate,
            parsedCompensationDetails_1.uploadProceedings,
            ogId,
            parsedCompensationDetails_1.caseId
        ]);
    } else {
      
        await queryAsync(`
            INSERT INTO compensation_details_1 
                (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            ogId,
            parsedCompensationDetails_1.caseId,
            parsedCompensationDetails_1.totalCompensation,
            parsedCompensationDetails_1.proceedingsFileNo,
            parsedCompensationDetails_1.proceedingsDate,
            parsedCompensationDetails_1.uploadProceedings
        ]);
    }
    

    const existingCompensation2 = await queryAsync(
        'SELECT * FROM compensation_details_2 WHERE fir_id = ? AND case_id = ?',
        [ogId, parsedCompensationDetails_2.caseId]
    );
    
    if (existingCompensation2.length > 0) {
     
        await queryAsync(`
            UPDATE compensation_details_2 
            SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, upload_proceedings = ?
            WHERE fir_id = ? AND case_id = ?
        `, [
            parsedCompensationDetails_2.totalCompensation,
            parsedCompensationDetails_2.proceedingsFileNo,
            parsedCompensationDetails_2.proceedingsDate,
            parsedCompensationDetails_2.uploadProceedings,
            ogId,
            parsedCompensationDetails_2.caseId
        ]);
    } else {
       
        await queryAsync(`
            INSERT INTO compensation_details_2 
                (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            ogId,
            parsedCompensationDetails_2.caseId,
            parsedCompensationDetails_2.totalCompensation,
            parsedCompensationDetails_2.proceedingsFileNo,
            parsedCompensationDetails_2.proceedingsDate,
            parsedCompensationDetails_2.uploadProceedings
        ]);
    }
    
      
      const appealTables = [
        { table: 'appeal_details', data: parsedAppealDetails },
        { table: 'appeal_details_one', data: parsedAppealDetailsOne },
        { table: 'case_appeal_details_two', data: parsedCaseAppealDetailsTwo },
      ];
      
      for (const { table, data } of appealTables) {
        if (data) {
       
          const existingRecord = await queryAsync(`SELECT * FROM ${table} WHERE fir_id = ?`, [ogId]);
          console.log('ogId:', ogId);
      
          if (existingRecord.length > 0) {
          
            await queryAsync(`DELETE FROM ${table} WHERE fir_id = ?`, [ogId]);
          }
      
       
          await queryAsync(
            `
            INSERT INTO ${table} (fir_id, legal_opinion_obtained, case_fit_for_appeal, government_approval_for_appeal, filed_by, designated_court, judgementNature)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
            [
              ogId,
              data.legal_opinion_obtained,
              data.case_fit_for_appeal,
              data.government_approval_for_appeal,
              data.filed_by,
              data.designated_court,
              data.judgementNature,
            ]
          );
        }
      }
      
      
  
      const hearingTables = {
        hearingDetails: 'hearing_details_one',
        hearingDetails_one: 'hearing_details_two',
        hearingDetails_two: 'hearing_details_three',
      };
      
      for (const key in parsedHearingDetails) {
        const tableData = parsedHearingDetails[key];
        const tableName = hearingTables[key];
      
        if (!Array.isArray(tableData) || tableData.length === 0) {
          console.warn(`Skipping key "${key}" because it has no valid data.`);
          continue;
        }
      
        if (!tableName) {
          console.warn(`Skipping key "${key}" as no table is mapped.`);
          continue;
        }
      
        try {
          await queryAsync(`DELETE FROM ${tableName} WHERE fir_id = ?`, [ogId]);
          console.log(`Cleared existing data for fir_id: ${ogId} in ${tableName}`);
        } catch (error) {
          console.error(`Failed to clear existing data for fir_id: ${ogId} in ${tableName}`, error);
          continue;
        }
      
        for (const entry of tableData) {
          let suffix = '';
      
          if (key === 'hearingDetails_one') {
            suffix = '_one';
          } else if (key === 'hearingDetails_two') {
            suffix = '_two';
          }
      
          const nextHearingDate = entry[`nextHearingDate${suffix}`] || null;
          const reasonNextHearing = entry[`reasonNextHearing${suffix}`] || null;
      
          if (!nextHearingDate && !reasonNextHearing) {
            console.warn(`Skipping empty record for table "${tableName}"`);
            continue;
          }
      
          try {
            await queryAsync(
              `INSERT INTO ${tableName} (fir_id, next_hearing_date, reason_next_hearing) 
               VALUES (?, ?, ?)`,
              [ogId, nextHearingDate, reasonNextHearing]
            );
            console.log(`Inserted record into ${tableName}: ${nextHearingDate}, ${reasonNextHearing}`);
          } catch (error) {
            console.error(`Database error for table "${tableName}":`, error);
          }
        }
      }
      
      
      
      

      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          await queryAsync(`
            INSERT INTO case_attachments (fir_id, file_name)
            VALUES (?, ?)
          `, [ogId, attachment]);
        }
      }

      db.commit((err) => {
        if (err) {
          db.rollback(() => res.status(500).json({ message: 'Transaction commit error', error: err }));
        }
        res.status(200).json({ message: 'Step 7 updated successfully.' });
      });
    } catch (error) {
      db.rollback(() => res.status(500).json({ message: 'Transaction failed', error }));
    }
  });
};




const queryAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};






