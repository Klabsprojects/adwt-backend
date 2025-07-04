const db = require('../db'); // Make sure the path to the database file is correct
const { v4: uuidv4 } = require('uuid');
const util = require('util');

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
      return res.status(500).json({ message: 'Failed to fetch user data' });
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
      return res.status(500).json({ message: 'Failed to fetch police division data' });
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
      return res.status(500).json({ message: 'Failed to fetch city data' });
    }
    db.query(queryZones, (err, police_zone_name) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch zone data' });
      }
      db.query(queryRanges, (err, police_range_name) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to fetch range data' });
        }
        db.query(queryDistricts, (err, revenue_district_name) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to fetch district data' });
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
      return res.status(500).json({ message: 'Failed to save FIR'});
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
      return res.status(500).json({ message: 'Failed to update FIR for step 2' });
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
      return res.status(500).json({ message: 'Failed to update FIR data'});
    }

    const victimPromises = victims.map((victim) => {
      return new Promise((resolve, reject) => {

        // console.log(victim.victimId);
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
        res.status(500).json({ message: 'Failed to process victim data' });
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
      return res.status(500).json({ message: "Failed to update FIR data" });
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
        res.status(500).json({ message: "Failed to process accused data" });
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
      return res.status(500).json({ message: 'Transaction error' });
    }

    // Execute the first query
    db.query(getNumberOfVictimsQuery, [firId], (err, numberOfVictimsResult) => {
      if (err) {
        db.rollback(() => {
          return res.status(500).json({ message: 'Failed to retrieve number of victims' });
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
            return res.status(500).json({ message: 'Failed to retrieve victim names' });
          });
        }

        // Commit the transaction if both queries succeed
        db.commit((err) => {
          if (err) {
            db.rollback(() => {
              return res.status(500).json({ message: 'Transaction commit error' });
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
      return res.status(500).json({ message: 'Failed to update FIR status' });
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
// exports.updateStepFive = (req, res) => {
//   upload_step5(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error', error: err });

//     const { firId, totalCompensation, proceedingsFileNo, proceedingsDate } = req.body;
//     const victimsRelief = req.body.victimsRelief ? JSON.parse(req.body.victimsRelief) : [];
//     const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].filename : null;
//     const attachments = req.files['attachments'] || [];




//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     db.beginTransaction(async (err) => {
//       if (err) return res.status(500).json({ message: 'Transaction error', error: err });

//       try {
//         const updatedData = { victims: [], proceedings: null, attachments: [] };

//         // Update or insert victim relief data
//         for (const victim of victimsRelief) {
//           if (!victim.victimId) continue;

//           const [existingData] = await db.promise().query('SELECT * FROM victim_relief WHERE victim_id = ?', [victim.victimId]);

//           if (existingData.length === 0) {
//             const insertQuery = `INSERT INTO victim_relief (victim_id, victim_name, community_certificate, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief)
//               VALUES (?, ?, ?, ?, ?, ?, ?)`;
//             const insertValues = [
//               victim.victimId,
//               victim.victimName,
//               victim.communityCertificate,
//               victim.reliefAmountScst,
//               victim.reliefAmountExGratia,
//               victim.reliefAmountFirstStage,
//               victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : null,
//             ];

//             await db.promise().query(insertQuery, insertValues);
//           } else {
//             const updateQuery = `UPDATE victim_relief SET victim_name = ?, community_certificate = ?, relief_amount_scst = ?, relief_amount_exgratia = ?, relief_amount_first_stage = ?, additional_relief = ? WHERE victim_id = ?`;
//             const updateValues = [
//               victim.victimName || existingData[0].victim_name,
//               victim.communityCertificate || existingData[0].community_certificate,
//               victim.reliefAmountScst || existingData[0].relief_amount_scst,
//               victim.reliefAmountExGratia || existingData[0].relief_amount_exgratia,
//               victim.reliefAmountFirstStage || existingData[0].relief_amount_first_stage,
//               victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : existingData[0].additional_relief,
//               victim.victimId,
//             ];
//             await db.promise().query(updateQuery, updateValues);
//           }
//         }

//         // Update proceedings data
//         const [existingProceedings] = await db.promise().query('SELECT * FROM proceedings_victim_relief WHERE fir_id = ?', [firId]);
//         if (existingProceedings.length > 0) {
//           const updateProceedingsQuery = `UPDATE proceedings_victim_relief SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, proceedings_file = ? WHERE fir_id = ?`;
//           const updateProceedingsValues = [
//             totalCompensation || existingProceedings[0].total_compensation,
//             proceedingsFileNo || existingProceedings[0].proceedings_file_no,
//             proceedingsDate || existingProceedings[0].proceedings_date,
//             proceedingsFile || existingProceedings[0].proceedings_file,
//             firId,
//           ];
//           await db.promise().query(updateProceedingsQuery, updateProceedingsValues);
//         }



//         let filename = req.body.attachments;
//         let attachmentFromBody = [];


//         if (Array.isArray(filename)) {
//             attachmentFromBody = filename.map(url => url.split('/').pop());
//         } else if (typeof filename === 'string') {
//             attachmentFromBody = [filename.split('/').pop()]; 
//         }


//         if (attachmentFromBody.length > 0) {
//             for (const filePath of attachmentFromBody) {
//                 const [existingAttachment] = await db.promise().query(
//                     'SELECT * FROM attachment_relief WHERE fir_id = ? AND file_path = ?',
//                     [firId, filePath]
//                 );


//                 if (existingAttachment.length > 0) {
//                     updatedData.attachments.push(existingAttachment[0]);
//                 }
//             }


//             const placeholders = attachmentFromBody.map(() => '?').join(',');

//             if (placeholders.length > 0) { 
//                 await db.promise().query(
//                     `DELETE FROM attachment_relief WHERE fir_id = ? AND file_path NOT IN (${placeholders})`,
//                     [firId, ...attachmentFromBody]
//                 );
//             }
//         }



//         for (const attachment of attachments) {
//           const [existingAttachment] = await db.promise().query('SELECT * FROM attachment_relief WHERE fir_id = ? AND file_path = ?', [firId, attachment.filename]);
//           const attachmentId = existingAttachment.length > 0 ? existingAttachment[0].attachment_id : generateRandomId(8);

//           if (attachment.originalname) {
//             const insertQuery = `INSERT INTO attachment_relief (attachment_id, fir_id, file_name, file_path)
//               VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_path = VALUES(file_path)`;
//             await db.promise().query(insertQuery, [attachmentId, firId, attachment.originalname, attachment.filename]);
//           } else {
//             const updateQuery = `UPDATE attachment_relief SET file_path = ? WHERE attachment_id = ?`;
//             await db.promise().query(updateQuery, [attachment.filename, attachmentId]);
//           }
//         }

//         await db.promise().commit();
//         res.status(200).json({ message: 'Step 5 data updated successfully.', data: updatedData });
//       } catch (error) {
//         await db.promise().rollback();
//         console.error('Transaction failed:', error);
//         res.status(500).json({ message: 'Transaction failed', error });
//       }
//     });
//   });
// };

// modify for attachemnt
// exports.updateStepFive = (req, res) => {
//   upload_step5(req, res, async (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error', error: err });

//     const { firId, totalCompensation, proceedingsFileNo, proceedingsDate } = req.body;
//     const victimsRelief = req.body.victimsRelief ? JSON.parse(req.body.victimsRelief) : [];
//     const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].filename : null;
//     const attachments = req.files['attachments'] || [];
//     const reliefId = generateRandomId(6);

//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     const connection = await db.promise().getConnection();
//     try {
//       await connection.beginTransaction();

//       const updatedData = { victims: [], proceedings: null, attachments: [] };

//       // Insert or update victim_relief
//       for (const victim of victimsRelief) {
//         if (!victim.victimId) continue;

//         console.log(victim.victimId)
//         const [existingData] = await connection.query('SELECT * FROM victim_relief WHERE victim_id = ?', [victim.victimId]);
//         console.log(existingData)

//         if (existingData.length === 0) {
//           const insertQuery = `INSERT INTO victim_relief (victim_id, fir_id, relief_id, victim_name, community_certificate, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief)
//               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//           const insertValues = [
//             victim.victimId,
//             firId,
//             reliefId,
//             victim.victimName,
//             victim.communityCertificate,
//             victim.reliefAmountScst,
//             victim.reliefAmountExGratia,
//             victim.reliefAmountFirstStage,
//             victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : null,
//           ];

//           await connection.query(insertQuery, insertValues);
//         } else {
//           const updateQuery = `UPDATE victim_relief SET victim_name = ?, community_certificate = ?, relief_amount_scst = ?, relief_amount_exgratia = ?, relief_amount_first_stage = ?, additional_relief = ? WHERE id = ?`;
//           const updateValues = [
//             victim.victimName || existingData[0].victim_name,
//             victim.communityCertificate || existingData[0].community_certificate,
//             victim.reliefAmountScst !== undefined ? parseInt(victim.reliefAmountScst) || null : existingData[0].relief_amount_scst,
//             victim.reliefAmountExGratia !== undefined ? parseInt(victim.reliefAmountExGratia) || null : existingData[0].relief_amount_exgratia,
//             victim.reliefAmountFirstStage !== undefined ? parseInt(victim.reliefAmountFirstStage) || null : existingData[0].relief_amount_first_stage,
//             victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : existingData[0].additional_relief,
//             existingData[0].id,
//           ];
//           console.log(updateQuery);
//           console.log(updateValues);
//           await connection.query(updateQuery, updateValues);
//         }
//       }

//       // Update proceedings
//       const [existingProceedings] = await connection.query('SELECT * FROM proceedings_victim_relief WHERE fir_id = ?', [firId]);
//       if (existingProceedings.length > 0) {
//         const updateProceedingsQuery = `UPDATE proceedings_victim_relief SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, proceedings_file = ? WHERE fir_id = ?`;
//         const updateProceedingsValues = [
//           totalCompensation || existingProceedings[0].total_compensation,
//           proceedingsFileNo || existingProceedings[0].proceedings_file_no,
//           proceedingsDate || existingProceedings[0].proceedings_date,
//           proceedingsFile || existingProceedings[0].proceedings_file,
//           firId,
//         ];
//         await connection.query(updateProceedingsQuery, updateProceedingsValues);
//       } else {
//         // Insert new record
//         const proceedingsId = generateRandomId(6);
//         const insertProceedingsQuery = `
//           INSERT INTO proceedings_victim_relief (fir_id,proceedings_id, total_compensation, proceedings_file_no, proceedings_date, proceedings_file) 
//           VALUES (?, ?, ?, ?, ?, ?)`;
//         const insertProceedingsValues = [
//           firId,
//           proceedingsId,
//           totalCompensation || null,
//           proceedingsFileNo || null,
//           proceedingsDate || null,
//           proceedingsFile || null,
//         ];
//         await connection.query(insertProceedingsQuery, insertProceedingsValues);
//       }

//       // Existing attachments from body
//       let filename = req.body.attachments;
//       let attachmentFromBody = [];

//       if (Array.isArray(filename)) {
//         attachmentFromBody = filename.map(url => url.split('/').pop());
//       } else if (typeof filename === 'string') {
//         attachmentFromBody = [filename.split('/').pop()];
//       }

//       if (attachmentFromBody.length > 0) {
//         for (const filePath of attachmentFromBody) {
//           const [existingAttachment] = await connection.query(
//             'SELECT * FROM attachment_relief WHERE fir_id = ? AND file_path = ?',
//             [firId, filePath]
//           );

//           if (existingAttachment.length > 0) {
//             updatedData.attachments.push(existingAttachment[0]);
//           }
//         }

//         const placeholders = attachmentFromBody.map(() => '?').join(',');
//         if (placeholders.length > 0) {
//           await connection.query(
//             `DELETE FROM attachment_relief WHERE fir_id = ? AND file_path NOT IN (${placeholders})`,
//             [firId, ...attachmentFromBody]
//           );
//         }
//       }

//       // New file uploads
//       for (const attachment of attachments) {
//         const [existingAttachment] = await connection.query(
//           'SELECT * FROM attachment_relief WHERE fir_id = ? AND file_path = ?',
//           [firId, attachment.filename]
//         );
//         const attachmentId = existingAttachment.length > 0 ? existingAttachment[0].attachment_id : generateRandomId(8);

//         if (attachment.originalname) {
//           const insertQuery = `INSERT INTO attachment_relief (attachment_id, fir_id, file_name, file_path)
//             VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_path = VALUES(file_path)`;
//           await connection.query(insertQuery, [attachmentId, firId, attachment.originalname, attachment.filename]);
//         } else {
//           const updateQuery = `UPDATE attachment_relief SET file_path = ? WHERE attachment_id = ?`;
//           await connection.query(updateQuery, [attachment.filename, attachmentId]);
//         }
//       }

//       await connection.commit();
//       res.status(200).json({ message: 'Step 5 data updated successfully.', data: updatedData });
//     } catch (error) {
//       await connection.rollback();
//       console.error('Transaction failed:', error);
//       res.status(500).json({ message: 'Transaction failed', error });
//     } finally {
//       connection.release();
//     }
//   });
// };



// exports.updateStepFive = (req, res) => {
//   upload_step5(req, res, async (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error', error: err });

//     const { firId, totalCompensation, proceedingsFileNo, proceedingsDate , status, HascaseMF} = req.body;
//     const victimsRelief = req.body.victimsRelief ? req.body.victimsRelief : [];
//     const proceedingsFile = req.body.proceedingsFile ? req.body.proceedingsFile : null;
//     const attachments = req.body.attachments || [];
//     const reliefId = generateRandomId(6);

//     // console.log(req.body)

//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     const connection = await db.promise().getConnection();
//     try {
//       await connection.beginTransaction();

//       const updatedData = { victims: [], proceedings: null, attachments: [] };

//       // Insert or update victim_relief

//       await connection.query('UPDATE fir_add SET HascaseMF = ? WHERE fir_id = ?', [HascaseMF,firId]);
//       for (const victim of victimsRelief) {
//         if (!victim.victimId) continue;

//         // console.log(victim.victimId)
//         const [existingData] = await connection.query('SELECT * FROM victim_relief WHERE victim_id = ?', [victim.victimId]);
//         // console.log(existingData)

//         if (existingData.length === 0) {
//           console.log('enter victim relief')
//           const insertQuery = `INSERT INTO victim_relief (victim_id, fir_id, relief_id, victim_name, community_certificate, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief)
//               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//           const insertValues = [
//             victim.victimId,
//             firId,
//             reliefId,
//             victim.victimName,
//             victim.communityCertificate,
//             victim.reliefAmountScst,
//             victim.reliefAmountExGratia,
//             victim.reliefAmountFirstStage,
//             victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : null,
//           ];

//           await connection.query(insertQuery, insertValues);
//         } else {
//           // console.log('update victim relief')
//           const updateQuery = `UPDATE victim_relief SET victim_name = ?, community_certificate = ?, relief_amount_scst = ?, relief_amount_exgratia = ?, relief_amount_first_stage = ?, additional_relief = ? WHERE id = ?`;
//           const updateValues = [
//             victim.victimName || existingData[0].victim_name,
//             victim.communityCertificate || existingData[0].community_certificate,
//             victim.reliefAmountScst !== undefined ? parseInt(victim.reliefAmountScst) || null : existingData[0].relief_amount_scst,
//             victim.reliefAmountExGratia !== undefined ? parseInt(victim.reliefAmountExGratia) || null : existingData[0].relief_amount_exgratia,
//             victim.reliefAmountFirstStage !== undefined ? parseInt(victim.reliefAmountFirstStage) || null : existingData[0].relief_amount_first_stage,
//             victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : existingData[0].additional_relief,
//             existingData[0].id,
//           ];
//           // console.log(updateQuery);
//           // console.log(updateValues);
//           await connection.query(updateQuery, updateValues);
//         }
//       }

//       // Update proceedings
//       const [existingProceedings] = await connection.query('SELECT * FROM proceedings_victim_relief WHERE fir_id = ?', [firId]);
//       if (existingProceedings.length > 0) {
//         // console.log('enter proceedings_victim_relief')
//         const updateProceedingsQuery = `UPDATE proceedings_victim_relief SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, proceedings_file = ? WHERE fir_id = ?`;
//         const updateProceedingsValues = [
//           totalCompensation || existingProceedings[0].total_compensation,
//           proceedingsFileNo || existingProceedings[0].proceedings_file_no,
//           proceedingsDate || existingProceedings[0].proceedings_date,
//           proceedingsFile || null,
//           firId,
//         ];
//         await connection.query(updateProceedingsQuery, updateProceedingsValues);
//       } else {
//         // console.log('update proceedings_victim_relief')
//         // Insert new record
//         const proceedingsId = generateRandomId(6);
//         const insertProceedingsQuery = `
//           INSERT INTO proceedings_victim_relief (fir_id,proceedings_id, total_compensation, proceedings_file_no, proceedings_date, proceedings_file) 
//           VALUES (?, ?, ?, ?, ?, ?)`;
//         const insertProceedingsValues = [
//           firId,
//           proceedingsId,
//           totalCompensation || null,
//           proceedingsFileNo || null,
//           proceedingsDate || null,
//           proceedingsFile || null,
//         ];
//         await connection.query(insertProceedingsQuery, insertProceedingsValues);
//       }

//       if(attachments && attachments.length > 0){
//         await connection.query('DELETE FROM attachment_relief WHERE fir_id = ?', [firId]);

//         for (const attachment of attachments) {
//         const attachmentQuery = `
//           INSERT INTO attachment_relief (fir_id, file_path) 
//           VALUES (?, ?)`;
//         const attachmentvalues = [
//           firId,
//           attachment
//         ];
//         await connection.query(attachmentQuery, attachmentvalues);
//       }
//       } else {
//         await connection.query('DELETE FROM attachment_relief WHERE fir_id = ?', [firId]);
//       }

//       if(status){
//       await queryAsync(`
//       UPDATE fir_add SET
//         status = COALESCE(?, status)
//       WHERE fir_id = ?
//     `, [status , firId]);

//       }

//       await connection.commit();
//       res.status(200).json({ message: 'Step 5 data updated successfully.'});
//     } catch (error) {
//       await connection.rollback();
//       console.error('Transaction failed:', error);
//       res.status(500).json({ message: 'Transaction failed', error });
//     } finally {
//       connection.release();
//     }
//   });
// };


exports.updateStepFive = (req, res) => {
  upload_step5(req, res, async (err) => {
    if (err) return res.status(500).json({ message: 'File upload error' });

    const { firId, totalCompensation, proceedingsFileNo, proceedingsDate, status, HascaseMF, victimsRelief = [], proceedingsFile = null, attachments = [] } = req.body;
    const reliefId = generateRandomId(6);

    if (!firId) return res.status(400).json({ message: 'FIR ID is missing.' });

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('UPDATE fir_add SET HascaseMF = ? WHERE fir_id = ?', [HascaseMF, firId]);

      for (const victim of victimsRelief) {
        if (!victim.victimId) continue;

        const [existingData] = await connection.query('SELECT id FROM victim_relief WHERE victim_id = ?', [victim.victimId]);

        const fields = [
          victim.victimName,
          victim.communityCertificate,
          victim.reliefAmountScst ? parseInt(victim.reliefAmountScst) : null,
          victim.reliefAmountExGratia ? parseInt(victim.reliefAmountExGratia) : null,
          victim.reliefAmountFirstStage ? parseInt(victim.reliefAmountFirstStage) : null,
          victim.additionalRelief ? JSON.stringify(victim.additionalRelief) : null
        ];

        if (existingData.length === 0) {
          await connection.query(
            `INSERT INTO victim_relief (victim_id, fir_id, relief_id, victim_name, community_certificate, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [victim.victimId, firId, reliefId, ...fields]
          );
        } else {
          await connection.query(
            `UPDATE victim_relief SET victim_name = ?, community_certificate = ?, relief_amount_scst = ?, relief_amount_exgratia = ?, relief_amount_first_stage = ?, additional_relief = ? WHERE id = ?`,
            [...fields, existingData[0].id]
          );
        }
      }

      const [existingProceedings] = await connection.query('SELECT proceedings_id FROM proceedings_victim_relief WHERE fir_id = ?', [firId]);
      if (existingProceedings.length > 0) {
        await connection.query(
          `UPDATE proceedings_victim_relief SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, proceedings_file = ? WHERE fir_id = ?`,
          [totalCompensation, proceedingsFileNo, proceedingsDate, proceedingsFile, firId]
        );
      } else {
        const proceedingsId = generateRandomId(6);
        await connection.query(
          `INSERT INTO proceedings_victim_relief (fir_id, proceedings_id, total_compensation, proceedings_file_no, proceedings_date, proceedings_file) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [firId, proceedingsId, totalCompensation, proceedingsFileNo, proceedingsDate, proceedingsFile]
        );
      }

      await connection.query('DELETE FROM attachment_relief WHERE fir_id = ?', [firId]);
      if (attachments.length > 0) {
        const attachmentInsert = attachments.map(file => [firId, file]);
        await connection.query('INSERT INTO attachment_relief (fir_id, file_path) VALUES ?', [attachmentInsert]);
      }

      if (status) {
        await connection.query(`UPDATE fir_add SET status = COALESCE(?, status) WHERE fir_id = ?`, [status, firId]);
      }

      await connection.commit();
      res.status(200).json({ message: 'Step 5 data updated successfully.' });
    } catch (error) {
      await connection.rollback();
      console.error('Transaction failed:', error);
      res.status(500).json({ message: 'Transaction failed' });
    } finally {
      connection.release();
    }
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
    if (err) return res.status(500).json({ message: 'Transaction error' });
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
        return res.status(500).json({ message: 'Failed to delete FIR data'});
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
          if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error'}));
          res.status(200).json({ message: 'Step 5 data saved successfully, including attachments.' });
        });
      })
      .catch((err) => {
        db.rollback(() => res.status(500).json({ message: 'Transaction failed'}));
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
//   if (err) return res.status(500).json({ message: 'Transaction error'});

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
//         if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error'}));
//         res.status(200).json({ message: 'Step 6 data saved successfully, and FIR status updated to 6.' });
//       });
//     })
//     .catch((err) => {
//       db.rollback(() => res.status(500).json({ message: 'Transaction failed'}));
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
//     if (err) return res.status(500).json({ message: 'Transaction error'});

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
//         return res.status(500).json({ message: 'Failed to delete FIR data'});
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
//           if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error'}));
//           res.status(200).json({ message: 'Step 6 data saved successfully, and FIR status updated to 6.' });
//         });
//       })
//       .catch((err) => {
//         db.rollback(() => res.status(500).json({ message: 'Transaction failed'}));
//       });
//   });
// };
const update_step6 = multer({ storage: storage_step5 }).fields([
  { name: 'proceedingsFile', maxCount: 1 },
  { name: 'attachments', maxCount: 10 }
]);
// exports.Update_step6 = (req, res) => {
//   update_step6(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error'});

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
//       if (err) return res.status(500).json({ message: 'Transaction error'});

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
//             if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error'}));
//             res.status(200).json({ message: 'Step 6 data updated successfully, and FIR status updated to 6.' });
//           });
//         })
//         .catch((err) => {
//           db.rollback(() => res.status(500).json({ message: 'Transaction failed'}));
//         });
//     });
//   });
// };


// command by surya for reference
// exports.Update_step6 = (req, res) => {
//   update_step6(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error'});

//     const { firId, chargesheetDetails, chargesheet_id, victimsRelief } = req.body;

//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     if (!chargesheetDetails || !chargesheet_id) {
//       return res.status(400).json({ message: 'Missing chargesheet details or chargesheet_id.' });
//     }

//     let parsedChargesheetDetails;
//     try {
//       parsedChargesheetDetails = JSON.parse(chargesheetDetails);
//     } catch (error) {
//       return res.status(400).json({ message: 'Invalid chargesheetDetails format', error });
//     }

//     let parsedVictimsRelief;
//     try {
//       parsedVictimsRelief = JSON.parse(victimsRelief);
//     } catch (error) {
//       return res.status(400).json({ message: 'Invalid victimsRelief data format', error });
//     }

//     const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].path : null;
//     const attachments = req.files['attachments'] || [];

//     db.beginTransaction((err) => {
//       if (err) return res.status(500).json({ message: 'Transaction error'});

//       // Update FIR status
//       const updateFirStatusPromise = new Promise((resolve, reject) => {
//         const query = `UPDATE fir_add SET status = 6 WHERE fir_id = ?`;
//         db.query(query, [firId], (err) => (err ? reject(err) : resolve()));
//       });

//       const chargesheetId = chargesheet_id;

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

//       const chargesheetPromise = new Promise((resolve, reject) => {
//         if (chargesheetUpdates.length > 0) {
//           const query = `UPDATE chargesheet_details SET ${chargesheetUpdates.join(', ')} WHERE chargesheet_id = ?`;
//           db.query(query, [...chargesheetValues, chargesheetId], (err) => (err ? reject(err) : resolve()));
//         } else {
//           resolve();
//         }
//       });

//       // Check if upload_proceedings_path exists
//       const proceedingsFilePromise = new Promise((resolve, reject) => {
//         if (!proceedingsFile) return resolve();

//         const checkQuery = `SELECT upload_proceedings_path FROM chargesheet_details WHERE chargesheet_id = ?`;

//         db.query(checkQuery, [chargesheetId], (err, results) => {
//           if (err) return reject(err);

//           const updateQuery = `
//             UPDATE chargesheet_details 
//             SET upload_proceedings_path = ? 
//             WHERE chargesheet_id = ?
//           `;
//           db.query(updateQuery, [proceedingsFile, chargesheetId], (err) => {
//             if (err) return reject(err);
//             resolve();
//           });
//         });
//       });

//       // Update victims details
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

//       // Update attachments
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
//             attachment.filename || Math.random().toString(36).substr(2, 9),
//           ];

//           db.query(query, values, (err) => {
//             if (err) return reject(err);
//             resolve();
//           });
//         });
//       });

//       // Execute all promises
//       Promise.all([updateFirStatusPromise, chargesheetPromise, proceedingsFilePromise, ...victimPromises, ...attachmentPromises])
//         .then(() => {
//           db.commit((err) => {
//             if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error'}));
//             res.status(200).json({ message: 'Step 6 data updated successfully, and FIR status updated to 6.' });
//           });
//         })
//         .catch((err) => {
//           db.rollback(() => res.status(500).json({ message: 'Transaction failed'}));
//         });
//     });
//   });
// };


//disble for modifing adopt update and insert 
// exports.Update_step6 = (req, res) => {
//   update_step6(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error'});

//     const { firId, chargesheetDetails, chargesheet_id, victimsRelief } = req.body;

//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     if (!chargesheetDetails || !chargesheet_id) {
//       return res.status(400).json({ message: 'Missing chargesheet details or chargesheet_id.' });
//     }

//     let parsedChargesheetDetails;
//     try {
//       parsedChargesheetDetails = JSON.parse(chargesheetDetails);
//     } catch (error) {
//       return res.status(400).json({ message: 'Invalid chargesheetDetails format', error });
//     }

//     let parsedVictimsRelief;
//     try {
//       parsedVictimsRelief = JSON.parse(victimsRelief);
//     } catch (error) {
//       return res.status(400).json({ message: 'Invalid victimsRelief data format', error });
//     }

//     const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].path : null;
//     const attachments = req.files['attachments'] || [];

//     db.getConnection((err, connection) => {
//       if (err) return res.status(500).json({ message: 'Connection error'});

//       connection.beginTransaction((err) => {
//         if (err) {
//           connection.release();
//           return res.status(500).json({ message: 'Transaction error'});
//         }

//         const updateFirStatusPromise = new Promise((resolve, reject) => {
//           const query = `UPDATE fir_add SET status = 6 WHERE fir_id = ?`;
//           connection.query(query, [firId], (err) => (err ? reject(err) : resolve()));
//         });

//         const chargesheetId = chargesheet_id;

//         const chargesheetUpdates = [];
//         const chargesheetValues = [];

//         if (parsedChargesheetDetails.chargeSheetFiled) {
//           chargesheetUpdates.push('charge_sheet_filed = ?');
//           chargesheetValues.push(parsedChargesheetDetails.chargeSheetFiled);
//         }
//         if (parsedChargesheetDetails.courtDistrict) {
//           chargesheetUpdates.push('court_district = ?');
//           chargesheetValues.push(parsedChargesheetDetails.courtDistrict);
//         }
//         if (parsedChargesheetDetails.courtName) {
//           chargesheetUpdates.push('court_name = ?');
//           chargesheetValues.push(parsedChargesheetDetails.courtName);
//         }
//         if (parsedChargesheetDetails.caseType) {
//           chargesheetUpdates.push('case_type = ?');
//           chargesheetValues.push(parsedChargesheetDetails.caseType);
//         }
//         if (parsedChargesheetDetails.caseNumber) {
//           chargesheetUpdates.push('case_number = ?');
//           chargesheetValues.push(parsedChargesheetDetails.caseNumber);
//         }
//         if (parsedChargesheetDetails.rcsFileNumber) {
//           chargesheetUpdates.push('rcs_file_number = ?');
//           chargesheetValues.push(parsedChargesheetDetails.rcsFileNumber);
//         }
//         if (parsedChargesheetDetails.rcsFilingDate) {
//           chargesheetUpdates.push('rcs_filing_date = ?');
//           chargesheetValues.push(parsedChargesheetDetails.rcsFilingDate);
//         }
//         if (parsedChargesheetDetails.chargeSheetDate) {
//           chargesheetUpdates.push('chargesheetDate = ?');
//           chargesheetValues.push(parsedChargesheetDetails.chargeSheetDate);
//         }
//         // console.log(parsedChargesheetDetails.chargeSheetDate)
//         if (parsedChargesheetDetails.mfCopyPath) {
//           chargesheetUpdates.push('mf_copy_path = ?');
//           chargesheetValues.push(parsedChargesheetDetails.mfCopyPath);
//         }
//         if (parsedChargesheetDetails.totalCompensation) {
//           chargesheetUpdates.push('total_compensation_1 = ?');
//           chargesheetValues.push(parsedChargesheetDetails.totalCompensation);
//         }
//         if (parsedChargesheetDetails.proceedingsFileNo) {
//           chargesheetUpdates.push('proceedings_file_no = ?');
//           chargesheetValues.push(parsedChargesheetDetails.proceedingsFileNo);
//         }
//         if (parsedChargesheetDetails.proceedingsDate) {
//           chargesheetUpdates.push('proceedings_date = ?');
//           chargesheetValues.push(parsedChargesheetDetails.proceedingsDate);
//         }


//         const chargesheetPromise = new Promise((resolve, reject) => {
//           if (chargesheetUpdates.length > 0) {
//             const query = `UPDATE chargesheet_details SET ${chargesheetUpdates.join(', ')} WHERE chargesheet_id = ?`;
//             connection.query(query, [...chargesheetValues, chargesheetId], (err) => (err ? reject(err) : resolve()));
//             // console.log(query,chargesheetValues,chargesheetId)
//           } else {
//             resolve();
//           }
//         });

//         const proceedingsFilePromise = new Promise((resolve, reject) => {
//           if (!proceedingsFile) return resolve();

//           const checkQuery = `SELECT upload_proceedings_path FROM chargesheet_details WHERE chargesheet_id = ?`;

//           connection.query(checkQuery, [chargesheetId], (err, results) => {
//             if (err) return reject(err);

//             const updateQuery = `
//               UPDATE chargesheet_details 
//               SET upload_proceedings_path = ? 
//               WHERE chargesheet_id = ?
//             `;
//             connection.query(updateQuery, [proceedingsFile, chargesheetId], (err) => {
//               if (err) return reject(err);
//               resolve();
//             });
//           });
//         });

//         const victimPromises = parsedVictimsRelief.map((victim) => {
//           const victimUpdates = [];
//           const victimValues = [];

//           if (victim.victimName) {
//             victimUpdates.push('victim_name = ?');
//             victimValues.push(victim.victimName);
//           }
//           if (victim.reliefAmountScst) {
//             victimUpdates.push('relief_amount_scst_1 = ?');
//             victimValues.push(victim.reliefAmountScst);
//           }
//           if (victim.reliefAmountExGratia) {
//             victimUpdates.push('relief_amount_ex_gratia_1 = ?');
//             victimValues.push(victim.reliefAmountExGratia);
//           }
//           if (victim.reliefAmountSecondStage) {
//             victimUpdates.push('relief_amount_second_stage = ?');
//             victimValues.push(victim.reliefAmountSecondStage);
//           }

//           return new Promise((resolve, reject) => {
//             const query = `
//               UPDATE chargesheet_victims 
//               SET ${victimUpdates.join(', ')}
//               WHERE fir_id = ? AND victim_id = ? AND chargesheet_id = ?
//             `;
//             connection.query(query, [...victimValues, firId, victim.victimId, chargesheetId], (err) => {
//               if (err) return reject(err);
//               resolve();
//             });
//           });
//         });

//         const attachmentPromises = attachments.map((attachment) => {
//           return new Promise((resolve, reject) => {
//             const query = `
//               UPDATE chargesheet_attachments 
//               SET file_path = ? 
//               WHERE fir_id = ? AND chargesheet_id = ? AND attachment_id = ?
//             `;
//             const values = [
//               attachment.path || null,
//               firId,
//               chargesheetId,
//               attachment.filename || Math.random().toString(36).substr(2, 9),
//             ];

//             connection.query(query, values, (err) => {
//               if (err) return reject(err);
//               resolve();
//             });
//           });
//         });

//         Promise.all([
//           updateFirStatusPromise,
//           chargesheetPromise,
//           proceedingsFilePromise,
//           ...victimPromises,
//           ...attachmentPromises
//         ])
//           .then(() => {
//             connection.commit((err) => {
//               if (err) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   res.status(500).json({ message: 'Commit error'});
//                 });
//               }
//               connection.release();
//               res.status(200).json({ message: 'Step 6 data updated successfully, and FIR status updated to 6.' });
//             });
//           })
//           .catch((err) => {
//             connection.rollback(() => {
//               connection.release();
//               res.status(500).json({ message: 'Transaction failed'});
//             });
//           });
//       });
//     });
//   });
// };


// exports.Update_step6 = (req, res) => {
//   update_step6(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error'});

//     const { firId, chargesheetDetails, chargesheet_id, victimsRelief } = req.body;

//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     if (!chargesheetDetails || !chargesheet_id) {
//       return res.status(400).json({ message: 'Missing chargesheet details or chargesheet_id.' });
//     }

//     let parsedChargesheetDetails;
//     try {
//       parsedChargesheetDetails = JSON.parse(chargesheetDetails);
//     } catch (error) {
//       return res.status(400).json({ message: 'Invalid chargesheetDetails format', error });
//     }

//     let parsedVictimsRelief;
//     try {
//       parsedVictimsRelief = JSON.parse(victimsRelief);
//     } catch (error) {
//       return res.status(400).json({ message: 'Invalid victimsRelief data format', error });
//     }

//     const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].path : null;
//     const attachments = req.files['attachments'] || [];

//     db.getConnection((err, connection) => {
//       if (err) return res.status(500).json({ message: 'Connection error'});

//       connection.beginTransaction((err) => {
//         if (err) {
//           connection.release();
//           return res.status(500).json({ message: 'Transaction error'});
//         }

//         const updateFirStatusPromise = new Promise((resolve, reject) => {
//           const query = `UPDATE fir_add SET status = 6 WHERE fir_id = ?`;
//           connection.query(query, [firId], (err) => (err ? reject(err) : resolve()));
//         });

//         const chargesheetId = chargesheet_id;

//         const chargesheetUpdates = [];
//         const chargesheetValues = [];

//         if (parsedChargesheetDetails.chargeSheetFiled) {
//           chargesheetUpdates.push('charge_sheet_filed = ?');
//           chargesheetValues.push(parsedChargesheetDetails.chargeSheetFiled);
//         }
//         if (parsedChargesheetDetails.courtDistrict) {
//           chargesheetUpdates.push('court_district = ?');
//           chargesheetValues.push(parsedChargesheetDetails.courtDistrict);
//         }
//         if (parsedChargesheetDetails.courtName) {
//           chargesheetUpdates.push('court_name = ?');
//           chargesheetValues.push(parsedChargesheetDetails.courtName);
//         }
//         if (parsedChargesheetDetails.caseType) {
//           chargesheetUpdates.push('case_type = ?');
//           chargesheetValues.push(parsedChargesheetDetails.caseType);
//         }
//         if (parsedChargesheetDetails.caseNumber) {
//           chargesheetUpdates.push('case_number = ?');
//           chargesheetValues.push(parsedChargesheetDetails.caseNumber);
//         }
//         if (parsedChargesheetDetails.rcsFileNumber) {
//           chargesheetUpdates.push('rcs_file_number = ?');
//           chargesheetValues.push(parsedChargesheetDetails.rcsFileNumber);
//         }
//         if (parsedChargesheetDetails.rcsFilingDate) {
//           chargesheetUpdates.push('rcs_filing_date = ?');
//           chargesheetValues.push(parsedChargesheetDetails.rcsFilingDate);
//         }
//         if (parsedChargesheetDetails.chargeSheetDate) {
//           chargesheetUpdates.push('chargesheetDate = ?');
//           chargesheetValues.push(parsedChargesheetDetails.chargeSheetDate);
//         }
//         // console.log(parsedChargesheetDetails.chargeSheetDate)
//         if (parsedChargesheetDetails.mfCopyPath) {
//           chargesheetUpdates.push('mf_copy_path = ?');
//           chargesheetValues.push(parsedChargesheetDetails.mfCopyPath);
//         }
//         if (parsedChargesheetDetails.totalCompensation) {
//           chargesheetUpdates.push('total_compensation_1 = ?');
//           chargesheetValues.push(parsedChargesheetDetails.totalCompensation);
//         }
//         if (parsedChargesheetDetails.proceedingsFileNo) {
//           chargesheetUpdates.push('proceedings_file_no = ?');
//           chargesheetValues.push(parsedChargesheetDetails.proceedingsFileNo);
//         }
//         if (parsedChargesheetDetails.proceedingsDate) {
//           chargesheetUpdates.push('proceedings_date = ?');
//           chargesheetValues.push(parsedChargesheetDetails.proceedingsDate);
//         }


//         const chargesheetPromise = new Promise((resolve, reject) => {
//           if (chargesheetUpdates.length > 0) {
//             const query = `UPDATE chargesheet_details SET ${chargesheetUpdates.join(', ')} WHERE chargesheet_id = ?`;
//             connection.query(query, [...chargesheetValues, chargesheetId], (err) => (err ? reject(err) : resolve()));
//             // console.log(query,chargesheetValues,chargesheetId)
//           } else {
//             resolve();
//           }
//         });

//         const proceedingsFilePromise = new Promise((resolve, reject) => {
//           if (!proceedingsFile) return resolve();

//           const checkQuery = `SELECT upload_proceedings_path FROM chargesheet_details WHERE chargesheet_id = ?`;

//           connection.query(checkQuery, [chargesheetId], (err, results) => {
//             if (err) return reject(err);

//             const updateQuery = `
//               UPDATE chargesheet_details 
//               SET upload_proceedings_path = ? 
//               WHERE chargesheet_id = ?
//             `;
//             connection.query(updateQuery, [proceedingsFile, chargesheetId], (err) => {
//               if (err) return reject(err);
//               resolve();
//             });
//           });
//         });

//         const victimPromises = parsedVictimsRelief.map((victim) => {
//           const victimUpdates = [];
//           const victimValues = [];

//           if (victim.victimName) {
//             victimUpdates.push('victim_name = ?');
//             victimValues.push(victim.victimName);
//           }
//           if (victim.reliefAmountScst) {
//             victimUpdates.push('relief_amount_scst_1 = ?');
//             victimValues.push(victim.reliefAmountScst);
//           }
//           if (victim.reliefAmountExGratia) {
//             victimUpdates.push('relief_amount_ex_gratia_1 = ?');
//             victimValues.push(victim.reliefAmountExGratia);
//           }
//           if (victim.reliefAmountSecondStage) {
//             victimUpdates.push('relief_amount_second_stage = ?');
//             victimValues.push(victim.reliefAmountSecondStage);
//           }

//           return new Promise((resolve, reject) => {
//             const query = `
//               UPDATE chargesheet_victims 
//               SET ${victimUpdates.join(', ')}
//               WHERE fir_id = ? AND victim_id = ? AND chargesheet_id = ?
//             `;
//             connection.query(query, [...victimValues, firId, victim.victimId, chargesheetId], (err) => {
//               if (err) return reject(err);
//               resolve();
//             });
//           });
//         });

//         const attachmentPromises = attachments.map((attachment) => {
//           return new Promise((resolve, reject) => {
//             const query = `
//               UPDATE chargesheet_attachments 
//               SET file_path = ? 
//               WHERE fir_id = ? AND chargesheet_id = ? AND attachment_id = ?
//             `;
//             const values = [
//               attachment.path || null,
//               firId,
//               chargesheetId,
//               attachment.filename || Math.random().toString(36).substr(2, 9),
//             ];

//             connection.query(query, values, (err) => {
//               if (err) return reject(err);
//               resolve();
//             });
//           });
//         });

//         Promise.all([
//           updateFirStatusPromise,
//           chargesheetPromise,
//           proceedingsFilePromise,
//           ...victimPromises,
//           ...attachmentPromises
//         ])
//           .then(() => {
//             connection.commit((err) => {
//               if (err) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   res.status(500).json({ message: 'Commit error'});
//                 });
//               }
//               connection.release();
//               res.status(200).json({ message: 'Step 6 data updated successfully, and FIR status updated to 6.' });
//             });
//           })
//           .catch((err) => {
//             connection.rollback(() => {
//               connection.release();
//               res.status(500).json({ message: 'Transaction failed'});
//             });
//           });
//       });
//     });
//   });
// };


// modified for attachement
exports.Update_step6 = (req, res) => {
  update_step6(req, res, (err) => {
    if (err) return res.status(500).json({ message: 'File upload error'});

    const { firId, chargesheetDetails, victimsRelief } = req.body;

    if (!firId) {
      return res.status(400).json({ message: 'FIR ID is missing.' });
    }

    let parsedChargesheetDetails;
    try {
      parsedChargesheetDetails = chargesheetDetails;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid chargesheetDetails format', error });
    }

    let parsedVictimsRelief = [];
    try {
      parsedVictimsRelief = victimsRelief;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid victimsRelief format', error });
    }

    const proceedingsFile = req.body.uploadProceedingsPath ? req.body.uploadProceedingsPath : null;
    const attachments = req.body.attachments || [];

    const generateRandomId = (length = 8) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    };

    db.getConnection((err, connection) => {
      if (err) return res.status(500).json({ message: 'DB connection error'});

      connection.beginTransaction(async (err) => {
        if (err) {
          connection.release();
          return res.status(500).json({ message: 'Transaction error'});
        }

        try {
          // 1. Update FIR status
          // await new Promise((resolve, reject) => {
          //   const query = `UPDATE fir_add SET status = ? WHERE fir_id = ?`;
          //   connection.query(query, [status || 6, firId], (err) => (err ? reject(err) : resolve()));
          // });

          // 2. Check and upsert chargesheet_details
          await new Promise((resolve, reject) => {
            const checkQuery = `SELECT fir_id FROM chargesheet_details WHERE fir_id = ?`;
            connection.query(checkQuery, [firId], (err, results) => {
              if (err) return reject(err);

              const values = [
                parsedChargesheetDetails.chargeSheetFiled || null,
                parsedChargesheetDetails.courtDistrict || null,
                parsedChargesheetDetails.courtName || null,
                parsedChargesheetDetails.caseType || null,
                parsedChargesheetDetails.caseNumber || null,
                parsedChargesheetDetails.chargeSheetDate || null,
                parsedChargesheetDetails.rcsFileNumber || null,
                parsedChargesheetDetails.rcsFilingDate || null,
                parsedChargesheetDetails.mfCopyPath || null,
                parsedChargesheetDetails.totalCompensation || null,
                parsedChargesheetDetails.proceedingsFileNo || null,
                parsedChargesheetDetails.proceedingsDate || null,
                proceedingsFile || null,
                parsedChargesheetDetails.ChargeSheet_CRL_number || null,
                parsedChargesheetDetails.quash_petition_no || null,
                parsedChargesheetDetails.petition_date || null,
                parsedChargesheetDetails.upload_court_order_path || null,
                firId,
              ];

              const query = results.length > 0
                ? `UPDATE chargesheet_details SET
                      charge_sheet_filed = ?, court_district = ?, court_name = ?, case_type = ?,
                      case_number = ?, chargesheetDate = ?, rcs_file_number = ?, rcs_filing_date = ?,
                      mf_copy_path = ?, total_compensation_1 = ?, proceedings_file_no = ?,
                      proceedings_date = ?, upload_proceedings_path = ?, ChargeSheet_CRL_number = ?, quash_petition_no = ?, petition_date = ?, upload_court_order_path = ? WHERE fir_id = ?`
                : `INSERT INTO chargesheet_details (
                      charge_sheet_filed, court_district, court_name, case_type, case_number,
                      chargesheetDate, rcs_file_number, rcs_filing_date, mf_copy_path,
                      total_compensation_1, proceedings_file_no, proceedings_date, upload_proceedings_path, ChargeSheet_CRL_number, quash_petition_no ,petition_date ,upload_court_order_path, fir_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

              connection.query(query, values, (err) => (err ? reject(err) : resolve()));
            });
          });

          // 3. Check and upsert each victim
          for (const [index, victim] of parsedVictimsRelief.entries()) {
            const victimId = victim.victimId || generateRandomId();
            const checkQuery = `SELECT * FROM chargesheet_victims WHERE fir_id = ? AND victim_id = ?`;

            await new Promise((resolve, reject) => {
              connection.query(checkQuery, [firId, victimId], (err, results) => {
                if (err) return reject(err);

                const values = [
                  victim.victimName || `Victim ${index + 1}`,
                  victim.reliefAmountScst || '0.00',
                  victim.reliefAmountExGratia || '0.00',
                  victim.reliefAmountSecondStage || '0.00',
                  firId,
                  victimId,
                ];

                const query = results.length > 0
                  ? `UPDATE chargesheet_victims SET
                        victim_name = ?, relief_amount_scst_1 = ?, relief_amount_ex_gratia_1 = ?, relief_amount_second_stage = ?
                       WHERE fir_id = ? AND victim_id = ?`
                  : `INSERT INTO chargesheet_victims (
                        victim_name, relief_amount_scst_1, relief_amount_ex_gratia_1, relief_amount_second_stage,
                        fir_id, victim_id
                      ) VALUES (?, ?, ?, ?, ?, ?)`;

                connection.query(query, values, (err) => (err ? reject(err) : resolve()));
              });
            });
          }

          if(attachments && attachments.length > 0 && attachments[0] != null){
            await new Promise((resolve, reject) => {
            const query = `DELETE FROM chargesheet_attachments WHERE fir_id = ?`;
            connection.query(query, [firId], (err) => (err ? reject(err) : resolve()));
          });
            // await connection.query('DELETE FROM chargesheet_attachments WHERE fir_id = ?', [firId]);

            for (const attachment of attachments) {
            const attachmentQuery = `
              INSERT INTO chargesheet_attachments (fir_id, file_path) 
              VALUES (?, ?)`;
            const attachmentvalues = [
              firId,
              attachment
            ];
            // await connection.query(attachmentQuery, attachmentvalues);
            await new Promise((resolve, reject) => {
            connection.query(attachmentQuery, attachmentvalues, (err) => (err ? reject(err) : resolve()));
          });
          }
          } else {
            await new Promise((resolve, reject) => {
            const query = `DELETE FROM chargesheet_attachments WHERE fir_id = ?`;
            connection.query(query, [firId], (err) => (err ? reject(err) : resolve()));
          });
          }

          // Commit
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: 'Commit error'});
              });
            }
            connection.release();
            res.status(200).json({ message: 'Step 6 data upserted successfully, and FIR status updated.' });
          });
        } catch (err) {
          console.log(err)
          connection.rollback(() => {
            connection.release();
            res.status(500).json({ message: 'Transaction failed'});
          });
        }
      });
    });
  });
};



exports.getPoliceStations = (req, res) => {
  const { district } = req.query;
  const query = 'SELECT station_name FROM police_stations WHERE city_or_district = ?';

  db.query(query, [district], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch police stations'});
    }
    res.json(results.map(row => row.station_name));
  });
};



// Fetch all Offence Names
exports.getAllOffences = (req, res) => {
  const query = 'SELECT offence_name FROM offence';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch offences'});
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
      return res.status(500).json({ message: 'Failed to fetch offence acts'});
    }
    res.json(results);
  });
};


// Fetch all Caste Names (SC/ST Sections)
exports.getAllCastes = (req, res) => {
  const query = 'SELECT caste_name FROM caste_community';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch caste names'});
    }
    res.json(results);
  });
};

exports.removechargesheetrelief = (req, res) => {
  const { id } = req.query;
  // console.log(id);
  const deletequery = `Delete from attachment_relief where id=?`;
  const deletequeryvalues = [
    id,
  ];
  db.query(deletequery, deletequeryvalues, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete FIR data'});
    }
    return res.status(200).json({ status: true, message: "Deleted Successfully" });
  });
}

exports.removechargesheet = (req, res) => {
  const { id } = req.query;
  // console.log(id);
  const deletequery = `Delete from chargesheet_attachments where id=?`;
  const deletequeryvalues = [
    id,
  ];
  db.query(deletequery, deletequeryvalues, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete FIR data'});
    }
    return res.status(200).json({ status: true, message: "Deleted Successfully" });
  });
}

exports.getAllCommunities = (req, res) => {
  const query = 'SELECT DISTINCT community_name FROM caste_community';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch communities'});
    }
    res.json(results.map(row => row.community_name));
  });
};


exports.getCastesByCommunity = (req, res) => {
  const { community } = req.query; // Extract community from query parameters
  const query = 'SELECT caste_name FROM caste_community WHERE community_name = ?';
  db.query(query, [community], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch caste names'});
    }
    res.json(results.map(row => row.caste_name)); // Return only the caste names
  });
};


exports.getAllAccusedCommunities = (req, res) => {
  const query = 'SELECT DISTINCT community_name FROM acquest_community_caste';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch accused communities'});
    }
    res.json(results.map(row => row.community_name));
  });
};


exports.getAccusedCastesByCommunity = (req, res) => {
  const { community } = req.query;
  const query = 'SELECT caste_name FROM acquest_community_caste WHERE community_name = ?';
  db.query(query, [community], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch accused castes'});
    }
    res.json(results.map(row => row.caste_name));
  });
};


exports.getAllRevenues = (req, res) => {
  const query = 'SELECT revenue_district_name FROM district_revenue';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch revenue districts'});
    }
    res.json(results);
  });
};


exports.getAllCourtDivisions = (req, res) => {
  const query = 'SELECT DISTINCT court_division_name FROM court';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch court divisions'});
    }
    res.json(results.map(row => row.court_division_name));
  });
};


exports.getCourtRangesByDivision = (req, res) => {
  const { division } = req.query;
  const query = 'SELECT court_range_name FROM court WHERE court_division_name = ?';
  db.query(query, [division], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch court ranges'});
    }
    res.json(results.map(row => row.court_range_name));
  });
};


exports.getAllDistricts = (req, res) => {
  const query = 'SELECT district_name FROM district';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch districts'});
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
      return res.status(500).json({ message: 'Failed to fetch victim relief details'});
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
    return res.status(500).json({ message: 'Error fetching FIR details.'});
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
      return res.status(500).json({ message: 'Error fetching FIR status'});
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
      return res.status(500).json({ message: 'Failed to update FIR status'});
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

// commanded for reference
// exports.saveEditStepSevenAsDraft = async (req, res) => {
//   console.log(req.body);

//   const {
//     firId, trialDetails, trialDetails_one, trialDetails_two, compensationDetails, attachments,
//     appealDetails, appealDetailsOne, caseAppealDetailsTwo, hearingdetail,compensationDetails_1,compensationDetails_2
//   } = req.body;

//   const ogId = firId.replace(/(^")|("$)/g, '');
//   const parseJSON = (data) => {
//     try {
//       return typeof data === 'string' ? JSON.parse(data) : data;
//     } catch (error) {
//       console.error('Error parsing JSON:', error);
//       return {};
//     }
//   };
//   const parsedHearingDetails = parseJSON(hearingdetail);
//   const parsedTrialDetails = parseJSON(trialDetails);
//   const parsedTrialDetailsOne = parseJSON(trialDetails_one);
//   const parsedTrialDetailsTwo = parseJSON(trialDetails_two);
//   const parsedAppealDetails = parseJSON(appealDetails);
//   const parsedAppealDetailsOne = parseJSON(appealDetailsOne);
//   const parsedCaseAppealDetailsTwo = parseJSON(caseAppealDetailsTwo);
//   const parsedCompensationDetails = parseJSON(compensationDetails);

//   const parsedCompensationDetails_1 = parseJSON(compensationDetails_1);
//   const parsedCompensationDetails_2 = parseJSON(compensationDetails_2);

//   const randomCaseId_1 = await generateRandomId(10);
//   console.log(randomCaseId_1)

//   if (!ogId) {
//     return res.status(400).json({ message: 'Missing required firId field.' });
//   }

//   db.beginTransaction(async (err) => {
//     if (err) {
//       console.error('Transaction error:', err);
//       return res.status(500).json({ message: 'Transaction error'});
//     }

//     try {

//       const existingCaseDetails = await queryAsync('SELECT * FROM case_details WHERE fir_id = ?', [ogId]);

//       if (existingCaseDetails.length > 0) {
//         await queryAsync(`
//           UPDATE case_details SET
//             court_name = ?,
//             court_district = ?,
//             trial_case_number = ?,
//             public_prosecutor = ?,
//             prosecutor_phone = ?,
//             first_hearing_date = ?,
//             judgement_awarded = ?,
//             CaseHandledBy = ?,
//             NameOfAdvocate = ?,
//             advocateMobNumber = ?,
//             judgementAwarded1 = ?,
//             Conviction_Type = ?
//           WHERE fir_id = ?
//         `, [
//           parsedTrialDetails.courtName,
//           parsedTrialDetails.courtDistrict,
//           parsedTrialDetails.trialCaseNumber,
//           parsedTrialDetails.publicProsecutor,
//           parsedTrialDetails.prosecutorPhone,
//           parsedTrialDetails.firstHearingDate,
//           parsedTrialDetails.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
//           parsedTrialDetails.CaseHandledBy,
//           parsedTrialDetails.NameOfAdvocate,
//           parsedTrialDetails.advocateMobNumber,
//           parsedTrialDetails.judgementAwarded1 ? parsedTrialDetails.judgementAwarded1 : 'no',
//           parsedTrialDetails.Conviction_Type ? parsedTrialDetails.Conviction_Type : null,
//           ogId,
//         ]);
//       } else {
//         await queryAsync(`
//           INSERT INTO case_details (fir_id, case_id, court_name, court_district, trial_case_number, public_prosecutor, prosecutor_phone, first_hearing_date, judgement_awarded, CaseHandledBy, NameOfAdvocate, advocateMobNumber, judgementAwarded1, Conviction_Type)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `, [
//           ogId,
//           randomCaseId_1,
//           parsedTrialDetails.courtName,
//           parsedTrialDetails.courtDistrict,
//           parsedTrialDetails.trialCaseNumber,
//           parsedTrialDetails.publicProsecutor,
//           parsedTrialDetails.prosecutorPhone,
//           parsedTrialDetails.firstHearingDate,
//           parsedTrialDetails.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
//           parsedTrialDetails.CaseHandledBy,
//           parsedTrialDetails.NameOfAdvocate,
//           parsedTrialDetails.advocateMobNumber,
//           parsedTrialDetails.judgementAwarded1 ? parsedTrialDetails.judgementAwarded1 : 'no',
//           parsedTrialDetails.Conviction_Type ? parsedTrialDetails.Conviction_Type : null,
//         ]);
//       }



// const existingCaseCourtDetailOne = await queryAsync('SELECT * FROM case_court_detail_one WHERE fir_id = ?', [ogId]);

// if (existingCaseCourtDetailOne.length > 0) {
//   await queryAsync(`
//     UPDATE case_court_detail_one SET
//     fir_id = ?,
//       court_name = ?,
//       court_district = ?,
//       case_number = ?,
//       public_prosecutor = ?,
//       prosecutor_phone = ?,
//       second_hearing_date = ?,
//       judgement_awarded = ?,
//       judgementNature = ?,
//       Conviction_Type = ?

//     WHERE fir_id = ?
//   `, [
//     ogId,
//     parsedTrialDetailsOne.courtName,
//     parsedTrialDetailsOne.courtDistrict,
//     parsedTrialDetailsOne.trialCaseNumber,
//     parsedTrialDetailsOne.publicProsecutor,
//     parsedTrialDetailsOne.prosecutorPhone,
//     parsedTrialDetailsOne.firstHearingDate ? parsedTrialDetailsOne.firstHearingDate : null ,
//     parsedTrialDetailsOne.judgementAwarded ? parsedTrialDetailsOne.judgementAwarded : 'no',
//     parsedTrialDetailsOne.judgementNature,
//     parsedTrialDetailsOne.Conviction_Type ? parsedTrialDetailsOne.Conviction_Type : null ,

//     ogId
//   ]);
// } else {
//   await queryAsync(`
//     INSERT INTO case_court_detail_one (
//       fir_id, case_id , court_name, court_district, case_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature, Conviction_Type
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `, [
//     ogId,
//     randomCaseId_1,
//     parsedTrialDetailsOne.courtName,
//     parsedTrialDetailsOne.courtDistrict,
//     parsedTrialDetailsOne.trialCaseNumber,
//     parsedTrialDetailsOne.publicProsecutor,
//     parsedTrialDetailsOne.prosecutorPhone,
//     parsedTrialDetailsOne.firstHearingDate ? parsedTrialDetailsOne.firstHearingDate : null ,
//     parsedTrialDetailsOne.judgementAwarded ? parsedTrialDetailsOne.judgementAwarded : 'no',
//     parsedTrialDetailsOne.judgementNature,
//     parsedTrialDetailsOne.Conviction_Type ? parsedTrialDetailsOne.Conviction_Type : null ,

//   ]);
// }


// const existingCaseCourtDetailTwo = await queryAsync('SELECT * FROM case_court_details_two WHERE fir_id = ?', [ogId]);

// if (existingCaseCourtDetailTwo.length > 0) {
//   await queryAsync(`
//     UPDATE case_court_details_two SET
//     fir_id = ?,
//       court_name = ?,
//       court_district = ?,
//       case_number = ?,
//       public_prosecutor = ?,
//       prosecutor_phone = ?,
//       second_hearing_date = ?,
//       judgement_awarded = ?,
//       judgementNature = ?,
//       Conviction_Type = ?

//     WHERE fir_id = ?
//   `, [
//     ogId,
//     parsedTrialDetailsTwo.courtName,
//     parsedTrialDetailsTwo.courtDistrict,
//     parsedTrialDetailsTwo.trialCaseNumber,
//     parsedTrialDetailsTwo.publicProsecutor,
//     parsedTrialDetailsTwo.prosecutorPhone,
//     parsedTrialDetailsTwo.firstHearingDate ? parsedTrialDetailsTwo.firstHearingDate : null,
//     parsedTrialDetailsTwo.judgementAwarded ? parsedTrialDetailsTwo.judgementAwarded : 'no',
//     parsedTrialDetailsTwo.judgementNature,
//     parsedTrialDetailsTwo.Conviction_Type ? parsedTrialDetailsTwo.Conviction_Type : null ,

//     ogId
//   ]);
// } else {
//   await queryAsync(`
//     INSERT INTO case_court_details_two (
//       fir_id, case_id, court_name, court_district, case_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature, Conviction_Type
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `, [
//     ogId,
//     randomCaseId_1,
//     parsedTrialDetailsTwo.courtName,
//     parsedTrialDetailsTwo.courtDistrict,
//     parsedTrialDetailsTwo.trialCaseNumber,
//     parsedTrialDetailsTwo.publicProsecutor,
//     parsedTrialDetailsTwo.prosecutorPhone,
//     parsedTrialDetailsTwo.firstHearingDate ? parsedTrialDetailsTwo.firstHearingDate : null,
//     parsedTrialDetailsTwo.judgementAwarded ? parsedTrialDetailsTwo.judgementAwarded : 'no',
//     parsedTrialDetailsTwo.judgementNature,
//     parsedTrialDetailsTwo.Conviction_Type ? parsedTrialDetailsTwo.Conviction_Type : null ,

//   ]);
// }


//       await queryAsync(`
//         UPDATE fir_add SET
//           nature_of_judgement = COALESCE(?, nature_of_judgement),
//           judgement_copy = COALESCE(?, judgement_copy),
//           Conviction_Type = COALESCE(?, Conviction_Type)
//         WHERE fir_id = ?
//       `, [parsedTrialDetails.judgementNature, parsedTrialDetails.uploadJudgement, parsedTrialDetails.Conviction_Type, ogId]);

//       // await queryAsync(`
//       //   INSERT INTO fir_trial (fir_id, total_amount_third_stage, proceedings_file_no, proceedings_date, Commissionerate_file)
//       //   VALUES (?, ?, ?, ?, ?)
//       //   ON DUPLICATE KEY UPDATE
//       //     total_amount_third_stage = VALUES(total_amount_third_stage),
//       //     proceedings_file_no = VALUES(proceedings_file_no),
//       //     proceedings_date = VALUES(proceedings_date),
//       //     Commissionerate_file = VALUES(Commissionerate_file)
//       // `, [
//       //   ogId,
//       //   parsedCompensationDetails.totalCompensation,
//       //   parsedCompensationDetails.proceedingsFileNo,
//       //   parsedCompensationDetails.proceedingsDate,
//       //   parsedCompensationDetails.uploadProceedings,
//       // ]);

//       // Check if the FIR ID already exists in the table
// const existingCompensation = await queryAsync(
//   `SELECT * FROM fir_trial WHERE fir_id = ?`,
//   [ogId]
// );

// if (existingCompensation.length > 0) {
//   // If record exists, update it
//   await queryAsync(`
//       UPDATE fir_trial
//       SET 
//           total_amount_third_stage = ?, 
//           proceedings_file_no = ?, 
//           proceedings_date = ?, 
//           Commissionerate_file = ?
//       WHERE fir_id = ?;
//   `, [
//       parsedCompensationDetails.totalCompensation,
//       parsedCompensationDetails.proceedingsFileNo,
//       parsedCompensationDetails.proceedingsDate ? parsedCompensationDetails.proceedingsDate : null,
//       parsedCompensationDetails.uploadProceedings,
//       ogId
//   ]);
// } else {
//   // If no record exists, insert a new one
//   await queryAsync(`
//       INSERT INTO fir_trial (
//           fir_id, 
//           case_id,
//           total_amount_third_stage, 
//           proceedings_file_no, 
//           proceedings_date, 
//           Commissionerate_file
//       ) VALUES (?, ?, ?, ?, ?, ?);
//   `, [
//       ogId,
//       randomCaseId_1,
//       parsedCompensationDetails.totalCompensation,
//       parsedCompensationDetails.proceedingsFileNo,
//       parsedCompensationDetails.proceedingsDate ? parsedCompensationDetails.proceedingsDate : null,
//       parsedCompensationDetails.uploadProceedings
//   ]);
// }

//       async function upsertCompensationDetails(tableName, parsedCompensationDetails) {
//           const existingCompensation = await queryAsync(
//               `SELECT * FROM ${tableName} WHERE fir_id = ?`,
//               [ogId]
//           );

//           if (existingCompensation.length > 0) {
//               await queryAsync(`
//                   UPDATE ${tableName}
//                   SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, upload_proceedings = ?
//                   WHERE fir_id = ?
//               `, [
//                   parsedCompensationDetails.totalCompensation ? parsedCompensationDetails.totalCompensation : null ,
//                   parsedCompensationDetails.proceedingsFileNo,
//                   parsedCompensationDetails.proceedingsDate ? parsedCompensationDetails.proceedingsDate : null,
//                   parsedCompensationDetails.uploadProceedings,
//                   ogId,

//               ]);
//           } else {
//               await queryAsync(`
//                   INSERT INTO ${tableName} 
//                       (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
//                   VALUES (?, ?, ?, ?, ?, ?)
//               `, [
//                   ogId,
//                   randomCaseId_1,
//                   parsedCompensationDetails.totalCompensation ? parsedCompensationDetails.totalCompensation : 0,
//                   parsedCompensationDetails.proceedingsFileNo,
//                   parsedCompensationDetails.proceedingsDate ? parsedCompensationDetails.proceedingsDate : null,
//                   parsedCompensationDetails.uploadProceedings
//               ]);
//           }
//       }


//       await upsertCompensationDetails('compensation_details', parsedCompensationDetails);
//       await upsertCompensationDetails('compensation_details_1', parsedCompensationDetails_1);
//       await upsertCompensationDetails('compensation_details_2', parsedCompensationDetails_2);

//       const appealTables = [
//         { table: 'appeal_details', data: parsedAppealDetails },
//         { table: 'appeal_details_one', data: parsedAppealDetailsOne },
//         { table: 'case_appeal_details_two', data: parsedCaseAppealDetailsTwo },
//       ];

//       for (const { table, data } of appealTables) {
//         if (data) {

//           const existingRecord = await queryAsync(`SELECT * FROM ${table} WHERE fir_id = ?`, [ogId]);
//           console.log('ogId:', ogId);

//           if (existingRecord.length > 0) {

//             await queryAsync(`DELETE FROM ${table} WHERE fir_id = ?`, [ogId]);
//           }


//           await queryAsync(
//             `
//             INSERT INTO ${table} (fir_id, legal_opinion_obtained, case_fit_for_appeal, government_approval_for_appeal, filed_by, designated_court, judgementNature)
//             VALUES (?, ?, ?, ?, ?, ?, ?)
//           `,
//             [
//               ogId,
//               data.legal_opinion_obtained ? data.legal_opinion_obtained : null,
//               data.case_fit_for_appeal ? data.case_fit_for_appeal : null,
//               data.government_approval_for_appeal ? data.government_approval_for_appeal : null,
//               data.filed_by ? data.filed_by : null,
//               data.designated_court ? data.designated_court : null,
//               data.judgementNature ? data.designated_court : null,
//             ]
//           );
//         }
//       }



//       const hearingTables = {
//         hearingDetails: 'hearing_details_one',
//         hearingDetails_one: 'hearing_details_two',
//         hearingDetails_two: 'hearing_details_three',
//       };

//       for (const key in parsedHearingDetails) {
//         const tableData = parsedHearingDetails[key];
//         const tableName = hearingTables[key];

//         if (!Array.isArray(tableData) || tableData.length === 0) {
//           console.warn(`Skipping key "${key}" because it has no valid data.`);
//           continue;
//         }

//         if (!tableName) {
//           console.warn(`Skipping key "${key}" as no table is mapped.`);
//           continue;
//         }

//         try {
//           await queryAsync(`DELETE FROM ${tableName} WHERE fir_id = ?`, [ogId]);
//           console.log(`Cleared existing data for fir_id: ${ogId} in ${tableName}`);
//         } catch (error) {
//           console.error(`Failed to clear existing data for fir_id: ${ogId} in ${tableName}`, error);
//           continue;
//         }

//         for (const entry of tableData) {
//           let suffix = '';

//           if (key === 'hearingDetails_one') {
//             suffix = '_one';
//           } else if (key === 'hearingDetails_two') {
//             suffix = '_two';
//           }

//           const nextHearingDate = entry[`nextHearingDate${suffix}`] || null;
//           const reasonNextHearing = entry[`reasonNextHearing${suffix}`] || null;

//           if (!nextHearingDate && !reasonNextHearing) {
//             console.warn(`Skipping empty record for table "${tableName}"`);
//             continue;
//           }

//           try {
//             await queryAsync(
//               `INSERT INTO ${tableName} (fir_id, next_hearing_date, reason_next_hearing) 
//                VALUES (?, ?, ?)`,
//               [ogId, nextHearingDate, reasonNextHearing]
//             );
//             console.log(`Inserted record into ${tableName}: ${nextHearingDate}, ${reasonNextHearing}`);
//           } catch (error) {
//             console.error(`Database error for table "${tableName}":`, error);
//           }
//         }
//       }





//       if (attachments && attachments.length > 0) {
//         for (const attachment of attachments) {
//           await queryAsync(`
//             INSERT INTO case_attachments (fir_id, file_name)
//             VALUES (?, ?)
//           `, [ogId, attachment]);
//         }
//       }

//       db.commit((err) => {
//         if (err) {
//           console.log(err)
//           db.rollback(() => res.status(500).json({ message: 'Transaction commit error'}));
//         }
//         res.status(200).json({ message: 'Step 7 updated successfully.' });
//       });
//     } catch (error) {
//       console.log(error)
//       db.rollback(() => res.status(500).json({ message: 'Transaction failed', error }));
//     }
//   });
// };


exports.saveEditStepSevenAsDraft = async (req, res) => {
  // console.log(req.body);

  const {
    firId, trialDetails, trialDetails_one, trialDetails_two, compensationDetails, attachments,
    appealDetails, appealDetailsOne, caseAppealDetailsTwo, hearingdetail, compensationDetails_1, compensationDetails_2 , victimsRelief
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
  // const parsedHearingDetails = parseJSON(hearingdetail);
  // const parsedTrialDetails = parseJSON(trialDetails);
  // const parsedTrialDetailsOne = parseJSON(trialDetails_one);
  // const parsedTrialDetailsTwo = parseJSON(trialDetails_two);
  // const parsedAppealDetails = parseJSON(appealDetails);
  // const parsedAppealDetailsOne = parseJSON(appealDetailsOne);
  // const parsedCaseAppealDetailsTwo = parseJSON(caseAppealDetailsTwo);
  // const parsedCompensationDetails = parseJSON(compensationDetails);
  // const parsedCompensationDetails_1 = parseJSON(compensationDetails_1);
  // const parsedCompensationDetails_2 = parseJSON(compensationDetails_2);
  // const parsedVictimsRelief = parseJSON(victimsRelief);

  const parsedHearingDetails = hearingdetail;
  const parsedTrialDetails = trialDetails;
  const parsedTrialDetailsOne = trialDetails_one;
  const parsedTrialDetailsTwo = trialDetails_two;
  const parsedAppealDetails = appealDetails;
  const parsedAppealDetailsOne = appealDetailsOne;
  const parsedCaseAppealDetailsTwo = caseAppealDetailsTwo;
  const parsedCompensationDetails = compensationDetails;
  const parsedCompensationDetails_1 = compensationDetails_1;
  const parsedCompensationDetails_2 = compensationDetails_2;
  const parsedVictimsRelief = victimsRelief;


  const randomCaseId_1 = await generateRandomId(10);
  // console.log(randomCaseId_1)

  if (!ogId) {
    return res.status(400).json({ message: 'Missing required firId field.' });
  }


  const connection = await new Promise((resolve, reject) => {
    db.getConnection((err, conn) => {
      if (err) return reject(err);
      return resolve(conn);
    });
  });

  const queryAsync = util.promisify(connection.query).bind(connection);

  try {
    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) return reject(err);
        resolve();
      });
    });

    const existingCaseDetails = await queryAsync('SELECT * FROM case_details WHERE fir_id = ?', [ogId]);

    if (existingCaseDetails.length > 0) {
      await queryAsync(`
          UPDATE case_details SET
            court_name = ?,
            court_district = ?,
            trial_case_number = ?,
            CRL_number = ?,
            public_prosecutor = ?,
            prosecutor_phone = ?,
            first_hearing_date = ?,
            judgement_awarded = ?,
            CaseHandledBy = ?,
            NameOfAdvocate = ?,
            advocateMobNumber = ?,
            judgementAwarded1 = ?,
            judgementNature = ?,
            Conviction_Type = ?,
            Judgement_Date = ?,
            judgement_copy = ?,
            judgement_nature_remarks = ?
          WHERE fir_id = ?
        `, [
        parsedTrialDetails.courtName ? parsedTrialDetails.courtName : null,
        parsedTrialDetails.courtDistrict ? parsedTrialDetails.courtDistrict : null,
        parsedTrialDetails.trialCaseNumber ? parsedTrialDetails.trialCaseNumber : null,
        parsedTrialDetails.CRL_number ? parsedTrialDetails.CRL_number : null,
        parsedTrialDetails.publicProsecutor ? parsedTrialDetails.publicProsecutor : null,
        parsedTrialDetails.prosecutorPhone ? parsedTrialDetails.prosecutorPhone : null,
        parsedTrialDetails.firstHearingDate ?  parsedTrialDetails.firstHearingDate : null,
        parsedTrialDetails.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
        parsedTrialDetails.CaseHandledBy ? parsedTrialDetails.CaseHandledBy : null,
        parsedTrialDetails.NameOfAdvocate ? parsedTrialDetails.NameOfAdvocate : null,
        parsedTrialDetails.advocateMobNumber ? parsedTrialDetails.advocateMobNumber : null,
        parsedTrialDetails.judgementAwarded1 ? parsedTrialDetails.judgementAwarded1 : 'no',
        parsedTrialDetails.judgementNature ? parsedTrialDetails.judgementNature : null,
        parsedTrialDetails.Conviction_Type ? parsedTrialDetails.Conviction_Type : null,
        parsedTrialDetails.Judgement_Date ? parsedTrialDetails.Judgement_Date : null,
        parsedTrialDetails.uploadJudgement ? parsedTrialDetails.uploadJudgement : null,
        parsedTrialDetails.judgement_nature_remarks ? parsedTrialDetails.judgement_nature_remarks : null,
        ogId,
      ]);
    } else {
      await queryAsync(`
          INSERT INTO case_details (fir_id, case_id, court_name, court_district, trial_case_number, CRL_number, public_prosecutor, prosecutor_phone, first_hearing_date, judgement_awarded, CaseHandledBy, NameOfAdvocate, advocateMobNumber, judgementAwarded1, judgementNature, Conviction_Type, Judgement_Date, judgement_copy, judgement_nature_remarks)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
        ogId,
        randomCaseId_1,
        parsedTrialDetails.courtName ? parsedTrialDetails.courtName : null,
        parsedTrialDetails.courtDistrict ? parsedTrialDetails.courtDistrict : null,
        parsedTrialDetails.trialCaseNumber ? parsedTrialDetails.trialCaseNumber : null,
        parsedTrialDetails.CRL_number ? parsedTrialDetails.CRL_number : null,
        parsedTrialDetails.publicProsecutor ? parsedTrialDetails.publicProsecutor : null,
        parsedTrialDetails.prosecutorPhone ? parsedTrialDetails.prosecutorPhone : null,
        parsedTrialDetails.firstHearingDate ?  parsedTrialDetails.firstHearingDate : null,
        parsedTrialDetails.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
        parsedTrialDetails.CaseHandledBy ? parsedTrialDetails.CaseHandledBy : null,
        parsedTrialDetails.NameOfAdvocate ? parsedTrialDetails.NameOfAdvocate : null,
        parsedTrialDetails.advocateMobNumber ? parsedTrialDetails.advocateMobNumber : null,
        parsedTrialDetails.judgementAwarded1 ? parsedTrialDetails.judgementAwarded1 : 'no',
        parsedTrialDetails.judgementNature ? parsedTrialDetails.judgementNature : null,
        parsedTrialDetails.Conviction_Type ? parsedTrialDetails.Conviction_Type : null,
        parsedTrialDetails.Judgement_Date ? parsedTrialDetails.Judgement_Date : null,
        parsedTrialDetails.uploadJudgement ? parsedTrialDetails.uploadJudgement : null,
        parsedTrialDetails.judgement_nature_remarks ? parsedTrialDetails.judgement_nature_remarks : null
      ]);
    }

    // if(parsedTrialDetails.judgementNature){
    //       await queryAsync(`
    //   UPDATE fir_add SET
    //     nature_of_judgement = COALESCE(?, nature_of_judgement),
    //     judgement_copy = COALESCE(?, judgement_copy),
    //     status = COALESCE(?, status),
    //     Conviction_Type = COALESCE(?, Conviction_Type)
    //   WHERE fir_id = ?
    // `, [parsedTrialDetails.judgementNature, parsedTrialDetails.uploadJudgement, 7 ,parsedTrialDetails.Conviction_Type, ogId]);
    // } else {
    //       await queryAsync(`
    //   UPDATE fir_add SET
    //     nature_of_judgement = COALESCE(?, nature_of_judgement),
    //     judgement_copy = COALESCE(?, judgement_copy),
    //     Conviction_Type = COALESCE(?, Conviction_Type)
    //   WHERE fir_id = ?
    // `, [parsedTrialDetails.judgementNature, parsedTrialDetails.uploadJudgement ,parsedTrialDetails.Conviction_Type, ogId]);
    // }



    const existingCaseCourtDetailOne = await queryAsync('SELECT * FROM case_court_detail_one WHERE fir_id = ?', [ogId]);

    if (existingCaseCourtDetailOne.length > 0) {
      await queryAsync(`
    UPDATE case_court_detail_one SET
    fir_id = ?,
      court_name = ?,
      court_district = ?,
      case_number = ?,
      CRL_number = ?,
      public_prosecutor = ?,
      prosecutor_phone = ?,
      second_hearing_date = ?,
      judgement_awarded = ?,
      judgementNature = ?,
      Conviction_Type = ?,
      Judgement_Date = ?,
      judgement_copy = ?,
      judgement_nature_remarks = ?
  
    WHERE fir_id = ?
  `, [
        ogId,
        parsedTrialDetailsOne.courtName ? parsedTrialDetailsOne.courtName : null ,
        parsedTrialDetailsOne.courtDistrict ? parsedTrialDetailsOne.courtDistrict : null ,
        parsedTrialDetailsOne.trialCaseNumber ? parsedTrialDetailsOne.trialCaseNumber : null ,
        parsedTrialDetailsOne.CRL_number ? parsedTrialDetailsOne.CRL_number : null ,
        parsedTrialDetailsOne.publicProsecutor ? parsedTrialDetailsOne.publicProsecutor : null ,
        parsedTrialDetailsOne.prosecutorPhone ? parsedTrialDetailsOne.prosecutorPhone : null ,
        parsedTrialDetailsOne.firstHearingDate ? parsedTrialDetailsOne.firstHearingDate : null,
        parsedTrialDetailsOne.judgementAwarded ? parsedTrialDetailsOne.judgementAwarded : 'no',
        parsedTrialDetailsOne.judgementNature ? parsedTrialDetailsOne.judgementNature : null ,
        parsedTrialDetailsOne.Conviction_Type ? parsedTrialDetailsOne.Conviction_Type : null,
        parsedTrialDetailsOne.Judgement_Date ? parsedTrialDetailsOne.Judgement_Date : null,
        parsedTrialDetailsOne.uploadJudgement ? parsedTrialDetailsOne.uploadJudgement : null,
        parsedTrialDetailsOne.judgement_nature_remarks ? parsedTrialDetailsOne.judgement_nature_remarks : null,
        ogId
      ]);
    } else {
      await queryAsync(`
    INSERT INTO case_court_detail_one (
      fir_id, case_id , court_name, court_district, case_number, CRL_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature, Conviction_Type, Judgement_Date, judgement_copy, judgement_nature_remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
        ogId,
        randomCaseId_1,
        parsedTrialDetailsOne.courtName ? parsedTrialDetailsOne.courtName : null,
        parsedTrialDetailsOne.courtDistrict ? parsedTrialDetailsOne.courtDistrict : null,
        parsedTrialDetailsOne.trialCaseNumber ? parsedTrialDetailsOne.trialCaseNumber : null,
        parsedTrialDetailsOne.CRL_number ? parsedTrialDetailsOne.CRL_number : null,
        parsedTrialDetailsOne.publicProsecutor ? parsedTrialDetailsOne.publicProsecutor : null,
        parsedTrialDetailsOne.prosecutorPhone ? parsedTrialDetailsOne.prosecutorPhone : null,
        parsedTrialDetailsOne.firstHearingDate ? parsedTrialDetailsOne.firstHearingDate : null,
        parsedTrialDetailsOne.judgementAwarded ? parsedTrialDetailsOne.judgementAwarded : 'no',
        parsedTrialDetailsOne.judgementNature ? parsedTrialDetailsOne.judgementNature : null,
        parsedTrialDetailsOne.Conviction_Type ? parsedTrialDetailsOne.Conviction_Type : null,
        parsedTrialDetailsOne.Judgement_Date ? parsedTrialDetailsOne.Judgement_Date : null,
        parsedTrialDetailsOne.uploadJudgement ? parsedTrialDetailsOne.uploadJudgement : null,
        parsedTrialDetailsOne.judgement_nature_remarks ? parsedTrialDetailsOne.judgement_nature_remarks : null,

      ]);
    }

    for (const [index, victim] of parsedVictimsRelief.entries()) {
      const victimId = victim.victimId || generateRandomId();
      const checkQuery = `SELECT * FROM trial_relief WHERE fir_id = ? AND victim_id = ?`;

      await new Promise((resolve, reject) => {
        connection.query(checkQuery, [firId, victimId], (err, results) => {
          if (err) return reject(err);

          const values = [
            victim.victimName || `Victim ${index + 1}`,
            victim.reliefAmountScst_2 || '0.00',
            victim.reliefAmountExGratia_2 || '0.00',
            victim.reliefAmountThirdStage || '0.00',
            firId,
            victimId,
          ];

          const query = results.length > 0
            ? `UPDATE trial_relief SET
                  victim_name = ?, relief_amount_act = ?, relief_amount_government = ?, relief_amount_final_stage = ?
                 WHERE fir_id = ? AND victim_id = ?`
            : `INSERT INTO trial_relief (
                  victim_name, relief_amount_act, relief_amount_government, relief_amount_final_stage,
                  fir_id, victim_id
                ) VALUES (?, ?, ?, ?, ?, ?)`;

          connection.query(query, values, (err) => (err ? reject(err) : resolve()));
        });
      });
    }


    const existingCaseCourtDetailTwo = await queryAsync('SELECT * FROM case_court_details_two WHERE fir_id = ?', [ogId]);

    if (existingCaseCourtDetailTwo.length > 0) {
      await queryAsync(`
    UPDATE case_court_details_two SET
    fir_id = ?,
      court_name = ?,
      court_district = ?,
      case_number = ?,
      CRL_number = ?,
      public_prosecutor = ?,
      prosecutor_phone = ?,
      second_hearing_date = ?,
      judgement_awarded = ?,
      judgementNature = ?,
      Conviction_Type = ?,
      Judgement_Date = ?,
      judgement_copy = ?,
      judgement_nature_remarks = ?

    WHERE fir_id = ?
  `, [
        ogId,
        parsedTrialDetailsTwo.courtName ? parsedTrialDetailsTwo.courtName : null,
        parsedTrialDetailsTwo.courtDistrict ? parsedTrialDetailsTwo.courtDistrict : null,
        parsedTrialDetailsTwo.trialCaseNumber ? parsedTrialDetailsTwo.trialCaseNumber : null,
        parsedTrialDetailsTwo.CRL_number ? parsedTrialDetailsTwo.CRL_number : null,
        parsedTrialDetailsTwo.publicProsecutor ? parsedTrialDetailsTwo.publicProsecutor : null,
        parsedTrialDetailsTwo.prosecutorPhone ? parsedTrialDetailsTwo.prosecutorPhone : null,
        parsedTrialDetailsTwo.firstHearingDate ? parsedTrialDetailsTwo.firstHearingDate : null,
        parsedTrialDetailsTwo.judgementAwarded ? parsedTrialDetailsTwo.judgementAwarded : 'no',
        parsedTrialDetailsTwo.judgementNature ? parsedTrialDetailsTwo.judgementNature : null,
        parsedTrialDetailsTwo.Conviction_Type ? parsedTrialDetailsTwo.Conviction_Type : null,
        parsedTrialDetailsTwo.Judgement_Date ? parsedTrialDetailsTwo.Judgement_Date : null,
        parsedTrialDetailsTwo.uploadJudgement ? parsedTrialDetailsTwo.uploadJudgement : null,
        parsedTrialDetailsTwo.judgement_nature_remarks ? parsedTrialDetailsTwo.judgement_nature_remarks : null,
        ogId
      ]);
    } else {
      await queryAsync(`
    INSERT INTO case_court_details_two (
      fir_id, case_id, court_name, court_district, case_number, CRL_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature, Conviction_Type, Judgement_Date, judgement_copy, judgement_nature_remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ? ,? ,?)
  `, [
        ogId,
        randomCaseId_1,
        parsedTrialDetailsTwo.courtName ? parsedTrialDetailsTwo.courtName : null,
        parsedTrialDetailsTwo.courtDistrict ? parsedTrialDetailsTwo.courtDistrict : null,
        parsedTrialDetailsTwo.trialCaseNumber ? parsedTrialDetailsTwo.trialCaseNumber : null,
        parsedTrialDetailsTwo.CRL_number ? parsedTrialDetailsTwo.CRL_number : null,
        parsedTrialDetailsTwo.publicProsecutor ? parsedTrialDetailsTwo.publicProsecutor : null,
        parsedTrialDetailsTwo.prosecutorPhone ? parsedTrialDetailsTwo.prosecutorPhone : null,
        parsedTrialDetailsTwo.firstHearingDate ? parsedTrialDetailsTwo.firstHearingDate : null,
        parsedTrialDetailsTwo.judgementAwarded ? parsedTrialDetailsTwo.judgementAwarded : 'no',
        parsedTrialDetailsTwo.judgementNature ? parsedTrialDetailsTwo.judgementNature : null,
        parsedTrialDetailsTwo.Conviction_Type ? parsedTrialDetailsTwo.Conviction_Type : null,
        parsedTrialDetailsTwo.Judgement_Date ? parsedTrialDetailsTwo.Judgement_Date : null,
        parsedTrialDetailsTwo.uploadJudgement ? parsedTrialDetailsTwo.uploadJudgement : null,
        parsedTrialDetailsTwo.judgement_nature_remarks ? parsedTrialDetailsTwo.judgement_nature_remarks : null,

      ]);
    }

 
    const existingCompensation = await queryAsync(
      `SELECT * FROM fir_trial WHERE fir_id = ?`,
      [ogId]
    );

    if (existingCompensation.length > 0) {
      // If record exists, update it
      await queryAsync(`
      UPDATE fir_trial
      SET 
          total_amount_third_stage = ?, 
          proceedings_file_no = ?, 
          proceedings_date = ?, 
          Commissionerate_file = ?
      WHERE fir_id = ?;
  `, [
        parsedCompensationDetails.totalCompensation,
        parsedCompensationDetails.proceedingsFileNo,
        parsedCompensationDetails.proceedingsDate ? parsedCompensationDetails.proceedingsDate : null,
        parsedCompensationDetails.uploadProceedings,
        ogId
      ]);
    } else {
      // If no record exists, insert a new one
      await queryAsync(`
      INSERT INTO fir_trial (
          fir_id, 
          case_id,
          total_amount_third_stage, 
          proceedings_file_no, 
          proceedings_date, 
          Commissionerate_file
      ) VALUES (?, ?, ?, ?, ?, ?);
  `, [
        ogId,
        randomCaseId_1,
        parsedCompensationDetails.totalCompensation,
        parsedCompensationDetails.proceedingsFileNo,
        parsedCompensationDetails.proceedingsDate ? parsedCompensationDetails.proceedingsDate : null,
        parsedCompensationDetails.uploadProceedings
      ]);
    }

    async function upsertCompensationDetails(tableName, parsedCompensationDetails) {
      const existingCompensation = await queryAsync(
        `SELECT * FROM ${tableName} WHERE fir_id = ?`,
        [ogId]
      );

      if (existingCompensation.length > 0) {
        await queryAsync(`
                  UPDATE ${tableName}
                  SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, upload_proceedings = ?
                  WHERE fir_id = ?
              `, [
          parsedCompensationDetails.totalCompensation ? parsedCompensationDetails.totalCompensation : null,
          parsedCompensationDetails.proceedingsFileNo,
          parsedCompensationDetails.proceedingsDate ? parsedCompensationDetails.proceedingsDate : null,
          parsedCompensationDetails.uploadProceedings,
          ogId,

        ]);
      } else {
        await queryAsync(`
                  INSERT INTO ${tableName} 
                      (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
                  VALUES (?, ?, ?, ?, ?, ?)
              `, [
          ogId,
          randomCaseId_1,
          parsedCompensationDetails.totalCompensation ? parsedCompensationDetails.totalCompensation : 0,
          parsedCompensationDetails.proceedingsFileNo,
          parsedCompensationDetails.proceedingsDate ? parsedCompensationDetails.proceedingsDate : null,
          parsedCompensationDetails.uploadProceedings
        ]);
      }
    }

    await upsertCompensationDetails('compensation_details', parsedCompensationDetails);
    await upsertCompensationDetails('compensation_details_1', parsedCompensationDetails_1);
    await upsertCompensationDetails('compensation_details_2', parsedCompensationDetails_2);

    const appealTables = [
      { table: 'appeal_details', data: parsedAppealDetails },
      { table: 'appeal_details_one', data: parsedAppealDetailsOne },
      { table: 'case_appeal_details_two', data: parsedCaseAppealDetailsTwo },
    ];

    for (const { table, data } of appealTables) {
      if (data) {

        const existingRecord = await queryAsync(`SELECT * FROM ${table} WHERE fir_id = ?`, [ogId]);
        // console.log('ogId:', ogId);

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
            data.legal_opinion_obtained ? data.legal_opinion_obtained : null,
            data.case_fit_for_appeal ? data.case_fit_for_appeal : null,
            data.government_approval_for_appeal ? data.government_approval_for_appeal : null,
            data.filed_by ? data.filed_by : null,
            data.designated_court ? data.designated_court : null,
            data.judgementNature ? data.designated_court : null,
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
        // console.log(`Cleared existing data for fir_id: ${ogId} in ${tableName}`);
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
          // console.log(`Inserted record into ${tableName}: ${nextHearingDate}, ${reasonNextHearing}`);
        } catch (error) {
          console.error(`Database error for table "${tableName}":`, error);
        }
      }
    }

    if (attachments && attachments.length > 0 && attachments[0] != null) {

      await queryAsync(` DELETE FROM case_attachments WHERE fir_id = ? `, [ogId]);

      for (const attachment of attachments) {
        await queryAsync(`
            INSERT INTO case_attachments (fir_id, file_name)
            VALUES (?, ?)
          `, [ogId, attachment]);
      }
    } else {
      await queryAsync(` DELETE FROM case_attachments WHERE fir_id = ? `, [ogId]);
    }

    connection.commit((err) => {
      if (err) {
        // console.log(err)
        connection.rollback(() => res.status(500).json({ message: 'Transaction commit error'}));
      }
      res.status(200).json({ message: 'Step 7 updated successfully.' });
    });
  } catch (error) {
    // console.log(error)
    connection.rollback(() => res.status(500).json({ message: 'Transaction failed' }));
  }
};


const queryAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};



// exports.deleteAccused = (req, res) => {
//   const { accusedId , UserId , number_of_accused, fir_id} = req.body;

//   // Check if FIR ID and status are provided
//   if (!accusedId) {
//     return res.status(400).json({ message: 'Accused ID is required' });
//   }

//   // Update the status in the database
//   const query = `
//     UPDATE accuseds
//     SET delete_status = 1
//     WHERE accused_id = ?
//   `;
//   const values = [accusedId];

//   db.query(query, values, (err, result) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to delete accused detail'});
//     }

//     if (result.affectedRows > 0) {
//       return res.status(200).json({ message: 'accused detail deleted successfully' });
//     } else {
//       return res.status(404).json({ message: 'accused not found' });
//     }
//   });
// };



exports.deleteAccused = (req, res) => {
  const { accusedId, UserId, number_of_accused, fir_id } = req.body;

  // Validation
  if (!accusedId || !UserId || !number_of_accused || !fir_id) {
    return res.status(400).json({ 
      message: 'Accused ID, User ID, number of accused, and FIR ID are required' 
    });
  }

  // Get connection from pool
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to get database connection'});
    }

    // Start transaction on the specific connection
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Failed to start transaction'});
      }

      // Step 1: Get accused details before deletion for logging
      const getAccusedQuery = `
        SELECT * FROM accuseds WHERE accused_id = ?
      `;

      connection.query(getAccusedQuery, [accusedId], (err, accusedResult) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ message: 'Failed to fetch accused details'});
          });
        }

        if (accusedResult.length === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(404).json({ message: 'Accused not found' });
          });
        }

        const accusedData = accusedResult[0];

        // Step 2: Update accused table - set delete_status = 1
        const deleteAccusedQuery = `
          UPDATE accuseds
          SET delete_status = 1
          WHERE accused_id = ?
        `;

        connection.query(deleteAccusedQuery, [accusedId], (err, deleteResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ message: 'Failed to delete accused detail'});
            });
          }

          // Step 3: Update fir_add table with new number_of_accused
          const updateFirQuery = `
            UPDATE fir_add
            SET number_of_accused = ?
            WHERE fir_id = ?
          `;

          connection.query(updateFirQuery, [number_of_accused, fir_id], (err, updateResult) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: 'Failed to update FIR accused count'});
              });
            }

            // Step 4: Insert into log table with all accused table fields
            const logQuery = `
              INSERT INTO accused_delete_log (
                user_id, fir_id, accused_id, age, name, gender, custom_gender, 
                address, pincode, community, caste, guardian_name, previous_incident, 
                previous_fir_number, previous_fir_number_suffix, scst_offence, 
                scst_fir_number, scst_fir_number_suffix, antecedentsOption, 
                antecedents, landOIssueOption, land_o_issues, gist_of_current_case, 
                upload_fir_copy, previous_incident_remarks, previous_offence_remarks, 
                delete_status, deleted_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const logValues = [
              UserId,
              fir_id,
              accusedData.accused_id,
              accusedData.age,
              accusedData.name,
              accusedData.gender,
              accusedData.custom_gender,
              accusedData.address,
              accusedData.pincode,
              accusedData.community,
              accusedData.caste,
              accusedData.guardian_name,
              accusedData.previous_incident,
              accusedData.previous_fir_number,
              accusedData.previous_fir_number_suffix,
              accusedData.scst_offence,
              accusedData.scst_fir_number,
              accusedData.scst_fir_number_suffix,
              accusedData.antecedentsOption,
              accusedData.antecedents,
              accusedData.landOIssueOption,
              accusedData.land_o_issues,
              accusedData.gist_of_current_case,
              accusedData.upload_fir_copy,
              accusedData.previous_incident_remarks,
              accusedData.previous_offence_remarks,
              accusedData.delete_status
            ];

            connection.query(logQuery, logValues, (err, logResult) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ message: 'Failed to log deletion activity'});
                });
              }

              // Commit the transaction
              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ message: 'Failed to commit transaction'});
                  });
                }

                // Release connection back to pool
                connection.release();

                // Success response
                res.status(200).json({
                  message: 'Accused deleted successfully',
                  data: {
                    accused_id: accusedId,
                    fir_id: fir_id,
                    new_accused_count: number_of_accused
                  }
                });
              });
            });
          });
        });
      });
    });
  });
};





exports.deleteVictim = (req, res) => {
  const { victim_id, UserId, number_of_victim, fir_id } = req.body;

  // Validation
  if (!victim_id || !UserId || !number_of_victim || !fir_id) {
    return res.status(400).json({ 
      message: 'Victim ID, User ID, number of victims, and FIR ID are required' 
    });
  }

  // Get connection from pool
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to get database connection'});
    }

    // Start transaction on the specific connection
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Failed to start transaction'});
      }

      // Step 1: Get victim details before deletion for logging
      const getVictimQuery = `
        SELECT * FROM victims WHERE victim_id = ?
      `;

      connection.query(getVictimQuery, [victim_id], (err, victimResult) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ message: 'Failed to fetch victim details'});
          });
        }

        if (victimResult.length === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(404).json({ message: 'Victim not found' });
          });
        }

        const victimData = victimResult[0];

        // Step 2: Update victims table - set delete_status = 1
        const deleteVictimQuery = `
          UPDATE victims
          SET delete_status = 1
          WHERE victim_id = ?
        `;

        connection.query(deleteVictimQuery, [victim_id], (err, deleteResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ message: 'Failed to delete victim detail'});
            });
          }

          // Step 3: Update fir_add table with new number_of_victim
          const updateFirQuery = `
            UPDATE fir_add
            SET number_of_victim = ?
            WHERE fir_id = ?
          `;

          connection.query(updateFirQuery, [number_of_victim, fir_id], (err, updateResult) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: 'Failed to update FIR victim count'});
              });
            }

            // Step 4: Insert into victim_delete_log table with all victim table fields
            const logQuery = `
              INSERT INTO victim_delete_log (
                user_id, fir_id, victim_id, victim_name, victim_age, victim_gender, 
                custom_gender, mobile_number, address, victim_pincode, community, 
                caste, guardian_name, is_native_district_same, native_district, 
                offence_committed, sectionsIPC, sectionsIPC_JSON, scst_sections, 
                fir_stage_as_per_act, fir_stage_ex_gratia, chargesheet_stage_as_per_act, 
                chargesheet_stage_ex_gratia, final_stage_as_per_act, final_stage_ex_gratia, 
                relief_applicable, delete_status, deleted_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const logValues = [
              UserId,
              fir_id,
              victimData.victim_id,
              victimData.victim_name,
              victimData.victim_age,
              victimData.victim_gender,
              victimData.custom_gender,
              victimData.mobile_number,
              victimData.address,
              victimData.victim_pincode,
              victimData.community,
              victimData.caste,
              victimData.guardian_name,
              victimData.is_native_district_same,
              victimData.native_district,
              victimData.offence_committed,
              victimData.sectionsIPC,
              victimData.sectionsIPC_JSON,
              victimData.scst_sections,
              victimData.fir_stage_as_per_act,
              victimData.fir_stage_ex_gratia,
              victimData.chargesheet_stage_as_per_act,
              victimData.chargesheet_stage_ex_gratia,
              victimData.final_stage_as_per_act,
              victimData.final_stage_ex_gratia,
              victimData.relief_applicable,
              1 // delete_status
            ];

            connection.query(logQuery, logValues, (err, logResult) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ message: 'Failed to log deletion activity'});
                });
              }

              // Commit the transaction
              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ message: 'Failed to commit transaction'});
                  });
                }

                // Release connection back to pool
                connection.release();

                // Success response
                res.status(200).json({
                  message: 'Victim deleted successfully',
                  data: {
                    victim_id: victim_id,
                    fir_id: fir_id,
                    new_victim_count: number_of_victim
                  }
                });
              });
            });
          });
        });
      });
    });
  });
};