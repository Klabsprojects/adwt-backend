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

        console.log(victim.victim_id);
        if (victim.victim_id) {

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
            victim.victim_id,
          ];
          console.log(updateVictimQuery,updateVictimValues)
          db.query(updateVictimQuery, updateVictimValues, (err) => {
            if (err) return reject(err);
            resolve({ victim_id: victim.victim_id });
          });
        } else {
          
          const victim_id = generateRandomId(6);
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
            victim_id, 
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
            resolve({ victim_id });
          });
        }
      });
    });

    Promise.all(victimPromises)
      .then((results) => {
        const updatedVictims = victims.map((victim, index) => ({
          ...victim,
          victim_id: results[index].victim_id,
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


// mahi code

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); 
  },
  filename: (req, file, cb) => {
   
    const fileExtension = file.mimetype.split('/')[1]; 
    const fileName = `${uuidv4()}.${fileExtension}`; 
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  cb(null, true); 
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// // Use this in your endpoint to handle the file upload

exports.handleStepFour = (req, res) => {


  upload.array('uploadFIRCopy[]', 5)(req, res, (err)=> {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Failed to upload file', message: err.message });
    }

    const { firId, numberOfAccused, accuseds: accusedsRaw } = req.body;
    const files = req.files; 

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

    let filePaths = files.map(file => file.path).join(', '); 
    accuseds = accuseds.map((accused, index) => {
      accused.uploadFIRCopy = files[index] ? files[index].path : null; 
      return accused;
    });
   

    const updateFirQuery = `
      UPDATE fir_add
      SET
        number_of_accused = ?
      WHERE fir_id = ?;
    `;

    
 
    const updateFirValues = [numberOfAccused, files ? files.path : null, firId];

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
                gist_of_current_case = ?, upload_fir_copy = ?
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
              accused.uploadFIRCopy,
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
                scst_fir_number, scst_fir_number_suffix, antecedents, land_o_issues, gist_of_current_case,upload_fir_copy
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?);
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
              accused.uploadFIRCopy,
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
            file: files ? files.path : null, 
          });
        })
        .catch((err) => {
          console.error("Failed to process accused data:", err);
          res.status(500).json({ message: "Failed to process accused data", error: err.message });
        });
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

const storage_step5 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where files will be stored
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
exports.handleStepFive = (req, res) => {
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
    const attachments = req.files['attachment s'] || [];

    if (!firId) {
      return res.status(400).json({ message: 'FIR ID is missing.' });
    }

    const generateRandomId = (length = 6) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    };

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ message: 'Transaction error', error: err });

      const savedData = { victims: [], proceedings: null, attachments: [] };

      const victimPromises = victimsRelief.map((victim, index) => {
        return new Promise((resolve, reject) => {
          const victimId = victim.victimId || generateRandomId(6);
          const reliefId = victim.reliefId || generateRandomId(6);

          const insertQuery = `
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
            victimId,
            reliefId,
            firId,
            victim.victimName || `Victim ${index + 1}`,
            victim.communityCertificate || 'no',
            victim.reliefAmountScst || '0.00',
            victim.reliefAmountExGratia || '0.00',
            victim.reliefAmountFirstStage || '0.00',
            JSON.stringify(victim.additionalRelief || []),
          ];

          db.query(insertQuery, values, (err) => {
            if (err) return reject({ step: 'victim_relief', error: err });

            const selectQuery = 'SELECT * FROM victim_relief WHERE victim_id = ?';
            db.query(selectQuery, [victimId], (err, result) => {
              if (err) return reject({ step: 'select_victim_relief', error: err });
              savedData.victims.push(result[0]);
              resolve();
            });
          });
        });
      });

    // Insert or update proceedings data
    const proceedingsPromise = new Promise((resolve, reject) => {
      const proceedingsId = generateRandomId(6);
        const insertQuery = `
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

        db.query(insertQuery, values, (err) => {
          if (err) return reject({ step: 'proceedings_victim_relief', error: err });

          const selectQuery = 'SELECT * FROM proceedings_victim_relief WHERE proceedings_id = ?';
          db.query(selectQuery, [proceedingsId], (err, result) => {
            if (err) return reject({ step: 'select_proceedings_victim_relief', error: err });
            savedData.proceedings = result[0];
            resolve();
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
              savedData.attachments.push(result[0]);
              resolve();
            });
          });
        });
      });

      Promise.all([...victimPromises, proceedingsPromise, ...attachmentPromises])
        .then(() => {
          db.commit((err) => {
            if (err) {
              return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
            }
            res.status(200).json({ message: 'Step 5 data saved successfully, including attachments.', data: savedData });
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


const upload_step6 = multer({ storage: storage_step5 }).fields([
  { name: 'proceedingsFile', maxCount: 1 },
  { name: 'attachments', maxCount: 10 }
]);

exports.handleStepSix = (req, res) => {
  upload_step6(req, res, (err) => {
    if (err) return res.status(500).json({ message: 'File upload error', error: err });

    const { firId, chargesheetDetails, victimsRelief } = req.body;

    console.log("Chargesheet Details:", chargesheetDetails);

    const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].path : null;
    const attachments = req.files['attachments'] || [];
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

      // Update FIR Status
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

      // Parse chargesheetDetails
      let parsedChargesheetDetails;
      try {
        parsedChargesheetDetails = JSON.parse(chargesheetDetails);
      } catch (error) {
        console.error('Error parsing chargesheetDetails:', error);
        return res.status(400).json({ message: 'Invalid chargesheetDetails data format' });
      }

      // Generate chargesheetId and insert chargesheet data
      const chargesheetId = parsedChargesheetDetails.chargesheetId || generateRandomId();
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
          parsedChargesheetDetails.chargeSheetFiled || null,
          parsedChargesheetDetails.courtDistrict || null,
          parsedChargesheetDetails.courtName || null,
          parsedChargesheetDetails.caseType || null,
          parsedChargesheetDetails.caseNumber || null,
          parsedChargesheetDetails.rcsFileNumber || null,
          parsedChargesheetDetails.rcsFilingDate || null,
          parsedChargesheetDetails.mfCopyPath || null,
          parsedChargesheetDetails.totalCompensation || null,
          parsedChargesheetDetails.proceedingsFileNo || null,
          parsedChargesheetDetails.proceedingsDate || null,
          proceedingsFile || null,
        ];

        db.query(query, values, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      // Parse victimsRelief
      let parsedVictimsRelief = [];
      try {
        parsedVictimsRelief = JSON.parse(victimsRelief);
      } catch (error) {
        console.error('Error parsing victimsRelief:', error);
        return res.status(400).json({ message: 'Invalid victimsRelief data format' });
      }

      // Insert victim data
      const victimPromises = parsedVictimsRelief.map((victim, index) => {
        return new Promise((resolve, reject) => {
          const victimId = victim.victimId || generateRandomId(); 
          console.log('Victim Data:', victim);
          console.log('Relief Amounts:', {
            scst: victim.reliefAmountScst,
            exGratia: victim.reliefAmountExGratia,
            secondStage: victim.reliefAmountSecondStage,
          });

          const query = `
            INSERT INTO chargesheet_victims (
              fir_id, victim_id, chargesheet_id, victim_name,
              relief_amount_scst_1, relief_amount_ex_gratia_1, relief_amount_second_stage
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
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
            if (err) {
              console.error('Error inserting victim data:', err);
              return reject(err);
            }
            resolve();
          });
        });
      });

      // Insert attachment data
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
            attachment.path || null,
          ];

          db.query(query, values, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      // Execute all promises and commit transaction
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
      return res.status(200).json({ status:true,message:"Deleted Successfully" });
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
      return res.status(200).json({ status:true,message:"Deleted Successfully" });
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
  const { community } = req.query;
  // console.log('Community parameter:', community); // Log the community value
  
  if (!community) {
    return res.status(400).json({ message: 'Community parameter is missing' });
  }

  const query = 'SELECT caste_name FROM caste_community WHERE community_name = ?';
  db.query(query, [community], (err, results) => {
    if (err) {
      // console.error('Error executing query:', err); // Log detailed error
      return res.status(500).json({ message: 'Failed to fetch caste names', error: err });
    }
    // console.log('Query results:', results); // Log results for debugging
    res.json(results.map(row => row.caste_name));
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


// mahi changes 
exports.getVictimsReliefDetails = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

 
  const queryVictims = `
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

  db.query(queryVictims, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch victim details', error: err });
    }

    const victimPromises = results.map((victim) => {
      const queryRelief = `
        SELECT *
        FROM victim_relief
        WHERE victim_id = ?
      `;

      return new Promise((resolve, reject) => {
        db.query(queryRelief, [victim.victim_id], (err, reliefResults) => {
          if (err) {
            return reject(err);
          }

          if (reliefResults.length > 0) {
            const reliefData = reliefResults[0]; 
            const mergedVictim = {
              ...victim, 
              ...reliefData, 
            };

            resolve(mergedVictim);
          } else {
            resolve(victim);
          }
        });
      });
    });

    Promise.all(victimPromises)
      .then((victimsWithRelief) => {
        return res.status(200).json({ victimsReliefDetails: victimsWithRelief });
      })
      .catch((error) => {
        console.error('Error fetching relief details:', error);
        return res.status(500).json({ message: 'Failed to fetch relief details', error });
      });
  });
};


exports.getFirDetails = async  (req, res) => {
  const { fir_id } = req.query;

  if (!fir_id) {
    return res.status(400).json({ message: 'FIR ID is required.' });
  }

  const query = `SELECT * FROM fir_add WHERE fir_id = ?`;

  db.query(query, [fir_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error fetching FIR details.', error: err });
    }

    const query1 = `SELECT * FROM victims WHERE fir_id = ?`;

    db.query(query1, [fir_id], (err, result1) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching victims.', error: err });
      }

      const query2 = `SELECT * FROM accuseds WHERE fir_id = ?`;

      db.query(query2, [fir_id], (err, result2) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error fetching accused.', error: err });
        }

        const query3 = `
        SELECT 
          *
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

        db.query(query3, [fir_id], (err, result3) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching proceedings victim relief.', error: err });
          }

          const query4 = `
          SELECT  
            cd.*, 
            ca.attachment_id AS attachment_id, 
            ca.file_path
          FROM 
            chargesheet_details cd
          LEFT JOIN 
            chargesheet_attachments ca ON cd.fir_id = ca.fir_id
          WHERE 
            cd.fir_id = ?
          `;

          db.query(query4, [fir_id], (err, result4) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Error fetching chargesheet details.', error: err });
            }

            let chargesheetData = null;
            let attachments = [];

            if (result4.length > 0) {
              chargesheetData = {
                fir_id: result4[0].fir_id,
                charge_sheet_filed: result4[0].charge_sheet_filed,
                court_district: result4[0].court_district,
                court_name: result4[0].court_name,
                case_type: result4[0].case_type,
                case_number: result4[0].case_number,
                rcs_file_number: result4[0].rcs_file_number,
                rcs_filing_date: result4[0].rcs_filing_date,
                mf_copy_path: result4[0].mf_copy_path,
                total_compensation_1: result4[0].total_compensation_1,
                proceedings_file_no: result4[0].proceedings_file_no,
                proceedings_date: result4[0].proceedings_date,
                upload_proceedings_path: result4[0].upload_proceedings_path,
                attachments: result4
                  .filter(row => row.attachment_id !== null)
                  .map(row => ({
                    id: row.attachment_id,
                    path: row.file_path
                  }))
              };
            }

            const query5 = `SELECT * FROM case_details WHERE fir_id = ?`;

            db.query(query5, [fir_id], (err, result5) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error fetching case details.', error: err });
              }

              const query6 = `SELECT * FROM fir_trial WHERE fir_id = ?`;
              db.query(query6, [fir_id], async (err, result6) => {
                if (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Error fetching FIR trial.', error: err });
                }


 const hearingDetailsOne = await queryAsync('SELECT * FROM hearing_details_one WHERE fir_id = ?', [fir_id]);
    const hearingDetailsTwo = await queryAsync('SELECT * FROM hearing_details_two WHERE fir_id = ?', [fir_id]);
    const hearingDetailsThree = await queryAsync('SELECT * FROM hearing_details_three WHERE fir_id = ?', [fir_id]);

    // Appeal details (all 3)
    const appealDetails = await queryAsync('SELECT * FROM appeal_details WHERE fir_id = ?', [fir_id]);
    const appealDetailsOne = await queryAsync('SELECT * FROM appeal_details_one WHERE fir_id = ?', [fir_id]);
    const caseAppealDetailsTwo = await queryAsync('SELECT * FROM case_appeal_details_two WHERE fir_id = ?', [fir_id]);



    // 
    // casedetail_one
    const casedetail_one = await queryAsync('SELECT * FROM case_court_detail_one WHERE fir_id = ?', [fir_id]);
    const casedetail_two = await queryAsync('SELECT * FROM case_court_details_two WHERE fir_id = ?', [fir_id]);

    console.log(casedetail_two);
                return res.status(200).json({
                  data: result[0],
                  data1: result1,
                  data2: result2,
                  data3: result3[0],
                  data4: chargesheetData, // Includes attachments array
                  data5: result5,
                  casedetail_one:casedetail_one,
                  casedetail_two:casedetail_two,
                  data6: result6[0],
                  hearingDetails: hearingDetailsOne,
                  hearingDetails_one: hearingDetailsTwo,
                  hearingDetails_two: hearingDetailsThree,
                  appeal_details: appealDetails,
                  appeal_details_one: appealDetailsOne,
                  case_appeal_details_two: caseAppealDetailsTwo,
             
                });
              });
            });
          });
        });
      });
    });
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


  if(case_id){
    db.query(
      'UPDATE fir_details SET Court_name = ?, court_district = ?, trial_case_number = ?, public_prosecutor = ?, prosecutor_phone = ?,first_hearing_date = ?,judgement_awarded = ? WHERE fir_id = ? AND case_id = ?',
      [Court_name, courtDistrict1, caseNumber, publicProsecutor, prosecutorPhone,firstHearingDate,judgementAwarded, firId, case_id]
    )

    .then(() => {
      if(case_id1){
        return db.query(
          'UPDATE fir_details SET Court_name = ?, court_district = ?, trial_case_number = ?, public_prosecutor = ?, prosecutor_phone = ?,first_hearing_date = ?,judgement_awarded = ? WHERE fir_id = ? AND case_id = ?',
          [Court_one, courtDistrict_one, caseNumber_one, publicProsecutor_one, prosecutorPhone_one,firstHearingDate_one,judgementAwarded_one, firId, case_id1]
        )
      }
    })
    .then(() => {
      if(case_id2){
        db.query(
          'UPDATE fir_details SET Court_name = ?, court_district = ?, trial_case_number = ?, public_prosecutor = ?, prosecutor_phone = ?,first_hearing_date = ?,judgement_awarded = ? WHERE fir_id = ? AND case_id = ?',
          [Court_three, courtDistrict_two, caseNumber_two, publicProsecutor_two, prosecutorPhone_two,firstHearingDate_two,judgementAwarded_two, firId, case_id2]
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


// exports.saveStepSevenAsDraft = (req, res) => {

//   const { firId, trialDetails, compensationDetails, attachments, victimsDetails } = req.body;

//   if (!firId || !trialDetails || !compensationDetails) {
//       return res.status(400).json({ message: "Missing required fields." });
//   }

//   const caseId = generateRandomId(8); // Example: Length = 8 characters

//   db.beginTransaction((err) => {
//       if (err) return res.status(500).json({ message: "Transaction error", error: err });

//       // Insert into `case_details` with the generated `case_id`
//       const caseDetailsQuery = `
//           INSERT INTO case_details (
//               fir_id, case_id, court_name, court_district, trial_case_number,
//               public_prosecutor, prosecutor_phone, first_hearing_date, judgement_awarded
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//       const caseDetailsValues = [
//           firId,
//           caseId,
//           trialDetails.courtName,
//           trialDetails.courtDistrict,
//           trialDetails.trialCaseNumber,
//           trialDetails.publicProsecutor,
//           trialDetails.prosecutorPhone,
//           trialDetails.firstHearingDate,
//           trialDetails.judgementAwarded
          
//       ];

//       db.query(caseDetailsQuery, caseDetailsValues, (err) => {
//           if (err) return db.rollback(() => res.status(500).json({ message: "Error saving case details.", error: err }));

//           // Insert or Update `fir_trial` Table
//           const firTrialQuery = `
//               INSERT INTO fir_trial (
//                   fir_id, case_id, total_amount_third_stage, proceedings_file_no,
//                   proceedings_date, Commissionerate_file
//               ) VALUES (?, ?, ?, ?, ?, ?)
//               ON DUPLICATE KEY UPDATE
//                   total_amount_third_stage = VALUES(total_amount_third_stage),
//                   proceedings_file_no = VALUES(proceedings_file_no),
//                   proceedings_date = VALUES(proceedings_date),
//                   Commissionerate_file = VALUES(Commissionerate_file)
//           `;
//           const firTrialValues = [
//               firId,
//               caseId,
//               compensationDetails.totalCompensation,
//               compensationDetails.proceedingsFileNo,
//               compensationDetails.proceedingsDate,
//               compensationDetails.uploadProceedings
//           ];

//           db.query(firTrialQuery, firTrialValues, (err) => {
//               if (err) return db.rollback(() => res.status(500).json({ message: "Error saving fir_trial details.", error: err }));

//               // Insert into `trial_relief` Table (Victim Details)
//               const victimPromises = victimsDetails.map((victim) => {
//                   return new Promise((resolve, reject) => {
//                       const trialId = generateRandomId(8); // Generate a random `trial_id` for each victim
//                       const victimQuery = `
//                           INSERT INTO trial_relief (
//                               fir_id, case_id, trial_id, victim_id, victim_name,
//                               relief_amount_act, relief_amount_government, relief_amount_final_stage
//                           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//                       `;
//                       const victimValues = [
//                           firId,
//                           caseId,
//                           trialId,
//                           victim.victimId,
//                           victim.victimName,
//                           victim.reliefAmountAct,
//                           victim.reliefAmountGovernment,
//                           victim.reliefAmountFinalStage
//                       ];

//                       db.query(victimQuery, victimValues, (err) => (err ? reject(err) : resolve()));
//                   });
//               });

//               // Update `fir_add` Table
//               const firAddQuery = `
//                   UPDATE fir_add
//                   SET nature_of_judgement = ?, judgement_copy = ?
//                   WHERE fir_id = ?
//               `;
//               const firAddValues = [
//                   trialDetails.judgementNature,
//                   compensationDetails.uploadProceedings,
//                   firId
//               ];

//               db.query(firAddQuery, firAddValues, (err) => {
//                   if (err) return db.rollback(() => res.status(500).json({ message: "Error updating fir_add.", error: err }));

//                   // Execute Victim Promises
//                   Promise.all(victimPromises)
//                       .then(() => {
//                           db.commit((err) => {
//                               if (err) return db.rollback(() => res.status(500).json({ message: "Transaction commit failed.", error: err }));
//                               res.status(200).json({ message: "Draft data saved successfully.", caseId });
//                           });
//                       })
//                       .catch((err) => {
//                           db.rollback(() => res.status(500).json({ message: "Error saving victim details.", error: err }));
//                       });
//               });
//           });
//       });
//   });
// };

// // Function to Generate Random IDs
// function generateRandomId(length) {
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   let result = '';
//   for (let i = 0; i < length; i++) {
//       result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// }


exports.saveStepSevenAsDraft = (req, res) => {
  // Destructure the request body
  const {
    firId,
    trialDetails,
    compensationDetails,
    attachments,
    appealDetails,
    appealDetailsOne,
    caseAppealDetailsTwo,
    hearingdetail
  } = req.body;

  console.log("Received request body:", hearingdetail);

  const parseJSON = (data) => {
    try {
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return {};
    }
  };
  const parsedHearingDetails = parseJSON(hearingdetail);

  const parsedTrialDetails = parseJSON(trialDetails);
  const parsedCompensationDetails = parseJSON(compensationDetails);
  const parsedAppealDetails = parseJSON(appealDetails);
  const parsedAppealDetailsOne = parseJSON(appealDetailsOne);
  const parsedCaseAppealDetailsTwo = parseJSON(caseAppealDetailsTwo);

  // Check if mandatory fields are missing
  if (!firId || !trialDetails || !compensationDetails) {
    console.log("Missing required fields:", { firId, trialDetails, compensationDetails });
    return res.status(400).json({ message: "Missing required fields." });
  }

  const convertArrayToString = (value) => {
    if (Array.isArray(value)) {
      return value.length ? value.join(',') : null;
    }
    return value;
  };

  const judgementAwarded = convertArrayToString(parsedTrialDetails.judgementAwarded);
  const judgementAwarded1 = convertArrayToString(parsedTrialDetails.judgementAwarded1);
  const judgementAwarded2 = convertArrayToString(parsedTrialDetails.judgementAwarded2);
  const judgementAwarded3 = convertArrayToString(parsedTrialDetails.judgementAwarded3);

  const caseId = generateRandomId(8);
  console.log("Generated case ID:", caseId);

  // Start a database transaction
  db.beginTransaction(async (err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ message: "Transaction error", error: err });
    }

    console.log("Transaction started.");

    try {
      const hearingTables = {
        hearingDetails: 'hearing_details_one',
        hearingDetails_one: 'hearing_details_two',
        hearingDetails_two: 'hearing_details_three',
      };

      for (const key in parsedHearingDetails) {
        if (!parsedHearingDetails.hasOwnProperty(key)) {
          continue;
        }
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
          await queryAsync(`DELETE FROM ${tableName} WHERE fir_id = ?`, [firId]);
          console.log(`Cleared existing data for fir_id: ${firId} in ${tableName}`);
        } catch (error) {
          console.error(`Failed to clear existing data for fir_id: ${firId} in ${tableName}`, error);
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
              [firId, nextHearingDate, reasonNextHearing]
            );
            console.log(`Inserted record into ${tableName}: ${nextHearingDate}, ${reasonNextHearing}`);
          } catch (error) {
            console.error(`Database error for table "${tableName}":`, error);
          }
        }
      }


      await queryAsync(
        `INSERT INTO case_details (
          fir_id, case_id, court_name, court_district, trial_case_number,
          public_prosecutor, prosecutor_phone, first_hearing_date, judgement_awarded,
          CaseHandledBy, NameOfAdvocate, advocateMobNumber,
          judgementAwarded1, judgementAwarded2, judgementAwarded3
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          firId,
          caseId,
          parsedTrialDetails.courtName,
          parsedTrialDetails.courtDistrict,
          parsedTrialDetails.trialCaseNumber,
          parsedTrialDetails.publicProsecutor,
          parsedTrialDetails.prosecutorPhone,
          parsedTrialDetails.firstHearingDate,
          judgementAwarded,
          parsedTrialDetails.CaseHandledBy || null,
          parsedTrialDetails.NameOfAdvocate || null,
          parsedTrialDetails.advocateMobNumber || null,
          judgementAwarded1,
          judgementAwarded2,
          judgementAwarded3
        ]
      );
      console.log("Executing case details query:", caseDetailsQuery);
      console.log("With values:", caseDetailsValues);

      if (parsedTrialDetails.judgementNature || parsedTrialDetails.uploadJudgement) {
        await queryAsync(
          `UPDATE fir_add SET nature_of_judgement = ?, judgement_copy = ? WHERE fir_id = ?`,
          [
            parsedTrialDetails.judgementNature,
            parsedTrialDetails.uploadJudgement,
            firId
          ]
        );
        console.log("Judgment details updated.");
      }

      await queryAsync(
        `INSERT INTO fir_trial (
          fir_id, case_id, total_amount_third_stage, proceedings_file_no,
          proceedings_date, Commissionerate_file
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_amount_third_stage = VALUES(total_amount_third_stage),
          proceedings_file_no = VALUES(proceedings_file_no),
          proceedings_date = VALUES(proceedings_date),
          Commissionerate_file = VALUES(Commissionerate_file)`,
        [
          firId,
          caseId,
          parsedCompensationDetails.totalCompensation,
          parsedCompensationDetails.proceedingsFileNo,
          parsedCompensationDetails.proceedingsDate,
          parsedCompensationDetails.uploadProceedings
        ]
      );

      console.log("Executing fir_trial query:", firTrialQuery);
      console.log("With values:", firTrialValues);

      if (appealDetails) {
        await queryAsync(
          `INSERT INTO appeal_details (
            fir_id, case_id, legal_opinion_obtained, case_fit_for_appeal,
            government_approval_for_appeal, filed_by, designated_court
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            firId,
            caseId,
            parsedAppealDetails.legalOpinionObtained,
            parsedAppealDetails.caseFitForAppeal,
            parsedAppealDetails.governmentApprovalForAppeal,
            parsedAppealDetails.filedBy,
            parsedAppealDetails.designatedCourt
          ]
        );
        console.log("Appeal details saved.");
      }

      if (appealDetailsOne) {
        await queryAsync(
          `INSERT INTO appeal_details_one (
            fir_id, case_id, legal_opinion_obtained, case_fit_for_appeal,
            government_approval_for_appeal, filed_by, designated_court, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            firId,
            caseId,
            parsedAppealDetailsOne.legalOpinionObtained,
            parsedAppealDetailsOne.caseFitForAppeal,
            parsedAppealDetailsOne.governmentApprovalForAppeal,
            parsedAppealDetailsOne.filedBy,
            parsedAppealDetailsOne.designatedCourt
          ]
        );
        console.log("Appeal details one saved.");
      }

      if (caseAppealDetailsTwo) {
        await queryAsync(
          `INSERT INTO case_appeal_details_two (
            fir_id, case_id, legal_opinion_obtained, case_fit_for_appeal,
            government_approval_for_appeal, filed_by, designated_court, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            firId,
            caseId,
            parsedCaseAppealDetailsTwo.legalOpinionObtained,
            parsedCaseAppealDetailsTwo.caseFitForAppeal,
            parsedCaseAppealDetailsTwo.governmentApprovalForAppeal,
            parsedCaseAppealDetailsTwo.filedBy,
            parsedCaseAppealDetailsTwo.designatedCourt
          ]
        );
        console.log("Case appeal details two saved.");
      }

      if (attachments && attachments.length > 0) {
        const attachmentQueries = attachments.map((attachment) => {
          return queryAsync(
            `INSERT INTO case_attachments (fir_id, case_id, file_name, uploaded_at, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
            [firId, caseId, attachment]
          );
        });
        await Promise.all(attachmentQueries);
        console.log("Attachments saved.");
      }

      await queryAsync(
        `INSERT INTO case_court_details_two (
          fir_id, case_id, case_number, public_prosecutor, prosecutor_phone, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          firId,
          caseId,
          parsedTrialDetails.trialCaseNumber,
          parsedTrialDetails.publicProsecutor,
          parsedTrialDetails.prosecutorPhone
        ]
      );

      console.log("Case court details two saved.");

      db.commit((err) => {
        if (err) {
          console.error("Transaction commit error:", err);
          return db.rollback(() =>
            res.status(500).json({ message: "Transaction commit error", error: err })
          );
        }
        console.log("fir_trial details saved successfully.");
        res.status(200).json({ message: "Step seven details saved successfully." }); // Send success response
      });

    } catch (error) {
      console.error("Transaction failed:", error);
      db.rollback(() => res.status(500).json({ message: "Transaction failed", error }));
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









