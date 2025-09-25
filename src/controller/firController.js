const db = require('../db'); // Make sure the path to the database file is correct
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const util = require('util');
const queryAsyncenhanced = util.promisify(db.query).bind(db);
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
//       return res.status(500).json({ message: 'Failed to fetch police division data' });
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
    complaintReceivedType,
    complaintRegisteredBy,
    complaintReceiverName,
    user_id
  } = firData;

  const policeStation = stationName;
  let query, values;

  let newFirId = firId;
  if (!firId || firId === '1' || firId === null) {
    newFirId = generateRandomId(6);
  }

  if (!firId || firId === '1' || firId === null) {
    query = `
      INSERT INTO fir_add (fir_id, police_city, police_zone, police_range, revenue_district, police_station, officer_name, officer_designation, officer_phone, status, created_at, complaintReceivedType, complaintRegisteredBy, complaintReceiverName,created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), ?, ? ,?, ?)
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
      complaintReceivedType,
      complaintRegisteredBy,
      complaintReceiverName,
      user_id
    ];
  } else {
    query = `
      UPDATE fir_add
      SET police_city = ?, police_zone = ?, police_range = ?, revenue_district = ?, police_station = ?, officer_name = ?, officer_designation = ?, officer_phone = ?, updated_at = NOW(), complaintReceivedType = ? , complaintRegisteredBy = ? , complaintReceiverName = ?
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
      complaintReceivedType,
      complaintRegisteredBy,
      complaintReceiverName,
      firId,
    ];
  }
  db.query(query, values, (err) => {
    if (err) {
      console.error('Error saving FIR:', err);
      return res.status(500).json({ message: 'Failed to save FIR' });
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
    date_of_occurrence_to,
    time_of_occurrence_to,
    placeOfOccurrence,
    dateOfRegistration,
    timeOfRegistration,
    is_case_altered,
    altered_date

  } = firData;

  const query = `
    UPDATE fir_add
    SET
      fir_number = ?,
      fir_number_suffix = ?,
      date_of_occurrence = ?,
      time_of_occurrence = ?,
      date_of_occurrence_to = ?,
      time_of_occurrence_to = ?,
      place_of_occurrence = ?,
      is_case_altered = ?,
      altered_date = ?,
      date_of_registration = ?,
      time_of_registration = ?,
      updated_at = NOW()
    WHERE fir_id = ?
  `;
  const values = [
    firNumber,
    firNumberSuffix,
    dateOfOccurrence ? dateOfOccurrence : null,
    timeOfOccurrence ? timeOfOccurrence : null,
    date_of_occurrence_to ? date_of_occurrence_to : null,
    time_of_occurrence_to ? time_of_occurrence_to : null,
    placeOfOccurrence,
    is_case_altered,
    altered_date ? altered_date : null,
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

// exports.handleStepThree = (req, res) => {
//   const { firId, complainantDetails, victims, isDeceased, deceasedPersonNames } = req.body;

//   // console.log(isDeceased);

//   const updateFirQuery = `
//     UPDATE fir_add
//     SET
//       name_of_complainant = ?,
//       mobile_number_of_complainant = ?,
//       is_victim_same_as_complainant = ?,
//       number_of_victim = ?,
//       is_deceased = ?,
//       deceased_person_names = ?
//     WHERE fir_id = ?;
//   `;
//   const updateFirValues = [
//     complainantDetails.nameOfComplainant,
//     complainantDetails.mobileNumberOfComplainant,
//     complainantDetails.isVictimSameAsComplainant,
//     victims.length,
//     isDeceased === 'yes' ? 1 : 0,
//     JSON.stringify(deceasedPersonNames || []),
//     firId,
//   ];

//   db.query(updateFirQuery, updateFirValues, (err) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to update FIR data' });
//     }

//     const victimPromises = victims.map((victim) => {
//       return new Promise((resolve, reject) => {

//         console.log(victim.victim_id);
//         if (victim.victim_id) {

//           console.log(victim.offenceCommitted)
//           console.log(victim.sectionDetails)
//           console.log(JSON.stringify(victim.sectionDetails))

//           const updateVictimQuery = `
//             UPDATE victims
//             SET
//               victim_name = ?,
//               victim_age = ?,
//               victim_gender = ?,
//               custom_gender = ?,
//               mobile_number = ?,
//               address = ?,
//               victim_pincode = ?,
//               community = ?,
//               caste = ?,
//               guardian_name = ?,
//               is_native_district_same = ?,
//               native_district = ?,
//               offence_committed = ?,
//               scst_sections = ?,
//               sectionsIPC_JSON = ?,
//               fir_stage_as_per_act = ?,
//               fir_stage_ex_gratia = ?,
//               chargesheet_stage_as_per_act = ?,
//               chargesheet_stage_ex_gratia = ?,
//               final_stage_as_per_act = ?,
//               final_stage_ex_gratia = ?
//             WHERE victim_id = ?;
//           `;
//           const updateVictimValues = [
//             victim.name,
//             victim.age,
//             victim.gender,
//             victim.gender === 'Other' ? victim.customGender || null : null,
//             victim.mobileNumber || null,
//             victim.address || null,
//             victim.victimPincode || null,
//             victim.community,
//             victim.caste,
//             victim.guardianName,
//             victim.isNativeDistrictSame,
//             victim.nativeDistrict || null,
//             JSON.stringify(victim.offenceCommitted || []),
//             JSON.stringify(victim.scstSections || []),
//             JSON.stringify(victim.sectionDetails || []),
//             victim.fir_stage_as_per_act || null,
//             victim.fir_stage_ex_gratia || null,
//             victim.chargesheet_stage_as_per_act || null,
//             victim.chargesheet_stage_ex_gratia || null,
//             victim.final_stage_as_per_act || null,
//             victim.final_stage_ex_gratia || null,
//             victim.victim_id,
//           ];
//           console.log(updateVictimQuery,updateVictimValues)
//           db.query(updateVictimQuery, updateVictimValues, (err) => {
//             if (err) return reject(err);
//             resolve({ victim_id: victim.victim_id });
//           });
//         } else {
          
//           console.log(victim.offenceCommitted)
//           console.log(victim.sectionDetails)
//           console.log(JSON.stringify(victim.sectionDetails))

//           // const victim_id = generateRandomId(6);
//           const insertVictimQuery = `
//           INSERT INTO victims (
//              fir_id, victim_name, victim_age, victim_gender, custom_gender,
//             mobile_number, address, victim_pincode, community, caste,
//             guardian_name, is_native_district_same, native_district,
//             offence_committed, scst_sections, sectionsIPC_JSON, fir_stage_as_per_act,
//             fir_stage_ex_gratia, chargesheet_stage_as_per_act,
//             chargesheet_stage_ex_gratia, final_stage_as_per_act,
//             final_stage_ex_gratia
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//           const insertVictimValues = [
//             firId,
//             victim.name || '',
//             victim.age || '',
//             victim.gender || '', 
//             victim.gender === 'Other' ? victim.customGender || null : null,
//             victim.mobileNumber || null,
//             victim.address || null, 
//             victim.victimPincode || null,
//             victim.community || '',
//             victim.caste || '',
//             victim.guardianName || '',
//             victim.isNativeDistrictSame || '',
//             victim.nativeDistrict || null,
//             JSON.stringify(victim.offenceCommitted || []),
//             JSON.stringify(victim.scstSections || []),
//             JSON.stringify(victim.sectionDetails || []),
//             victim.fir_stage_as_per_act || null,
//             victim.fir_stage_ex_gratia || null,
//             victim.chargesheet_stage_as_per_act || null,
//             victim.chargesheet_stage_ex_gratia || null,
//             victim.final_stage_as_per_act || null,
//             victim.final_stage_ex_gratia || null,
//           ];

//           db.query(insertVictimQuery, insertVictimValues, (err, result) => {
//             if (err) {
//               console.error("Database Insert Error:", err);
//               return reject(err);
//             }
//             const victim_id = result.insertId;
//             resolve({ victim_id });
//           });
//         }
//       });
//     });

//     Promise.all(victimPromises)
//       .then((results) => {
//         const updatedVictims = victims.map((victim, index) => ({
//           ...victim,
//           victim_id: results[index].victim_id,
//         }));
//         res.status(200).json({
//           message: 'Step 3 data saved successfully',
//           fir_id: firId,
//           victims: updatedVictims,
//         });
//       })
//       .catch((err) => {
//         res.status(500).json({ message: 'Failed to process victim data' });
//       });
//   });
// };








// exports.handleStepThree = (req, res) => {
//   const { firId, complainantDetails, victims, isDeceased, deceasedPersonNames } = req.body;

//   // Get a connection from the pool
//   db.getConnection((err, connection) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to get database connection'.message });
//     }
    
//     // Start a transaction on the specific connection
//     connection.beginTransaction(async (transactionErr) => {
//       if (transactionErr) {
//         connection.release(); // Release the connection on error
//         return res.status(500).json({ message: 'Failed to start transaction', error: transactionErr });
//       }

//       try {
//         // Using Promise and async/await for better flow control and error handling
//         // Update FIR details first
//         const updateFirQuery = `
//           UPDATE fir_add
//           SET
//             name_of_complainant = ?,
//             mobile_number_of_complainant = ?,
//             is_victim_same_as_complainant = ?,
//             number_of_victim = ?,
//             is_deceased = ?,
//             deceased_person_names = ?
//           WHERE fir_id = ?;
//         `;
//         const updateFirValues = [
//           complainantDetails.nameOfComplainant,
//           complainantDetails.mobileNumberOfComplainant,
//           complainantDetails.isVictimSameAsComplainant,
//           victims.length,
//           isDeceased === 'yes' ? 1 : 0,
//           JSON.stringify(deceasedPersonNames || []),
//           firId,
//         ];

//         // Execute FIR update with Promise
//         await new Promise((resolve, reject) => {
//           connection.query(updateFirQuery, updateFirValues, (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           });
//         });

//         // Process victims sequentially to avoid race conditions
//         const updatedVictims = [];

//         for (const victim of victims) {
//           // If victim_id is provided, we just update that record
//           if (victim.victim_id) {
//             const updateQuery = `
//               UPDATE victims
//               SET
//                 victim_name = ?,
//                 victim_age = ?,
//                 victim_gender = ?,
//                 custom_gender = ?,
//                 mobile_number = ?,
//                 address = ?,
//                 victim_pincode = ?,
//                 community = ?,
//                 caste = ?,
//                 guardian_name = ?,
//                 is_native_district_same = ?,
//                 native_district = ?,
//                 offence_committed = ?,
//                 scst_sections = ?,
//                 sectionsIPC_JSON = ?,
//                 fir_stage_as_per_act = ?,
//                 fir_stage_ex_gratia = ?,
//                 chargesheet_stage_as_per_act = ?,
//                 chargesheet_stage_ex_gratia = ?,
//                 final_stage_as_per_act = ?,
//                 final_stage_ex_gratia = ?
//               WHERE victim_id = ?`
            
            
//             const updateValues = [
//               victim.name,
//               victim.age,
//               victim.gender,
//               victim.gender === 'Other' ? victim.customGender || null : null,
//               victim.mobileNumber || null,
//               victim.address || null,
//               victim.victimPincode || null,
//               victim.community || '',
//               victim.caste || '',
//               victim.guardianName || '',
//               victim.isNativeDistrictSame || '',
//               victim.nativeDistrict || null,
//               JSON.stringify(victim.offenceCommitted || []),
//               JSON.stringify(victim.scstSections || []),
//               JSON.stringify(victim.sectionDetails || []),
//               victim.fir_stage_as_per_act || null,
//               victim.fir_stage_ex_gratia || null,
//               victim.chargesheet_stage_as_per_act || null,
//               victim.chargesheet_stage_ex_gratia || null,
//               victim.final_stage_as_per_act || null,
//               victim.final_stage_ex_gratia || null,
//               victim.victim_id
//             ];

//             // Execute update with Promise
//             await new Promise((resolve, reject) => {
//               connection.query(updateQuery, updateValues, (err, result) => {
//                 if (err) reject(err);
//                 else resolve(result);
//               });
//             });
            
//             updatedVictims.push({
//               ...victim,
//               victim_id: victim.victim_id
//             });
//           } else {
//             // Without a victim_id, we need to implement a complex matching strategy
//             // to determine if this is an update to an existing record or a new record
            
//             // 1. First, build a comprehensive search query that will help us identify
//             // potential duplicates based on all available identifying information
//             let searchConditions = ['fir_id = ?'];
//             let searchParams = [firId];
            
//             // Add each available field to the search conditions
//             // Name is mandatory but could change for minors, so include it carefully
//             if (victim.name) {
//               searchConditions.push('(victim_name = ? OR victim_name IS NULL)');
//               searchParams.push(victim.name);
//             }
            
//             // Age is important but could change slightly
//             if (victim.age) {
//               searchConditions.push('(victim_age = ? OR victim_age IS NULL)');
//               searchParams.push(victim.age);
//             }
            
//             // Gender should be consistent
//             if (victim.gender) {
//               searchConditions.push('(victim_gender = ? OR victim_gender IS NULL)');
//               searchParams.push(victim.gender);
//             }
            
//             // Mobile number is a strong identifier if available
//             if (victim.mobileNumber) {
//               searchConditions.push('(mobile_number = ? OR mobile_number IS NULL)');
//               searchParams.push(victim.mobileNumber);
//             }
            
//             // Community and caste may be important identifiers in your context
//             if (victim.community) {
//               searchConditions.push('(community = ? OR community IS NULL)');
//               searchParams.push(victim.community);
//             }
            
//             if (victim.caste) {
//               searchConditions.push('(caste = ? OR caste IS NULL)');
//               searchParams.push(victim.caste);
//             }
            
//             // Guardian name can be a strong identifier
//             if (victim.guardianName) {
//               searchConditions.push('(guardian_name = ? OR guardian_name IS NULL)');
//               searchParams.push(victim.guardianName);
//             }
            
//             // Native district might help identify the victim
//             if (victim.nativeDistrict) {
//               searchConditions.push('(native_district = ? OR native_district IS NULL)');
//               searchParams.push(victim.nativeDistrict);
//             }
            
//             // Build the search query - require at least 3 matching fields besides FIR ID
//             // to consider it a potential match (you can adjust this threshold)
//             const matchingFieldsThreshold = 3;
//             const searchQuery = `
//               SELECT victim_id, 
//                      COUNT(*) AS matching_fields
//               FROM victims
//               WHERE ${searchConditions.join(' AND ')}
//               GROUP BY victim_id
//               HAVING matching_fields >= ${matchingFieldsThreshold}
//               ORDER BY matching_fields DESC
//               LIMIT 1
//             `;
            
//             // Execute search with Promise
//             const potentialMatches = await new Promise((resolve, reject) => {
//               connection.query(searchQuery, searchParams, (err, results) => {
//                 if (err) reject(err);
//                 else resolve(results);
//               });
//             });
            
//             let victimId = null;
            
//             // If we found a potential match with sufficient matching fields, use that ID
//             if (potentialMatches && potentialMatches.length > 0) {
//               victimId = potentialMatches[0].victim_id;
              
//               // Update the existing record
//               const updateQuery = `
//                 UPDATE victims
//                 SET
//                   victim_name = ?,
//                   victim_age = ?,
//                   victim_gender = ?,
//                   custom_gender = ?,
//                   mobile_number = ?,
//                   address = ?,
//                   victim_pincode = ?,
//                   community = ?,
//                   caste = ?,
//                   guardian_name = ?,
//                   is_native_district_same = ?,
//                   native_district = ?,
//                   offence_committed = ?,
//                   scst_sections = ?,
//                   sectionsIPC_JSON = ?,
//                   fir_stage_as_per_act = ?,
//                   fir_stage_ex_gratia = ?,
//                   chargesheet_stage_as_per_act = ?,
//                   chargesheet_stage_ex_gratia = ?,
//                   final_stage_as_per_act = ?,
//                   final_stage_ex_gratia = ?
//                 WHERE victim_id = ?
//               `;
              
//               const updateValues = [
//                 victim.name,
//                 victim.age,
//                 victim.gender,
//                 victim.gender === 'Other' ? victim.customGender || null : null,
//                 victim.mobileNumber || null,
//                 victim.address || null,
//                 victim.victimPincode || null,
//                 victim.community || '',
//                 victim.caste || '',
//                 victim.guardianName || '',
//                 victim.isNativeDistrictSame || '',
//                 victim.nativeDistrict || null,
//                 JSON.stringify(victim.offenceCommitted || []),
//                 JSON.stringify(victim.scstSections || []),
//                 JSON.stringify(victim.sectionDetails || []),
//                 victim.fir_stage_as_per_act || null,
//                 victim.fir_stage_ex_gratia || null,
//                 victim.chargesheet_stage_as_per_act || null,
//                 victim.chargesheet_stage_ex_gratia || null,
//                 victim.final_stage_as_per_act || null,
//                 victim.final_stage_ex_gratia || null,
//                 victimId
//               ];
              
//               // Execute update with Promise
//               await new Promise((resolve, reject) => {
//                 connection.query(updateQuery, updateValues, (err, result) => {
//                   if (err) reject(err);
//                   else resolve(result);
//                 });
//               });
//             } else {
             
//                 // No match at all, insert new record
//                 const insertQuery = `
//                   INSERT INTO victims (
//                     fir_id, victim_name, victim_age, victim_gender, custom_gender,
//                     mobile_number, address, victim_pincode, community, caste,
//                     guardian_name, is_native_district_same, native_district,
//                     offence_committed, scst_sections, sectionsIPC_JSON, fir_stage_as_per_act,
//                     fir_stage_ex_gratia, chargesheet_stage_as_per_act,
//                     chargesheet_stage_ex_gratia, final_stage_as_per_act,
//                     final_stage_ex_gratia
//                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//                 `;
                
//                 const insertValues = [
//                   firId,
//                   victim.name || '',
//                   victim.age || '',
//                   victim.gender || '', 
//                   victim.gender === 'Other' ? victim.customGender || null : null,
//                   victim.mobileNumber || null,
//                   victim.address || null, 
//                   victim.victimPincode || null,
//                   victim.community || '',
//                   victim.caste || '',
//                   victim.guardianName || '',
//                   victim.isNativeDistrictSame || '',
//                   victim.nativeDistrict || null,
//                   JSON.stringify(victim.offenceCommitted || []),
//                   JSON.stringify(victim.scstSections || []),
//                   JSON.stringify(victim.sectionDetails || []),
//                   victim.fir_stage_as_per_act || null,
//                   victim.fir_stage_ex_gratia || null,
//                   victim.chargesheet_stage_as_per_act || null,
//                   victim.chargesheet_stage_ex_gratia || null,
//                   victim.final_stage_as_per_act || null,
//                   victim.final_stage_ex_gratia || null,
//                 ];
                
//                 // Execute insert with Promise and get the new ID
//                 const insertResult = await new Promise((resolve, reject) => {
//                   connection.query(insertQuery, insertValues, (err, result) => {
//                     if (err) reject(err);
//                     else resolve(result);
//                   });
//                 });
                
//                 victimId = insertResult.insertId;
//             }
            
//             updatedVictims.push({
//               ...victim,
//               victim_id: victimId
//             });
//           }
//         }

//         // Commit the transaction
//         connection.commit((commitErr) => {
//           if (commitErr) {
//             return connection.rollback(() => {
//               connection.release(); // Release connection on rollback
//               res.status(500).json({ message: 'Failed to commit transaction', error: commitErr });
//             });
//           }
          
//           connection.release(); // Release connection on successful commit
          
//           // Send success response
//           res.status(200).json({
//             message: 'Step 3 data saved successfully',
//             fir_id: firId,
//             victims: updatedVictims,
//           });
//         });
        
//       } catch (error) {
//         // Roll back transaction on error
//         connection.rollback(() => {
//           connection.release(); // Release connection on rollback
//           console.error('Transaction error:', error);
//           res.status(500).json({ message: 'Failed to process victim data', error: error.message });
//         });
//       }
//     });
//   });
// };



// exports.handleStepThree = (req, res) => {
//   const { firId, complainantDetails, victims, isDeceased, deceasedPersonNames } = req.body;

//   // Get a connection from the pool
//   db.getConnection((err, connection) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to get database connection'.message });
//     }
    
//     // Start a transaction on the specific connection
//     connection.beginTransaction(async (transactionErr) => {
//       if (transactionErr) {
//         connection.release(); // Release the connection on error
//         return res.status(500).json({ message: 'Failed to start transaction', error: transactionErr });
//       }

//       try {
//         // Using Promise and async/await for better flow control and error handling
//         // Update FIR details first
//         const updateFirQuery = `
//           UPDATE fir_add
//           SET
//             name_of_complainant = ?,
//             mobile_number_of_complainant = ?,
//             is_victim_same_as_complainant = ?,
//             number_of_victim = ?,
//             is_deceased = ?,
//             deceased_person_names = ?
//           WHERE fir_id = ?;
//         `;
//         const updateFirValues = [
//           complainantDetails.nameOfComplainant,
//           complainantDetails.mobileNumberOfComplainant,
//           complainantDetails.isVictimSameAsComplainant,
//           victims.length,
//           isDeceased === 'yes' ? 1 : 0,
//           JSON.stringify(deceasedPersonNames || []),
//           firId,
//         ];

//         // Execute FIR update with Promise
//         await new Promise((resolve, reject) => {
//           connection.query(updateFirQuery, updateFirValues, (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           });
//         });

//         // Process victims sequentially to avoid race conditions
//         const updatedVictims = [];

//         for (const victim of victims) {
//           // If victim_id is provided, we just update that record
//           if (victim.victim_id) {
//             const updateQuery = `
//               UPDATE victims
//               SET
//                 victim_name = ?,
//                 victim_age = ?,
//                 victim_gender = ?,
//                 custom_gender = ?,
//                 mobile_number = ?,
//                 address = ?,
//                 victim_pincode = ?,
//                 community = ?,
//                 caste = ?,
//                 guardian_name = ?,
//                 is_native_district_same = ?,
//                 native_district = ?,
//                 offence_committed = ?,
//                 scst_sections = ?,
//                 sectionsIPC_JSON = ?,
//                 fir_stage_as_per_act = ?,
//                 fir_stage_ex_gratia = ?,
//                 chargesheet_stage_as_per_act = ?,
//                 chargesheet_stage_ex_gratia = ?,
//                 final_stage_as_per_act = ?,
//                 final_stage_ex_gratia = ?
//               WHERE victim_id = ?`
            
            
//             const updateValues = [
//               victim.name,
//               victim.age,
//               victim.gender,
//               victim.gender === 'Other' ? victim.customGender || null : null,
//               victim.mobileNumber || null,
//               victim.address || null,
//               victim.victimPincode || null,
//               victim.community || '',
//               victim.caste || '',
//               victim.guardianName || '',
//               victim.isNativeDistrictSame || '',
//               victim.nativeDistrict || null,
//               JSON.stringify(victim.offenceCommitted || []),
//               JSON.stringify(victim.scstSections || []),
//               JSON.stringify(victim.sectionDetails || []),
//               victim.fir_stage_as_per_act || null,
//               victim.fir_stage_ex_gratia || null,
//               victim.chargesheet_stage_as_per_act || null,
//               victim.chargesheet_stage_ex_gratia || null,
//               victim.final_stage_as_per_act || null,
//               victim.final_stage_ex_gratia || null,
//               victim.victim_id
//             ];

//             // Execute update with Promise
//             await new Promise((resolve, reject) => {
//               connection.query(updateQuery, updateValues, (err, result) => {
//                 if (err) reject(err);
//                 else resolve(result);
//               });
//             });
            
//             updatedVictims.push({
//               ...victim,
//               victim_id: victim.victim_id
//             });
//           } else {
//             // Without a victim_id, we need to implement a complex matching strategy
//             // to determine if this is an update to an existing record or a new record
            
//             // 1. First, build a comprehensive search query that will help us identify
//             // potential duplicates based on all available identifying information
//             let searchConditions = ['fir_id = ?'];
//             let searchParams = [firId];
            
//             // Add each available field to the search conditions
//             // Name is mandatory but could change for minors, so include it carefully
//             if (victim.name) {
//               searchConditions.push('(victim_name = ? OR victim_name IS NULL)');
//               searchParams.push(victim.name);
//             }
            
//             // Age is important but could change slightly
//             if (victim.age) {
//               searchConditions.push('(victim_age = ? OR victim_age IS NULL)');
//               searchParams.push(victim.age);
//             }
            
//             // Gender should be consistent
//             if (victim.gender) {
//               searchConditions.push('(victim_gender = ? OR victim_gender IS NULL)');
//               searchParams.push(victim.gender);
//             }
            
//             // Mobile number is a strong identifier if available
//             if (victim.mobileNumber) {
//               searchConditions.push('(mobile_number = ? OR mobile_number IS NULL)');
//               searchParams.push(victim.mobileNumber);
//             }
            
//             // Community and caste may be important identifiers in your context
//             if (victim.community) {
//               searchConditions.push('(community = ? OR community IS NULL)');
//               searchParams.push(victim.community);
//             }
            
//             if (victim.caste) {
//               searchConditions.push('(caste = ? OR caste IS NULL)');
//               searchParams.push(victim.caste);
//             }
            
//             // Guardian name can be a strong identifier
//             if (victim.guardianName) {
//               searchConditions.push('(guardian_name = ? OR guardian_name IS NULL)');
//               searchParams.push(victim.guardianName);
//             }
            
//             // Native district might help identify the victim
//             if (victim.nativeDistrict) {
//               searchConditions.push('(native_district = ? OR native_district IS NULL)');
//               searchParams.push(victim.nativeDistrict);
//             }
            
//             // Build the search query - require at least 3 matching fields besides FIR ID
//             // to consider it a potential match (you can adjust this threshold)
//             const matchingFieldsThreshold = 3;
//             const searchQuery = `
//               SELECT victim_id, 
//                      COUNT(*) AS matching_fields
//               FROM victims
//               WHERE ${searchConditions.join(' AND ')}
//               GROUP BY victim_id
//               HAVING matching_fields >= ${matchingFieldsThreshold}
//               ORDER BY matching_fields DESC
//               LIMIT 1
//             `;
            
//             // Execute search with Promise
//             const potentialMatches = await new Promise((resolve, reject) => {
//               connection.query(searchQuery, searchParams, (err, results) => {
//                 if (err) reject(err);
//                 else resolve(results);
//               });
//             });
            
//             let victimId = null;
            
//             // If we found a potential match with sufficient matching fields, use that ID
//             if (potentialMatches && potentialMatches.length > 0) {
//               victimId = potentialMatches[0].victim_id;
              
//               // Update the existing record
//               const updateQuery = `
//                 UPDATE victims
//                 SET
//                   victim_name = ?,
//                   victim_age = ?,
//                   victim_gender = ?,
//                   custom_gender = ?,
//                   mobile_number = ?,
//                   address = ?,
//                   victim_pincode = ?,
//                   community = ?,
//                   caste = ?,
//                   guardian_name = ?,
//                   is_native_district_same = ?,
//                   native_district = ?,
//                   offence_committed = ?,
//                   scst_sections = ?,
//                   sectionsIPC_JSON = ?,
//                   fir_stage_as_per_act = ?,
//                   fir_stage_ex_gratia = ?,
//                   chargesheet_stage_as_per_act = ?,
//                   chargesheet_stage_ex_gratia = ?,
//                   final_stage_as_per_act = ?,
//                   final_stage_ex_gratia = ?
//                 WHERE victim_id = ?
//               `;
              
//               const updateValues = [
//                 victim.name,
//                 victim.age,
//                 victim.gender,
//                 victim.gender === 'Other' ? victim.customGender || null : null,
//                 victim.mobileNumber || null,
//                 victim.address || null,
//                 victim.victimPincode || null,
//                 victim.community || '',
//                 victim.caste || '',
//                 victim.guardianName || '',
//                 victim.isNativeDistrictSame || '',
//                 victim.nativeDistrict || null,
//                 JSON.stringify(victim.offenceCommitted || []),
//                 JSON.stringify(victim.scstSections || []),
//                 JSON.stringify(victim.sectionDetails || []),
//                 victim.fir_stage_as_per_act || null,
//                 victim.fir_stage_ex_gratia || null,
//                 victim.chargesheet_stage_as_per_act || null,
//                 victim.chargesheet_stage_ex_gratia || null,
//                 victim.final_stage_as_per_act || null,
//                 victim.final_stage_ex_gratia || null,
//                 victimId
//               ];
              
//               // Execute update with Promise
//               await new Promise((resolve, reject) => {
//                 connection.query(updateQuery, updateValues, (err, result) => {
//                   if (err) reject(err);
//                   else resolve(result);
//                 });
//               });
//             } else {
             
//                 // No match at all, insert new record
//                 const insertQuery = `
//                   INSERT INTO victims (
//                     fir_id, victim_name, victim_age, victim_gender, custom_gender,
//                     mobile_number, address, victim_pincode, community, caste,
//                     guardian_name, is_native_district_same, native_district,
//                     offence_committed, scst_sections, sectionsIPC_JSON, fir_stage_as_per_act,
//                     fir_stage_ex_gratia, chargesheet_stage_as_per_act,
//                     chargesheet_stage_ex_gratia, final_stage_as_per_act,
//                     final_stage_ex_gratia
//                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//                 `;
                
//                 const insertValues = [
//                   firId,
//                   victim.name || '',
//                   victim.age || '',
//                   victim.gender || '', 
//                   victim.gender === 'Other' ? victim.customGender || null : null,
//                   victim.mobileNumber || null,
//                   victim.address || null, 
//                   victim.victimPincode || null,
//                   victim.community || '',
//                   victim.caste || '',
//                   victim.guardianName || '',
//                   victim.isNativeDistrictSame || '',
//                   victim.nativeDistrict || null,
//                   JSON.stringify(victim.offenceCommitted || []),
//                   JSON.stringify(victim.scstSections || []),
//                   JSON.stringify(victim.sectionDetails || []),
//                   victim.fir_stage_as_per_act || null,
//                   victim.fir_stage_ex_gratia || null,
//                   victim.chargesheet_stage_as_per_act || null,
//                   victim.chargesheet_stage_ex_gratia || null,
//                   victim.final_stage_as_per_act || null,
//                   victim.final_stage_ex_gratia || null,
//                 ];
                
//                 // Execute insert with Promise and get the new ID
//                 const insertResult = await new Promise((resolve, reject) => {
//                   connection.query(insertQuery, insertValues, (err, result) => {
//                     if (err) reject(err);
//                     else resolve(result);
//                   });
//                 });
                
//                 victimId = insertResult.insertId;
//             }
            
//             updatedVictims.push({
//               ...victim,
//               victim_id: victimId
//             });
//           }
//         }

//         // Commit the transaction
//         connection.commit((commitErr) => {
//           if (commitErr) {
//             return connection.rollback(() => {
//               connection.release(); // Release connection on rollback
//               res.status(500).json({ message: 'Failed to commit transaction', error: commitErr });
//             });
//           }
          
//           connection.release(); // Release connection on successful commit
          
//           // Send success response
//           res.status(200).json({
//             message: 'Step 3 data saved successfully',
//             fir_id: firId,
//             victims: updatedVictims,
//           });
//         });
        
//       } catch (error) {
//         // Roll back transaction on error
//         connection.rollback(() => {
//           connection.release(); // Release connection on rollback
//           console.error('Transaction error:', error);
//           res.status(500).json({ message: 'Failed to process victim data', error: error.message });
//         });
//       }
//     });
//   });
// };




exports.handleStepThree = (req, res) => {
  const { firId, complainantDetails, victims, isDeceased, deceasedPersonNames } = req.body;

  // Get a connection from the pool
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to get database connection'.message });
    }
    
    // Start a transaction on the specific connection
    connection.beginTransaction(async (transactionErr) => {
      if (transactionErr) {
        connection.release(); // Release the connection on error
        return res.status(500).json({ message: 'Failed to start transaction' });
      }

      try {
        // Using Promise and async/await for better flow control and error handling
        // Update FIR details first
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

        // Execute FIR update with Promise
        await new Promise((resolve, reject) => {
          connection.query(updateFirQuery, updateFirValues, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        // Process victims sequentially to avoid race conditions
        const updatedVictims = [];

        for (const victim of victims) {
          // If victim_id is provided, we just update that record
          if (victim.victim_id) {
            const updateQuery = `
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
                sectionsIPC_JSON = ?,
                fir_stage_as_per_act = ?,
                fir_stage_ex_gratia = ?,
                chargesheet_stage_as_per_act = ?,
                chargesheet_stage_ex_gratia = ?,
                final_stage_as_per_act = ?,
                final_stage_ex_gratia = ?,
                relief_applicable = ?
              WHERE victim_id = ?`
            
            
            const updateValues = [
              victim.name,
              victim.age,
              victim.gender,
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
              JSON.stringify(victim.sectionDetails || []),
              victim.fir_stage_as_per_act || null,
              victim.fir_stage_ex_gratia || null,
              victim.chargesheet_stage_as_per_act || null,
              victim.chargesheet_stage_ex_gratia || null,
              victim.final_stage_as_per_act || null,
              victim.final_stage_ex_gratia || null,
              victim.relief_applicable || 0,
              victim.victim_id
            ];

            // Execute update with Promise
            await new Promise((resolve, reject) => {
              connection.query(updateQuery, updateValues, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
            
            updatedVictims.push({
              ...victim,
              victim_id: victim.victim_id
            });
          } else {
                         
            // No match at all, insert new record
                const insertQuery = `
                  INSERT INTO victims (
                    fir_id, victim_name, victim_age, victim_gender, custom_gender,
                    mobile_number, address, victim_pincode, community, caste,
                    guardian_name, is_native_district_same, native_district,
                    offence_committed, scst_sections, sectionsIPC_JSON, fir_stage_as_per_act,
                    fir_stage_ex_gratia, chargesheet_stage_as_per_act,
                    chargesheet_stage_ex_gratia, final_stage_as_per_act,
                    final_stage_ex_gratia, relief_applicable
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                const insertValues = [
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
                  JSON.stringify(victim.sectionDetails || []),
                  victim.fir_stage_as_per_act || null,
                  victim.fir_stage_ex_gratia || null,
                  victim.chargesheet_stage_as_per_act || null,
                  victim.chargesheet_stage_ex_gratia || null,
                  victim.final_stage_as_per_act || null,
                  victim.final_stage_ex_gratia || null,
                  victim.relief_applicable || 0
                ];
                
                // Execute insert with Promise and get the new ID
                const insertResult = await new Promise((resolve, reject) => {
                  connection.query(insertQuery, insertValues, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                  });
                });
          }
        }

        // Commit the transaction
        connection.commit((commitErr) => {
          if (commitErr) {
            return connection.rollback(() => {
              connection.release(); // Release connection on rollback
              res.status(500).json({ message: 'Failed to commit transaction' });
            });
          }
          
          connection.release(); // Release connection on successful commit
          
          // Send success response
          res.status(200).json({
            message: 'Step 3 data saved successfully',
            fir_id: firId
          });
        });
        
      } catch (error) {
        // Roll back transaction on error
        connection.rollback(() => {
          connection.release(); // Release connection on rollback
          console.error('Transaction error:', error);
          res.status(500).json({ message: 'Failed to process victim data' });
        });
      }
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
//       return res.status(500).json({ message: "Failed to update FIR data".message });
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
//         res.status(500).json({ message: "Failed to process accused data".message });
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

// exports.handleStepFour = (req, res) => {


//   upload.array('uploadFIRCopy[]', 5)(req, res, (err)=> {
//     if (err instanceof multer.MulterError) {
//       return res.status(400).json({ error: err.message });
//     } else if (err) {
//       return res.status(500).json({ error: 'Failed to upload file', message: err.message });
//     }

//     const { firId, numberOfAccused, accuseds: accusedsRaw } = req.body;
//     const files = req.files; 

//     let accuseds = [];
//     try {
//       if (typeof accusedsRaw === 'string') {
//         accuseds = JSON.parse(accusedsRaw);
//       } else if (Array.isArray(accusedsRaw) || typeof accusedsRaw === 'object') {
//         accuseds = accusedsRaw;
//       } else {
//         throw new Error("Invalid format for 'accuseds'");
//       }
//     } catch (error) {
//       console.error("Error parsing accuseds:", error.message);
//       return res.status(400).json({ error: "Invalid data format for 'accuseds'" });
//     }

//     let filePaths = files.map(file => file.path).join(', '); 
//     accuseds = accuseds.map((accused, index) => {
//       accused.uploadFIRCopy = files[index] ? files[index].path : null; 
//       return accused;
//     });
   

//     const updateFirQuery = `
//       UPDATE fir_add
//       SET
//         number_of_accused = ?
//       WHERE fir_id = ?;
//     `;

    
 
//     const updateFirValues = [numberOfAccused, firId];

//   db.query(updateFirQuery, updateFirValues, (err) => {
//     if (err) {
//       console.error("Failed to update FIR data:", err);
//       return res.status(500).json({ message: "Failed to update FIR data".message });
//     }

//       const accusedPromises = accuseds.map((accused) => {
//         return new Promise((resolve, reject) => {
//           if (accused.accusedId) {
//             const updateAccusedQuery = `
//               UPDATE accuseds
//               SET
//                 age = ?, name = ?, gender = ?, custom_gender = ?, address = ?, pincode = ?,
//                 community = ?, caste = ?, guardian_name = ?, previous_incident = ?,
//                 previous_fir_number = ?, previous_fir_number_suffix = ?, scst_offence = ?,
//                 scst_fir_number = ?, scst_fir_number_suffix = ?, antecedentsOption = ?, antecedents = ?, landOIssueOption = ?, land_o_issues = ?,
//                 gist_of_current_case = ?, upload_fir_copy = ?
//               WHERE accused_id = ?;
//             `;
//             const accusedValues = [
//               accused.age,
//               accused.name,
//               accused.gender,
//               accused.gender === 'Other' ? accused.customGender || '' : '',
//               accused.address,
//               accused.pincode,
//               accused.community,
//               accused.caste,
//               accused.guardianName,
//               accused.previousIncident,
//               accused.previousFIRNumber,
//               accused.previousFIRNumberSuffix,
//               accused.scstOffence,
//               accused.scstFIRNumber,
//               accused.scstFIRNumberSuffix,
//               accused.antecedentsOption,
//               accused.antecedents,
//               accused.landOIssueOption,
//               accused.landOIssues,
//               accused.gistOfCurrentCase,
//               accused.uploadFIRCopy,
//               accused.accusedId,
//             ];

//             db.query(updateAccusedQuery, accusedValues, (err) => {
//               if (err) return reject(err);
//               resolve({ accusedId: accused.accusedId });
//             });
//           } else {
//             // const accusedId = generateRandomId(6);
//             const insertAccusedQuery = `
//               INSERT INTO accuseds (
//               fir_id, age, name, gender, custom_gender, address, pincode, community, caste,
//                 guardian_name, previous_incident, previous_fir_number, previous_fir_number_suffix, scst_offence,
//                 scst_fir_number, scst_fir_number_suffix, antecedentsOption, antecedents, landOIssueOption, land_o_issues, gist_of_current_case, upload_fir_copy
//               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
//             `;
//             const accusedValues = [
//               firId,
//               accused.age,
//               accused.name,
//               accused.gender,
//               accused.gender === 'Other' ? accused.customGender || '' : '',
//               accused.address,
//               accused.pincode,
//               accused.community,
//               accused.caste,
//               accused.guardianName,
//               accused.previousIncident,
//               accused.previousFIRNumber,
//               accused.previousFIRNumberSuffix,
//               accused.scstOffence,
//               accused.scstFIRNumber,
//               accused.scstFIRNumberSuffix,
//               accused.antecedentsOption,
//               accused.antecedents,
//               accused.landOIssueOption,
//               accused.landOIssues,
//               accused.gistOfCurrentCase,
//               accused.uploadFIRCopy,
//             ];

//           db.query(insertAccusedQuery, accusedValues, (err,result) => {
//             if (err) return reject(err);
//             const accusedId = result.insertId;
//             resolve({ accusedId });
//           });
//         }
//       });
//     });

//       Promise.all(accusedPromises)
//         .then((results) => {
//           const updatedAccuseds = accuseds.map((accused, index) => ({
//             ...accused,
//             accusedId: results[index].accusedId,
//           }));
//           res.status(200).json({
//             message: "Step 4 data saved successfully",
//             fir_id: firId,
//             accuseds: updatedAccuseds,
//             file: files ? files.path : null, 
//           });
//         })
//         .catch((err) => {
//           console.error("Failed to process accused data:", err);
//           res.status(500).json({ message: "Failed to process accused data".message });
//         });
//     });
//   });
// };



exports.handleStepFour = (req, res) => {

  // console.log(req.body)
    const { firId, numberOfAccused, gistOfCurrentCase, uploadFIRCopy, accused_remarks } = req.body;
    const accusedsRaw = req.body.accuseds;

    // console.log(firId, numberOfAccused, gistOfCurrentCase, uploadFIRCopy)

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
      console.error("Error parsing accuseds:", error);
      return res.status(400).json({ error: "Invalid data format for 'accuseds'" });
    }

    const updateFirQuery = `
      UPDATE fir_add
      SET
        number_of_accused = ?,
        upload_fir_copy = ?,
        gist_of_current_case = ?,
        accused_remarks = ?
      WHERE fir_id = ?;
    `;

    
 
    const updateFirValues = [numberOfAccused, uploadFIRCopy, gistOfCurrentCase, accused_remarks, firId];

  db.query(updateFirQuery, updateFirValues, (err) => {
    if (err) {
      console.error("Failed to update FIR data:", err);
      return res.status(500).json({ message: "Failed to update FIR data".message });
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
                scst_fir_number = ?, scst_fir_number_suffix = ?, antecedentsOption = ?, antecedents = ?, landOIssueOption = ?, land_o_issues = ?, previous_incident_remarks = ?, previous_offence_remarks = ?
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
              accused.antecedentsOption,
              accused.antecedents,
              accused.landOIssueOption,
              accused.landOIssues,
              accused.previous_incident_remarks,
              accused.previous_offence_remarks,
              accused.accusedId,
            ];

            db.query(updateAccusedQuery, accusedValues, (err) => {
              if (err) return reject(err);
              resolve({ accusedId: accused.accusedId });
            });
          } else {
            // const accusedId = generateRandomId(6);
            const insertAccusedQuery = `
              INSERT INTO accuseds (
              fir_id, age, name, gender, custom_gender, address, pincode, community, caste,
                guardian_name, previous_incident, previous_fir_number, previous_fir_number_suffix, scst_offence,
                scst_fir_number, scst_fir_number_suffix, antecedentsOption, antecedents, landOIssueOption, land_o_issues, previous_incident_remarks, previous_offence_remarks
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            const accusedValues = [
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
              accused.antecedentsOption,
              accused.antecedents,
              accused.landOIssueOption,
              accused.previous_incident_remarks,
              accused.previous_offence_remarks,
              accused.landOIssues
            ];

          db.query(insertAccusedQuery, accusedValues, (err,result) => {
            if (err) return reject(err);
            const accusedId = result.insertId;
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
          res.status(500).json({ message: "Failed to process accused data".message });
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







// // Update FIR status based on the current step
// exports.updateFirStatus = (req, res) => {
//   const { firId, status } = req.body;

//   // Check if FIR ID and status are provided
//   if (!firId || !status) {
//     return res.status(400).json({ message: 'FIR ID and status are required' });
//   }

//   // Update the status in the database
//   const query = `
//     UPDATE fir_add
//     SET status = ?
//     WHERE fir_id = ?
//   `;
//   const values = [status, firId];

//   db.query(query, values, (err, result) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to update FIR status' });
//     }

//     if (result.affectedRows > 0) {
//       return res.status(200).json({ message: 'FIR status updated successfully' });
//     } else {
//       return res.status(404).json({ message: 'FIR not found' });
//     }
//   });
// };


exports.updateFirStatus = async (req, res) => {
  try {
    const { firId, status } = req.body;
    let firstatus = 0;

    // Check if FIR ID and status are provided
    if (!firId || !status) {
      return res.status(400).json({ message: 'FIR ID and status are required' });
    }

    // Use promise-based query for consistency
    const [firStatusResults] = await db.promise().query('SELECT status FROM fir_add WHERE fir_id = ?', [firId]);
    
    if (firStatusResults && firStatusResults.length > 0) {
      firstatus = firStatusResults[0].status;
    }

    // console.log(status, '>', firstatus);
    
    if (status > firstatus) {
      // Update the status in the database
      const query = `
        UPDATE fir_add
        SET status = ?
        WHERE fir_id = ?
      `;
      const values = [status, firId];

      const [updateResult] = await db.promise().query(query, values);

      if (updateResult.affectedRows > 0) {
        // console.log('updated');
        return res.status(200).json({ message: 'FIR status updated successfully' });
      } else {
        return res.status(404).json({ message: 'FIR not found' });
      }
    } else {
      // console.log('not updated');
      return res.status(200).json({ message: 'FIR status not changed' });
    }
  } catch (error) {
    console.error('Error updating FIR status:', error);
    return res.status(500).json({ message: 'Failed to update FIR status' });
  }
};

exports.GetVictimDetail = (req, res) => {

  const  firId  = req.body.firId;

  // Check if FIR ID and status are provided
  if (!firId) {
    // console.log('FIR ID missing',firId)
    return res.status(400).json({ message: 'FIR ID missing' });
  }

  // Update the status in the database
  const query = ` SELECT count(victim_id) as id FROM victims WHERE fir_id = ?`;
  const values = [firId];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to GET DETAIL' });
    }
    if (result) {
      return res.status(200).json({ datacount : result[0] ,message: 'getting detail successfully' });
    } else {
      return res.status(404).json({ message: 'detail not found' });
    }
  });
};



exports.Getstep5Detail = (req, res) => {

  const  firId  = req.body.firId;

  // Check if FIR ID and status are provided
  if (!firId) {
    // console.log('FIR ID missing',firId)
    return res.status(400).json({ message: 'FIR ID missing' });
  }

  // Update the status in the database
  const query = ` SELECT 
                        count(vr.id) as id , fa.status
                  FROM 
                        victim_relief vr  
                  left join 
                        fir_add fa on fa.fir_id = vr.fir_id
                  WHERE vr.fir_id = ?`;
  const values = [firId];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to GET DETAIL' });
    }
    if (result) {
      return res.status(200).json({ datacount : result[0] ,message: 'getting detail successfully' });
    } else {
      return res.status(404).json({ message: 'detail not found' });
    }
  });
};


exports.GetChargesheetDetail = (req, res) => {

  const  firId  = req.body.firId;

  // Check if FIR ID and status are provided
  if (!firId) {
    // console.log('FIR ID missing',firId)
    return res.status(400).json({ message: 'FIR ID missing' });
  }

  // Update the status in the database
  const query = ` SELECT count(id) as id FROM chargesheet_details WHERE fir_id = ?`;
  const values = [firId];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to GET DETAIL' });
    }
    if (result) {
      return res.status(200).json({ datacount : result[0] ,message: 'getting detail successfully' });
    } else {
      return res.status(404).json({ message: 'detail not found' });
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
// exports.handleStepFive = (req, res) => {
//   upload_step5(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error' });

//     const {
//       firId,
//       totalCompensation,
//       proceedingsFileNo,
//       proceedingsDate,
//     } = req.body;

//     const victimsRelief = req.body.victimsRelief ? JSON.parse(req.body.victimsRelief) : [];
//     const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].filename : null;
//     const attachments = req.files['attachments'] || [];

//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     const generateRandomId = (length = 6) => {
//       const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//       return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
//     };

//     db.beginTransaction((err) => {
//       if (err) return res.status(500).json({ message: 'Transaction error' });

//       const savedData = { victims: [], proceedings: null, attachments: [] };

//       const victimPromises = victimsRelief.map((victim, index) => {
//         return new Promise((resolve, reject) => {
//           const victimId = victim.victimId || generateRandomId(6);
//           const reliefId = victim.reliefId || generateRandomId(6);

//           const insertQuery = `
//             INSERT INTO victim_relief (
//               victim_id, relief_id, fir_id, victim_name, community_certificate,
//               relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             ON DUPLICATE KEY UPDATE
//               victim_name = VALUES(victim_name),
//               community_certificate = VALUES(community_certificate),
//               relief_amount_scst = VALUES(relief_amount_scst),
//               relief_amount_exgratia = VALUES(relief_amount_exgratia),
//               relief_amount_first_stage = VALUES(relief_amount_first_stage),
//               additional_relief = VALUES(additional_relief)
//           `;

//           const values = [
//             victimId,
//             reliefId,
//             firId,
//             victim.victimName || `Victim ${index + 1}`,
//             victim.communityCertificate || 'no',
//             victim.reliefAmountScst || '0.00',
//             victim.reliefAmountExGratia || '0.00',
//             victim.reliefAmountFirstStage || '0.00',
//             JSON.stringify(victim.additionalRelief || []),
//           ];

//           db.query(insertQuery, values, (err) => {
//             if (err) return reject({ step: 'victim_relief' });

//             const selectQuery = 'SELECT * FROM victim_relief WHERE victim_id = ?';
//             db.query(selectQuery, [victimId], (err, result) => {
//               if (err) return reject({ step: 'select_victim_relief' });
//               savedData.victims.push(result[0]);
//               resolve();
//             });
//           });
//         });
//       });

//     // Insert or update proceedings data
//     const proceedingsPromise = new Promise((resolve, reject) => {
//       const proceedingsId = generateRandomId(6);
//         const insertQuery = `
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

//         db.query(insertQuery, values, (err) => {
//           if (err) return reject({ step: 'proceedings_victim_relief' });

//           const selectQuery = 'SELECT * FROM proceedings_victim_relief WHERE proceedings_id = ?';
//           db.query(selectQuery, [proceedingsId], (err, result) => {
//             if (err) return reject({ step: 'select_proceedings_victim_relief' });
//             savedData.proceedings = result[0];
//             resolve();
//           });
//         });
//       });

//       const attachmentPromises = attachments.map((attachment) => {
//         return new Promise((resolve, reject) => {
//             const attachmentId = generateRandomId(8);
    
//             // Debug: Log values before inserting
//             console.log("Inserting Attachment:", {
//                 attachmentId,
//                 firId,
//                 fileName: attachment.originalname,
//                 filePath: attachment.filename,
//             });
    
//             const insertQuery = `
//                 INSERT INTO attachment_relief (
//                   attachment_id, fir_id, file_name, file_path
//                 ) VALUES (?, ?, ?, ?)
//                 ON DUPLICATE KEY UPDATE
//                   file_name = VALUES(file_name),
//                   file_path = VALUES(file_path)
//             `;
    
//             const values = [
//                 attachmentId,
//                 firId,
//                 attachment.originalname,
//                 attachment.filename,
//             ];
    
//             db.query(insertQuery, values, (err) => {
//                 if (err) {
//                     console.error("Database Insert Error:", err);
//                     return reject({ step: 'attachment_relief' });
//                 }
    
//                 const selectQuery = 'SELECT * FROM attachment_relief WHERE attachment_id = ?';
//                 db.query(selectQuery, [attachmentId], (err, result) => {
//                     if (err) {
//                         console.error("Database Select Error:", err);
//                         return reject({ step: 'select_attachment_relief' });
//                     }
    
//                     if (result.length > 0) {
//                         console.log("Inserted Data:", result[0]); 
//                         savedData.attachments.push(result[0]);
//                         resolve();
//                     } else {
//                         console.error("No data found for attachment_id:", attachmentId);
//                         reject({ step: 'select_attachment_relief', error: "No record found" });
//                     }
//                 });
//             });
//         });
//     });

//       Promise.all([...victimPromises, proceedingsPromise, ...attachmentPromises])
//         .then(() => {
//           db.commit((err) => {
//             if (err) {
//               return db.rollback(() => res.status(500).json({ message: 'Commit error' }));
//             }
//             res.status(200).json({ message: 'Step 5 data saved successfully, including attachments.', data: savedData });
//           });
//         })
//         .catch((err) => {
//           db.rollback(() => {
//             console.error('Transaction failed at:', err.step, err.error);
//             res.status(500).json({ message: `Transaction failed at ${err.step}`.error });
//           });
//         });
//     });
//   });
// };

// exports.handleStepFive = (req, res) => {
//   upload_step5(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error' });

//     const {
//       firId,
//       totalCompensation,
//       proceedingsFileNo,
//       proceedingsDate,
//     } = req.body;

//     const victimsRelief = req.body.victimsRelief ? JSON.parse(req.body.victimsRelief) : [];
//     const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].filename : null;
//     const attachments = req.files['attachments'] || [];

//     if (!firId) {
//       return res.status(400).json({ message: 'FIR ID is missing.' });
//     }

//     const generateRandomId = (length = 6) => {
//       const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//       return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
//     };

//     db.getConnection((err, connection) => {
//       if (err) return res.status(500).json({ message: 'DB connection error' });

//       connection.beginTransaction((err) => {
//         if (err) {
//           connection.release();
//           return res.status(500).json({ message: 'Transaction start error' });
//         }

//         const savedData = { victims: [], proceedings: null, attachments: [] };

//         const victimPromises = victimsRelief.map((victim, index) => {
//           return new Promise((resolve, reject) => {
//             const victimId = victim.victimId || generateRandomId(6);
//             const reliefId = victim.reliefId || generateRandomId(6);

//             const insertQuery = `
//               INSERT INTO victim_relief (
//                 victim_id, relief_id, fir_id, victim_name, community_certificate,
//                 relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief
//               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//               ON DUPLICATE KEY UPDATE
//                 victim_name = VALUES(victim_name),
//                 community_certificate = VALUES(community_certificate),
//                 relief_amount_scst = VALUES(relief_amount_scst),
//                 relief_amount_exgratia = VALUES(relief_amount_exgratia),
//                 relief_amount_first_stage = VALUES(relief_amount_first_stage),
//                 additional_relief = VALUES(additional_relief)
//             `;

//             const values = [
//               victimId,
//               reliefId,
//               firId,
//               victim.victimName || `Victim ${index + 1}`,
//               victim.communityCertificate || 'no',
//               victim.reliefAmountScst || '0.00',
//               victim.reliefAmountExGratia || '0.00',
//               victim.reliefAmountFirstStage || '0.00',
//               JSON.stringify(victim.additionalRelief || []),
//             ];

//             connection.query(insertQuery, values, (err) => {
//               if (err) return reject({ step: 'victim_relief' });

//               const selectQuery = 'SELECT * FROM victim_relief WHERE victim_id = ?';
//               connection.query(selectQuery, [victimId], (err, result) => {
//                 if (err) return reject({ step: 'select_victim_relief' });
//                 savedData.victims.push(result[0]);
//                 resolve();
//               });
//             });
//           });
//         });

//         const proceedingsPromise = new Promise((resolve, reject) => {
//           const proceedingsId = generateRandomId(6);
//           const insertQuery = `
//             INSERT INTO proceedings_victim_relief (
//               proceedings_id, fir_id, total_compensation, proceedings_file_no,
//               proceedings_date, proceedings_file
//             ) VALUES (?, ?, ?, ?, ?, ?)
//             ON DUPLICATE KEY UPDATE
//               total_compensation = VALUES(total_compensation),
//               proceedings_file_no = VALUES(proceedings_file_no),
//               proceedings_date = VALUES(proceedings_date),
//               proceedings_file = VALUES(proceedings_file)
//           `;
//           const values = [
//             proceedingsId,
//             firId,
//             totalCompensation || '0.00',
//             proceedingsFileNo || null,
//             proceedingsDate || null,
//             proceedingsFile || null,
//           ];

//           connection.query(insertQuery, values, (err) => {
//             if (err) return reject({ step: 'proceedings_victim_relief' });

//             const selectQuery = 'SELECT * FROM proceedings_victim_relief WHERE proceedings_id = ?';
//             connection.query(selectQuery, [proceedingsId], (err, result) => {
//               if (err) return reject({ step: 'select_proceedings_victim_relief' });
//               savedData.proceedings = result[0];
//               resolve();
//             });
//           });
//         });

//         const attachmentPromises = attachments.map((attachment) => {
//           return new Promise((resolve, reject) => {
//             const attachmentId = generateRandomId(8);

//             const insertQuery = `
//               INSERT INTO attachment_relief (
//                 attachment_id, fir_id, file_name, file_path
//               ) VALUES (?, ?, ?, ?)
//               ON DUPLICATE KEY UPDATE
//                 file_name = VALUES(file_name),
//                 file_path = VALUES(file_path)
//             `;

//             const values = [
//               attachmentId,
//               firId,
//               attachment.originalname,
//               attachment.filename,
//             ];

//             connection.query(insertQuery, values, (err) => {
//               if (err) return reject({ step: 'attachment_relief' });

//               const selectQuery = 'SELECT * FROM attachment_relief WHERE attachment_id = ?';
//               connection.query(selectQuery, [attachmentId], (err, result) => {
//                 if (err) return reject({ step: 'select_attachment_relief' });

//                 if (result.length > 0) {
//                   savedData.attachments.push(result[0]);
//                   resolve();
//                 } else {
//                   reject({ step: 'select_attachment_relief', error: "No record found" });
//                 }
//               });
//             });
//           });
//         });

//         Promise.all([...victimPromises, proceedingsPromise, ...attachmentPromises])
//           .then(() => {
//             connection.commit((err) => {
//               if (err) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   res.status(500).json({ message: 'Commit error' });
//                 });
//               }

//               connection.release();
//               res.status(200).json({
//                 message: 'Step 5 data saved successfully, including attachments.',
//                 data: savedData,
//               });
//             });
//           })
//           .catch((err) => {
//             connection.rollback(() => {
//               connection.release();
//               console.error('Transaction failed at:', err.step, err.error);
//               res.status(500).json({ message: `Transaction failed at ${err.step}`.error });
//             });
//           });
//       });
//     });
//   });
// };


// modify step5 for attachment
exports.handleStepFive = (req, res) => {
  upload_step5(req, res, (err) => {
    if (err) return res.status(500).json({ message: 'File upload error' });

    const {
      firId,
      totalCompensation,
      proceedingsFileNo,
      proceedingsDate,
    } = req.body;

    const victimsRelief = req.body.victimsRelief ? JSON.parse(req.body.victimsRelief) : [];
    const proceedingsFile = req.body.proceedingsFile ? req.body.proceedingsFile : null;
    const attachments = req.body.attachments || [];

    if (!firId) {
      return res.status(400).json({ message: 'FIR ID is missing.' });
    }

    const generateRandomId = (length = 6) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    };

    db.getConnection((err, connection) => {
      if (err) return res.status(500).json({ message: 'DB connection error' });

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return res.status(500).json({ message: 'Transaction start error' });
        }

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

            connection.query(insertQuery, values, (err) => {
              if (err) return reject({ step: 'victim_relief' });

              const selectQuery = 'SELECT * FROM victim_relief WHERE victim_id = ?';
              connection.query(selectQuery, [victimId], (err, result) => {
                if (err) return reject({ step: 'select_victim_relief' });
                savedData.victims.push(result[0]);
                resolve();
              });
            });
          });
        });

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

          connection.query(insertQuery, values, (err) => {
            if (err) return reject({ step: 'proceedings_victim_relief' });

            const selectQuery = 'SELECT * FROM proceedings_victim_relief WHERE proceedings_id = ?';
            connection.query(selectQuery, [proceedingsId], (err, result) => {
              if (err) return reject({ step: 'select_proceedings_victim_relief' });
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

            connection.query(insertQuery, values, (err) => {
              if (err) return reject({ step: 'attachment_relief' });

              const selectQuery = 'SELECT * FROM attachment_relief WHERE attachment_id = ?';
              connection.query(selectQuery, [attachmentId], (err, result) => {
                if (err) return reject({ step: 'select_attachment_relief' });

                if (result.length > 0) {
                  savedData.attachments.push(result[0]);
                  resolve();
                } else {
                  reject({ step: 'select_attachment_relief', error: "No record found" });
                }
              });
            });
          });
        });

        Promise.all([...victimPromises, proceedingsPromise, ...attachmentPromises])
          .then(() => {
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ message: 'Commit error' });
                });
              }

              connection.release();
              res.status(200).json({
                message: 'Step 5 data saved successfully, including attachments.',
                data: savedData,
              });
            });
          })
          .catch((err) => {
            connection.rollback(() => {
              connection.release();
              console.error('Transaction failed at:', err.step, err.error);
              res.status(500).json({ message: `Transaction failed at`.error });
            });
          });
      });
    });
  });
};


const upload_step6 = multer({ storage: storage_step5 }).fields([
  { name: 'proceedingsFile', maxCount: 1 },
  { name: 'attachments', maxCount: 10 }
]);

// exports.handleStepSix = (req, res) => {
//   upload_step6(req, res, (err) => {
//     if (err) return res.status(500).json({ message: 'File upload error' });

//     const { firId, chargesheetDetails, victimsRelief } = req.body;

//     console.log("Chargesheet Details:", chargesheetDetails);

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
//       if (err) return res.status(500).json({ message: 'Transaction error' });

//       // Update FIR Status
//       const updateFirStatusPromise = new Promise((resolve, reject) => {
//         const query = `
//           UPDATE fir_add
//           SET status = 6
//           WHERE fir_id = ?
//         `;
//         db.query(query, [firId], (err) => {
//           if (err) return reject(err);
//           resolve();
//         });
//       });

//       // Parse chargesheetDetails
//       let parsedChargesheetDetails;
//       try {
//         parsedChargesheetDetails = JSON.parse(chargesheetDetails);
//       } catch (error) {
//         console.error('Error parsing chargesheetDetails:', error);
//         return res.status(400).json({ message: 'Invalid chargesheetDetails data format' });
//       }

//       // Generate chargesheetId and insert chargesheet data
//       const chargesheetId = parsedChargesheetDetails.chargesheetId || generateRandomId();
//       const chargesheetPromise = new Promise((resolve, reject) => {
//         const query = `
//           INSERT INTO chargesheet_details (
//             chargesheet_id, fir_id, charge_sheet_filed, court_district,
//             court_name, case_type, case_number, chargesheetDate, rcs_file_number,
//             rcs_filing_date, mf_copy_path, total_compensation_1,
//             proceedings_file_no, proceedings_date, upload_proceedings_path
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//           ON DUPLICATE KEY UPDATE
//             charge_sheet_filed = VALUES(charge_sheet_filed),
//             court_district = VALUES(court_district),
//             court_name = VALUES(court_name),
//             case_type = VALUES(case_type),
//             case_number = VALUES(case_number),
//             chargesheetDate = VALUES(chargesheetDate),
//             rcs_file_number = VALUES(rcs_file_number),
//             rcs_filing_date = VALUES(rcs_filing_date),
//             mf_copy_path = VALUES(mf_copy_path),
//             total_compensation_1 = VALUES(total_compensation_1),
//             proceedings_file_no = VALUES(proceedings_file_no),
//             proceedings_date = VALUES(proceedings_date),
//             upload_proceedings_path = VALUES(upload_proceedings_path)
//         `;

//         const values = [
//           chargesheetId,
//           firId,
//           parsedChargesheetDetails.chargeSheetFiled || null,
//           parsedChargesheetDetails.courtDistrict || null,
//           parsedChargesheetDetails.courtName || null,
//           parsedChargesheetDetails.caseType || null,
//           parsedChargesheetDetails.caseNumber || null,
//           parsedChargesheetDetails.chargesheetDate || null,
//           parsedChargesheetDetails.rcsFileNumber || null,
//           parsedChargesheetDetails.rcsFilingDate || null,
//           parsedChargesheetDetails.mfCopyPath || null,
//           parsedChargesheetDetails.totalCompensation || null,
//           parsedChargesheetDetails.proceedingsFileNo || null,
//           parsedChargesheetDetails.proceedingsDate || null,
//           proceedingsFile || null,
//         ];

//         db.query(query, values, (err) => {
//           if (err) return reject(err);
//           resolve();
//         });
//       });

//       // Parse victimsRelief
//       let parsedVictimsRelief = [];
//       try {
//         parsedVictimsRelief = JSON.parse(victimsRelief);
//       } catch (error) {
//         console.error('Error parsing victimsRelief:', error);
//         return res.status(400).json({ message: 'Invalid victimsRelief data format' });
//       }

//       // Insert victim data
//       const victimPromises = parsedVictimsRelief.map((victim, index) => {
//         return new Promise((resolve, reject) => {
//           const victimId = victim.victimId || generateRandomId(); 
//           console.log('Victim Data:', victim);
//           console.log('Relief Amounts:', {
//             scst: victim.reliefAmountScst,
//             exGratia: victim.reliefAmountExGratia,
//             secondStage: victim.reliefAmountSecondStage,
//           });

//           const query = `
//             INSERT INTO chargesheet_victims (
//               fir_id, victim_id, chargesheet_id, victim_name,
//               relief_amount_scst_1, relief_amount_ex_gratia_1, relief_amount_second_stage
//             ) VALUES (?, ?, ?, ?, ?, ?, ?)
//             ON DUPLICATE KEY UPDATE
//               fir_id = VALUES(fir_id),
//               victim_name = VALUES(victim_name),
//               relief_amount_scst_1 = VALUES(relief_amount_scst_1),
//               relief_amount_ex_gratia_1 = VALUES(relief_amount_ex_gratia_1),
//               relief_amount_second_stage = VALUES(relief_amount_second_stage)
//           `;

//           const values = [
//             firId, 
//             victimId,
//             chargesheetId,
//             victim.victimName || `Victim ${index + 1}`,
//             victim.reliefAmountScst || '0.00',
//             victim.reliefAmountExGratia || '0.00',
//             victim.reliefAmountSecondStage || '0.00',
//           ];

//           db.query(query, values, (err) => {
//             if (err) {
//               console.error('Error inserting victim data:', err);
//               return reject(err);
//             }
//             resolve();
//           });
//         });
//       });

//       // Insert attachment data
//       const attachmentPromises = attachments.map((attachment) => {
//         return new Promise((resolve, reject) => {
//           const attachmentId = generateRandomId();
//           const query = `
//             INSERT INTO chargesheet_attachments (fir_id,
//               attachment_id, chargesheet_id, file_path
//             ) VALUES (?, ?, ?,?)
//           `;
//           const values = [
//             firId,
//             attachmentId,
//             chargesheetId,
//             attachment.path || null,
//           ];

//           db.query(query, values, (err) => {
//             if (err) return reject(err);
//             resolve();
//           });
//         });
//       });

//       // Execute all promises and commit transaction
//       Promise.all([updateFirStatusPromise, chargesheetPromise, ...victimPromises, ...attachmentPromises])
//         .then(() => {
//           db.commit((err) => {
//             if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error' }));
//             res.status(200).json({ message: 'Step 6 data saved successfully, and FIR status updated to 6.' });
//           });
//         })
//         .catch((err) => {
//           db.rollback(() => res.status(500).json({ message: 'Transaction failed' }));
//         });
//     });
//   });
// };


exports.handleStepSix = (req, res) => {
  upload_step6(req, res, (err) => {
    if (err) return res.status(500).json({ message: 'File upload error' });

    const { firId, chargesheetDetails, victimsRelief } = req.body;
    const proceedingsFile = req.files['proceedingsFile'] ? req.files['proceedingsFile'][0].path : null;
    const attachments = req.files['attachments'] || [];

    if (!firId) {
      return res.status(400).json({ message: 'FIR ID is missing.' });
    }

    const generateRandomId = (length = 8) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    };

    db.getConnection((err, connection) => {
      if (err) return res.status(500).json({ message: 'DB connection error' });

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return res.status(500).json({ message: 'Transaction error' });
        }

        // Parse chargesheetDetails
        let parsedChargesheetDetails;
        try {
          parsedChargesheetDetails = JSON.parse(chargesheetDetails);
        } catch (error) {
          connection.release();
          return res.status(400).json({ message: 'Invalid chargesheetDetails data format' });
        }

        let firStatus = 5;
        if(parsedChargesheetDetails.chargeSheetFiled == "yes" && parsedChargesheetDetails.chargesheetDate){
          firStatus = 6;
        }
         // Update FIR Status
         const updateFirStatusPromise = new Promise((resolve, reject) => {
          const query = `UPDATE fir_add SET status = ? WHERE fir_id = ?`;
          connection.query(query, [firStatus, firId], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });

        const chargesheetId = parsedChargesheetDetails.chargesheetId || generateRandomId();

        const chargesheetPromise = new Promise((resolve, reject) => {
          const query = `
            INSERT INTO chargesheet_details (
              chargesheet_id, fir_id, charge_sheet_filed, court_district,
              court_name, case_type, case_number, chargesheetDate, rcs_file_number,
              rcs_filing_date, mf_copy_path, total_compensation_1,
              proceedings_file_no, proceedings_date, upload_proceedings_path, section_deleted_copy_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              charge_sheet_filed = VALUES(charge_sheet_filed),
              court_district = VALUES(court_district),
              court_name = VALUES(court_name),
              case_type = VALUES(case_type),
              case_number = VALUES(case_number),
              chargesheetDate = VALUES(chargesheetDate),
              rcs_file_number = VALUES(rcs_file_number),
              rcs_filing_date = VALUES(rcs_filing_date),
              mf_copy_path = VALUES(mf_copy_path),
              total_compensation_1 = VALUES(total_compensation_1),
              proceedings_file_no = VALUES(proceedings_file_no),
              proceedings_date = VALUES(proceedings_date),
              upload_proceedings_path = VALUES(upload_proceedings_path),
              section_deleted_copy_path = VALUES(section_deleted_copy_path)
          `;

          const values = [
            chargesheetId,
            firId,
            parsedChargesheetDetails.chargeSheetFiled || null,
            parsedChargesheetDetails.courtDistrict || null,
            parsedChargesheetDetails.courtName || null,
            parsedChargesheetDetails.caseType || null,
            parsedChargesheetDetails.caseNumber || null,
            parsedChargesheetDetails.chargesheetDate || null,
            parsedChargesheetDetails.rcsFileNumber || null,
            parsedChargesheetDetails.rcsFilingDate || null,
            parsedChargesheetDetails.mfCopyPath || null,
            parsedChargesheetDetails.totalCompensation || null,
            parsedChargesheetDetails.proceedingsFileNo || null,
            parsedChargesheetDetails.proceedingsDate || null,
            proceedingsFile || null,
            parsedChargesheetDetails.sectionDeletedCopyPath || null,
          ];

          connection.query(query, values, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });

        // Parse victimsRelief
        let parsedVictimsRelief = [];
        try {
          parsedVictimsRelief = JSON.parse(victimsRelief);
        } catch (error) {
          connection.release();
          return res.status(400).json({ message: 'Invalid victimsRelief data format' });
        }

        // Insert victim data
        const victimPromises = parsedVictimsRelief.map((victim, index) => {
          return new Promise((resolve, reject) => {
            const victimId = victim.victimId || generateRandomId();

            const query = `
              INSERT INTO chargesheet_victims (
                fir_id, victim_id, chargesheet_id, victim_name,
                relief_amount_scst_1, relief_amount_ex_gratia_1, relief_amount_second_stage
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
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

            connection.query(query, values, (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
        });

        // Insert attachment data
        const attachmentPromises = attachments.map((attachment) => {
          return new Promise((resolve, reject) => {
            const attachmentId = generateRandomId();
            const query = `
              INSERT INTO chargesheet_attachments (
                fir_id, attachment_id, chargesheet_id, file_path
              ) VALUES (?, ?, ?, ?)
            `;
            const values = [
              firId,
              attachmentId,
              chargesheetId,
              attachment.path || null,
            ];

            connection.query(query, values, (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
        });

        Promise.all([
          updateFirStatusPromise,
          chargesheetPromise,
          ...victimPromises,
          ...attachmentPromises,
        ])
          .then(() => {
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ message: 'Commit error' });
                });
              }

              connection.release();
              res.status(200).json({
                message: 'Step 6 data saved successfully, and FIR status updated to 6.',
              });
            });
          })
          .catch((err) => {
            connection.rollback(() => {
              connection.release();
              res.status(500).json({ message: 'Transaction failed' });
            });
          });
      });
    });
  });
};



exports.getPoliceStations = (req, res) => {
  const { district } = req.query;
  const query = 'SELECT station_name FROM police_stations WHERE city_or_district = ?';

  db.query(query, [district], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch police stations' });
    }
    res.json(results.map(row => row.station_name));
  });
};

exports.getalteredcasebasedID = (req, res) => {
  // console.log('hi')
  const { id } = req.query;
  const query = `SELECT al.*, vm.victim_name FROM victim_altered_child_table al
                left join victims vm on vm.victim_id = al.victim_id
                WHERE al.parent_id = ?`;
// console.log(query,id)
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch data' });
    }
    res.json(results);
  });
};


// Fetch all Offence Names
// exports.getAllOffences = (req, res) => {
//   const query = 'SELECT ofe.id, ofe.offence_name ,ofa.offence_act_name FROM offence ofe left join offence_acts ofa on ofa.offence_id = ofe.id';
//   db.query(query, (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to fetch offences' });
//     }
//     res.json(results);
//   });
// };


// Fetch all Offence Names
exports.getAllOffences = (req, res) => {
  const query = `SELECT 
                    id, name_of_offence as offence_name , poa_act_section as offence_act_name 
                  FROM 
                    offence_relief_details 
                  WHERE 
                    status = 1
                  ORDER BY order_visible`;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch offences' });
    }
    res.json(results);
  });
};



// Fetch all Offence Act Names
exports.getAllOffenceActs = (req, res) => {
  // console.log('api calling')
  const { offence } = req.query;
  // console.log(offence)
  let query = `
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
  
  if(offence)
    query = `SELECT GROUP_CONCAT(offence_act_name) offence_act_names, Max(fir_stage_as_per_act) fir_stage_as_per_act, Max(fir_stage_ex_gratia) fir_stage_ex_gratia, Max(chargesheet_stage_as_per_act) chargesheet_stage_as_per_act, Max(chargesheet_stage_ex_gratia) chargesheet_stage_ex_gratia, Max(final_stage_as_per_act) final_stage_as_per_act, Max(final_stage_ex_gratia) final_stage_ex_gratia FROM offence_acts WHERE offence_id IN (${offence})`;
    // console.log(offence);
    // console.log(query)
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch offence acts' });
    }
    if(offence)
      res.json(results[0]);
  });
};


// Fetch all Caste Names (SC/ST Sections)
exports.getAllCastes = (req, res) => {
  const query = 'SELECT caste_name FROM caste_community';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch caste names' });
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
        return res.status(500).json({ message: 'Failed to delete FIR data' });
      }
      return res.status(200).json({ status:true,message:"Deleted Successfully" });
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
        return res.status(500).json({ message: 'Failed to delete FIR data' });
      }
      return res.status(200).json({ status:true,message:"Deleted Successfully" });
    });
}

exports.getAllCommunities = (req, res) => {
  const query = 'SELECT DISTINCT community_name FROM caste_community';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch communities' });
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
      return res.status(500).json({ message: 'Failed to fetch caste names' });
    }
    // console.log('Query results:', results); // Log results for debugging
    res.json(results.map(row => row.caste_name));
  });
};



// exports.getAllAccusedCommunities = (req, res) => {
//   const query = 'SELECT DISTINCT community_name FROM acquest_community_caste';
//   db.query(query, (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to fetch accused communities' });
//     }
//     res.json(results.map(row => row.community_name));
//   });
// };

exports.getAllAccusedCommunities = (req, res) => {
  const query = `
    
    SELECT DISTINCT community_name COLLATE utf8mb4_general_ci AS community_name FROM acquest_community_caste

    UNION 

    SELECT DISTINCT community_name COLLATE utf8mb4_general_ci AS community_name FROM caste_community
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch accused communities' });
    }
    res.json(results.map(row => row.community_name));
  });
};


exports.getAccusedCastesByCommunity = (req, res) => {
  const { community } = req.query;
  var TableName = ''
  if(community == 'ST' || community == 'SC'){
    TableName = 'caste_community'
  } else {
    TableName =  'acquest_community_caste'
  }

  const query = `SELECT caste_name FROM ${TableName} WHERE community_name = ?`;
  db.query(query, [community], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch accused castes' });
    }
    res.json(results.map(row => row.caste_name));
  });
};


exports.getAllRevenues = (req, res) => {
  const query = 'SELECT revenue_district_name FROM district_revenue';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch revenue districts' });
    }
    res.json(results);
  });
};


exports.getAllCourtDivisions = (req, res) => {
  const query = 'SELECT DISTINCT court_division_name FROM court';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch court divisions' });
    }
    res.json(results.map(row => row.court_division_name));
  });
};


exports.getCourtRangesByDivision = (req, res) => {
  const { division } = req.query;
  const query = 'SELECT court_range_name FROM court WHERE court_division_name = ?';
  db.query(query, [division], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch court ranges' });
    }
    res.json(results.map(row => row.court_range_name));
  });
};


exports.getAllDistricts = (req, res) => {
  const query = 'SELECT district_name FROM district';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch districts' });
    }
    res.json(results.map(row => row.district_name));
  });
};


// mahi changes // disable for temprary by surya
// exports.getVictimsReliefDetails = (req, res) => {
//   const { firId } = req.params;

//   if (!firId) {
//     return res.status(400).json({ message: 'FIR ID is required' });
//   }

 
//   const queryVictims = `
//     SELECT
//       victim_id,
//       victim_name,
//       fir_stage_as_per_act,
//       fir_stage_ex_gratia,
//       chargesheet_stage_as_per_act,
//       chargesheet_stage_ex_gratia,
//       final_stage_as_per_act,
//       final_stage_ex_gratia
//     FROM victims
//     WHERE fir_id = ?
//   `;

//   db.query(queryVictims, [firId], (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to fetch victim details' });
//     }

//     const victimPromises = results.map((victim) => {
//       const queryRelief = `
//         SELECT *
//         FROM victim_relief
//         WHERE victim_id = ?
//       `;

//       return new Promise((resolve, reject) => {
//         db.query(queryRelief, [victim.victim_id], (err, reliefResults) => {
//           if (err) {
//             return reject(err);
//           }

//           if (reliefResults.length > 0) {
//             const reliefData = reliefResults[0]; 
//             const mergedVictim = {
//               ...victim, 
//               ...reliefData, 
//             };

//             resolve(mergedVictim);
//           } else {
//             resolve(victim);
//           }
//         });
//       });
//     });

//     Promise.all(victimPromises)
//       .then((victimsWithRelief) => {
//         return res.status(200).json({ victimsReliefDetails: victimsWithRelief });
//       })
//       .catch((error) => {
//         console.error('Error fetching relief details:', error);
//         return res.status(500).json({ message: 'Failed to fetch relief details', error });
//       });
//   });
// };


// exports.getVictimsReliefDetails = (req, res) => {
//   const { firId } = req.params;

//   if (!firId) {
//     return res.status(400).json({ message: 'FIR ID is required' });
//   }

//   const queryVictims = `
//     SELECT
//       victim_id,
//       victim_name,
//       fir_stage_as_per_act,
//       fir_stage_ex_gratia,
//       chargesheet_stage_as_per_act,
//       chargesheet_stage_ex_gratia,
//       final_stage_as_per_act,
//       final_stage_ex_gratia,
//       relief_applicable,
//       offence_committed
//     FROM victims
//     WHERE fir_id = ? and delete_status = 0
//   `;

//   db.query(queryVictims, [firId], (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to fetch victim details' });
//     }

//     const victimPromises = results.map((victim) => {
//       // const queryRelief = `SELECT * FROM victim_relief WHERE victim_id = ?`;
//       // const queryChargesheetVictims = `SELECT * FROM chargesheet_victims WHERE victim_id = ?`;
//       // const queryTrialRelief = `SELECT * FROM trial_relief WHERE victim_id = ?`;

//       const queryRelief = `
//       SELECT
//          vr.* , vm.victim_name
//       FROM 
//         victim_relief vr
//       LEFT JOIN 
//         victims vm on vm.victim_id = vr.victim_id

//       WHERE vr.victim_id = ? and vm.delete_status = 0`;

//       const queryChargesheetVictims = `
//         SELECT 
//           cv.*, vm.victim_name
//         FROM 
//           chargesheet_victims cv
//         LEFT JOIN 
//           victims vm ON vm.victim_id = cv.victim_id
//         WHERE cv.victim_id = ? and vm.delete_status = 0`;
      
//       const queryTrialRelief = `
//         SELECT 
//           tr.*, vm.victim_name
//         FROM 
//           trial_relief tr
//         LEFT JOIN 
//           victims vm ON vm.victim_id = tr.victim_id
//         WHERE tr.victim_id = ? and vm.delete_status = 0`;

//       return new Promise((resolve, reject) => {
//         const reliefPromise = new Promise((res, rej) => {
//           db.query(queryRelief, [victim.victim_id], (err, result) =>
//             err ? rej(err) : res(result[0] || {}));
//         });

//         const chargesheetPromise = new Promise((res, rej) => {
//           db.query(queryChargesheetVictims, [victim.victim_id], (err, result) =>
//             err ? rej(err) : res(result[0] || {}));
//         });

//         const trialPromise = new Promise((res, rej) => {
//           db.query(queryTrialRelief, [victim.victim_id], (err, result) =>
//             err ? rej(err) : res(result[0] || {}));
//         });

//         Promise.all([reliefPromise, chargesheetPromise, trialPromise])
//           .then(([reliefData, chargesheetData, trialData]) => {
//             const mergedVictim = {
//               ...victim,
//               ...reliefData,
//               ...chargesheetData,
//               ...trialData,
//             };
//             resolve(mergedVictim);
//           })
//           .catch(reject);
//       });
//     });

//     Promise.all(victimPromises)
//       .then((victimsWithAllDetails) => {
//         res.status(200).json({ victimsReliefDetails: victimsWithAllDetails });
//       })
//       .catch((error) => {
//         console.error('Error fetching full victim details:', error);
//         res.status(500).json({ message: 'Failed to fetch full victim details', error });
//       });
//   });
// };



// optimized API reduced load
exports.getVictimsReliefDetails = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

  // Step 1: Fetch all victims
  const queryVictims = `
    SELECT
      victim_id,
      victim_name,
      fir_stage_as_per_act,
      fir_stage_ex_gratia,
      chargesheet_stage_as_per_act,
      chargesheet_stage_ex_gratia,
      final_stage_as_per_act,
      final_stage_ex_gratia,
      relief_applicable,
      offence_committed
    FROM victims
    WHERE fir_id = ? AND delete_status = 0
  `;

  db.query(queryVictims, [firId], (err, victims) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch victim details' });
    }

    if (victims.length === 0) {
      return res.status(200).json({ victimsReliefDetails: [] });
    }

    const victimIds = victims.map(v => v.victim_id);

    // Step 2: Fetch all reliefs, chargesheet and trial reliefs in bulk
    const reliefQuery = `
      SELECT id, relief_id, fir_id, victim_id, community_certificate, relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage, additional_relief FROM victim_relief WHERE victim_id IN (?)`;
    const chargesheetQuery = `
      SELECT id, fir_id, victim_id, relief_amount_scst_1, relief_amount_ex_gratia_1, relief_amount_second_stage FROM chargesheet_victims WHERE victim_id IN (?)`;
    const trialQuery = `
      SELECT id, victim_id, fir_id, relief_amount_act, relief_amount_government, relief_amount_final_stage FROM trial_relief WHERE victim_id IN (?)`;

    Promise.all([
      queryAsync(reliefQuery, [victimIds]),
      queryAsync(chargesheetQuery, [victimIds]),
      queryAsync(trialQuery, [victimIds])
    ])
    .then(([reliefs, chargesheets, trials]) => {
      // Step 3: Group all by victim_id for fast access
      const reliefMap = Object.fromEntries(reliefs.map(r => [r.victim_id, r]));
      const chargesheetMap = Object.fromEntries(chargesheets.map(c => [c.victim_id, c]));
      const trialMap = Object.fromEntries(trials.map(t => [t.victim_id, t]));

      // Step 4: Merge each victim with their related data
      const fullDetails = victims.map(v => ({
        ...v,
        ...(reliefMap[v.victim_id] || {}),
        ...(chargesheetMap[v.victim_id] || {}),
        ...(trialMap[v.victim_id] || {})
      }));

      res.status(200).json({ victimsReliefDetails: fullDetails });
    })
    .catch(error => {
      console.error('Error during victim detail merge:', error);
      res.status(500).json({ message: 'Failed to fetch victim relief details', error });
    });
  });
};





// exports.getFirDetails = async  (req, res) => 
// {
//   const { fir_id } = req.query;
//   if (!fir_id) 
//     return res.status(400).json({ message: 'FIR ID is required.' });  

//   const query = `SELECT *,DATE_FORMAT(date_of_occurrence, '%Y-%m-%d') AS date_of_occurrence , DATE_FORMAT(date_of_occurrence_to, '%Y-%m-%d') AS date_of_occurrence_to , DATE_FORMAT(date_of_registration, '%Y-%m-%d') AS date_of_registration FROM fir_add WHERE fir_id = ?`;
//   db.query(query, [fir_id], async (err, result) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ message: 'Error fetching FIR details.' });
//     }

//     const query1 = `SELECT * FROM victims WHERE fir_id = ? and delete_status = 0`;
//     db.query(query1, [fir_id], async (err, result1) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ message: 'Error fetching victims.' });
//       }

//       const query2 = `SELECT * FROM accuseds WHERE fir_id = ? and delete_status = 0`;
//       db.query(query2, [fir_id], async (err, result2) => {
//         if (err) {
//           console.error(err);
//           return res.status(500).json({ message: 'Error fetching accused.' });
//         }

//         const query3 = `SELECT * FROM proceedings_victim_relief cd LEFT JOIN attachment_relief ca ON cd.fir_id = ca.fir_id WHERE cd.fir_id = ? GROUP BY cd.fir_id, cd.total_compensation, cd.proceedings_file_no, cd.proceedings_file, cd.proceedings_date`;
//         db.query(query3, [fir_id], async (err, result3) => {
//           if (err) {
//             console.error(err);
//             return res.status(500).json({ message: 'Error fetching proceedings victim relief.' });
//           }

//           const query4 = `SELECT cd.*, ca.id AS attachment_id, ca.file_path FROM chargesheet_details cd LEFT JOIN chargesheet_attachments ca ON cd.fir_id = ca.fir_id WHERE cd.fir_id = ?`;
//           db.query(query4, [fir_id], async (err, result4) => {
//             if (err) {
//               console.error(err);
//               return res.status(500).json({ message: 'Error fetching chargesheet details.' });
//             }

//             let chargesheetData = null;
//             let attachments = [];

//             if (result4.length > 0) {
//               chargesheetData = {
//                 fir_id: result4[0].fir_id,
//                 chargesheet_id: result4[0].chargesheet_id,
//                 ChargeSheet_CRL_number: result4[0].ChargeSheet_CRL_number,
//                 quash_petition_no: result4[0].quash_petition_no,
//                 petition_date: result4[0].petition_date,
//                 upload_court_order_path: result4[0].upload_court_order_path,
//                 chargesheetDate : result4[0].chargesheetDate,
//                 charge_sheet_filed: result4[0].charge_sheet_filed,
//                 court_district: result4[0].court_district,
//                 court_name: result4[0].court_name,
//                 case_type: result4[0].case_type,
//                 case_number: result4[0].case_number,
//                 rcs_file_number: result4[0].rcs_file_number,
//                 rcs_filing_date: result4[0].rcs_filing_date,
//                 mf_copy_path: result4[0].mf_copy_path,
//                 total_compensation_1: result4[0].total_compensation_1,
//                 proceedings_file_no: result4[0].proceedings_file_no,
//                 proceedings_date: result4[0].proceedings_date,
//                 upload_proceedings_path: result4[0].upload_proceedings_path,
//                 attachments: result4.filter(row => row.attachment_id !== null).map(row => ({id: row.attachment_id, path: row.file_path}))};
//             }

//             const query5 = `SELECT *,  DATE_FORMAT(Judgement_Date, '%Y-%m-%d') as Judgement_Date FROM case_details WHERE fir_id = ?`;

//             db.query(query5, [fir_id], async (err, result5) => {
//               if (err) {
//                 console.error(err);
//                 return res.status(500).json({ message: 'Error fetching case details.' });
//               }

//               const query6 = `SELECT * FROM fir_trial WHERE fir_id = ?`;
//               db.query(query6, [fir_id], async (err, result6) => {
//                 if (err) {
//                   console.error(err);
//                   return res.status(500).json({ message: 'Error fetching FIR trial.' });
//                 }

//                 const hearingDetailsOne = await queryAsync('SELECT * FROM hearing_details_one WHERE fir_id = ?', [fir_id]);
//                 const hearingDetailsTwo = await queryAsync('SELECT * FROM hearing_details_two WHERE fir_id = ?', [fir_id]);
//                 const hearingDetailsThree = await queryAsync('SELECT * FROM hearing_details_three WHERE fir_id = ?', [fir_id]);

//                 // Appeal details (all 3)
//                 const appealDetails = await queryAsync('SELECT * FROM appeal_details WHERE fir_id = ?', [fir_id]);
//                 const appealDetailsOne = await queryAsync('SELECT * FROM appeal_details_one WHERE fir_id = ?', [fir_id]);
//                 const caseAppealDetailsTwo = await queryAsync('SELECT * FROM case_appeal_details_two WHERE fir_id = ?', [fir_id]);

//                 const compensation_details = await queryAsync(`SELECT * FROM compensation_details WHERE fir_id = ?`, [fir_id]);
//                 const compensation_details_1 = await queryAsync(`SELECT * FROM compensation_details_1 WHERE fir_id = ?`, [fir_id]);
//                 const compensation_details_2 = await queryAsync(`SELECT * FROM compensation_details_2 WHERE fir_id = ?`, [fir_id]);
                                           
//                 // casedetail_one
//                 const casedetail_one = await queryAsync('SELECT *,  DATE_FORMAT(Judgement_Date, "%Y-%m-%d") as Judgement_Date FROM case_court_detail_one WHERE fir_id = ?', [fir_id]);
//                 const casedetail_two = await queryAsync('SELECT *,  DATE_FORMAT(Judgement_Date, "%Y-%m-%d") as Judgement_Date FROM case_court_details_two WHERE fir_id = ?', [fir_id]);

//                 const trialAttachments = await queryAsync('SELECT file_name FROM case_attachments WHERE fir_id = ?', [fir_id]);

//                 // console.log(casedetail_two);

//                 const queryAttachments = `SELECT file_path FROM attachment_relief WHERE fir_id = ?`;
//                 db.query(queryAttachments, [fir_id], (err, attachmentResults) => {
//                   if (err) {
//                     console.error(err);
//                     return res.status(500).json({ message: 'Error fetching attachment file paths.' });
//                   }
//                   const filePaths = attachmentResults.map(row => row.file_path).filter(path => path !== null);
      
                  
//                   if (result3 && result3.length > 0) 
//                     result3[0].file_paths = filePaths;
//                   else 
//                     console.error("result3 is undefined or empty");
                  
//                   return res.status(200).json({
//                     data: result[0],
//                     data1: result1,
//                     data2: result2,
//                     data3: result3[0] ,
//                     data4: chargesheetData, // Includes attachments array
//                     data5: result5,
//                     casedetail_one:casedetail_one,
//                     casedetail_two:casedetail_two,
//                     data6: result6[0],
//                     hearingDetails: hearingDetailsOne,
//                     hearingDetails_one: hearingDetailsTwo,
//                     hearingDetails_two: hearingDetailsThree,
//                     appeal_details: appealDetails,
//                     appeal_details_one: appealDetailsOne,
//                     case_appeal_details_two: caseAppealDetailsTwo,
//                     compensation_details:compensation_details,
//                     compensation_details_1:compensation_details_1,
//                     compensation_details_2:compensation_details_2,
//                     trialAttachments:trialAttachments,
              
//                   });
//                 });
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// };



// enhancement approch
exports.getFirDetails = async (req, res) => {
  const { fir_id } = req.query;
  if (!fir_id) return res.status(400).json({ message: 'FIR ID is required.' });

  try {
    const firQuery = `
      SELECT *, 
        DATE_FORMAT(date_of_occurrence, '%Y-%m-%d') AS date_of_occurrence,
        DATE_FORMAT(date_of_occurrence_to, '%Y-%m-%d') AS date_of_occurrence_to,
        DATE_FORMAT(date_of_registration, '%Y-%m-%d') AS date_of_registration 
      FROM fir_add WHERE fir_id = ?`;

    const [
      firData,
      victims,
      accuseds,
      reliefs,
      chargesheets,
      caseDetails,
      firTrial,
      hearingOne,
      hearingTwo,
      hearingThree,
      appeal1,
      appeal2,
      appeal3,
      compensation1,
      compensation2,
      compensation3,
      caseCourt1,
      caseCourt2,
      trialAttachments,
      reliefAttachments
    ] = await Promise.all([
      queryAsyncenhanced(firQuery, [fir_id]),
      queryAsyncenhanced('SELECT victim_id, fir_id, victim_name, victim_age, victim_gender, mobile_number, address, victim_pincode, community, caste, guardian_name, is_native_district_same, native_district, offence_committed, sectionsIPC_JSON, scst_sections, relief_applicable FROM victims WHERE fir_id = ? AND delete_status = 0', [fir_id]),
      queryAsyncenhanced('SELECT accused_id, fir_id, age, name, gender, custom_gender, address, pincode, community, caste, guardian_name, previous_incident, previous_fir_number, previous_fir_number_suffix, scst_offence, scst_fir_number, scst_fir_number_suffix, antecedentsOption, antecedents, landOIssueOption, land_o_issues, gist_of_current_case, upload_fir_copy, previous_incident_remarks, previous_offence_remarks FROM accuseds WHERE fir_id = ? AND delete_status = 0', [fir_id]),
      queryAsyncenhanced(`SELECT id, proceedings_id, fir_id, total_compensation, proceedings_file_no, proceedings_date, proceedings_file FROM proceedings_victim_relief WHERE fir_id = ?`, [fir_id]),
      queryAsyncenhanced(`SELECT cd.*, ca.id AS attachment_id, ca.file_path FROM chargesheet_details cd LEFT JOIN chargesheet_attachments ca ON cd.fir_id = ca.fir_id WHERE cd.fir_id = ?`, [fir_id]),
      queryAsyncenhanced(`SELECT *, DATE_FORMAT(Judgement_Date, '%Y-%m-%d') as Judgement_Date FROM case_details WHERE fir_id = ?`, [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, total_amount_third_stage, proceedings_file_no, proceedings_date, Commissionerate_file, status FROM fir_trial WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, next_hearing_date, reason_next_hearing, judgement_awarded FROM hearing_details_one WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, next_hearing_date, reason_next_hearing, judgement_awarded FROM hearing_details_two WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, next_hearing_date, reason_next_hearing, judgement_awarded FROM hearing_details_three WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT * FROM appeal_details WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, legal_opinion_obtained, case_fit_for_appeal, government_approval_for_appeal, filed_by, designated_court, judgementNature FROM appeal_details_one WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, legal_opinion_obtained, case_fit_for_appeal, government_approval_for_appeal, filed_by, designated_court, judgementNature FROM case_appeal_details_two WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings FROM compensation_details WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings FROM compensation_details_1 WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT id, fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings FROM compensation_details_2 WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced(`SELECT *, DATE_FORMAT(Judgement_Date, "%Y-%m-%d") as Judgement_Date FROM case_court_detail_one WHERE fir_id = ?`, [fir_id]),
      queryAsyncenhanced(`SELECT *, DATE_FORMAT(Judgement_Date, "%Y-%m-%d") as Judgement_Date FROM case_court_details_two WHERE fir_id = ?`, [fir_id]),
      queryAsyncenhanced('SELECT file_name FROM case_attachments WHERE fir_id = ?', [fir_id]),
      queryAsyncenhanced('SELECT file_path FROM attachment_relief WHERE fir_id = ?', [fir_id])
    ]);

    const chargesheetData = chargesheets.length > 0 ? {
      ...chargesheets[0],
      attachments: chargesheets.filter(c => c.attachment_id).map(c => ({
        id: c.attachment_id,
        path: c.file_path
      }))
    } : null;

    const reliefData = reliefs[0] || {};
    reliefData.file_paths = reliefAttachments.map(a => a.file_path).filter(Boolean);

    return res.status(200).json({
      data: firData[0],
      data1: victims,
      data2: accuseds,
      data3: reliefData,
      data4: chargesheetData,
      data5: caseDetails,
      casedetail_one: caseCourt1,
      casedetail_two: caseCourt2,
      data6: firTrial[0],
      hearingDetails: hearingOne,
      hearingDetails_one: hearingTwo,
      hearingDetails_two: hearingThree,
      appeal_details: appeal1,
      appeal_details_one: appeal2,
      case_appeal_details_two: appeal3,
      compensation_details: compensation1,
      compensation_details_1: compensation2,
      compensation_details_2: compensation3,
      trialAttachments
    });

  } catch (err) {
    console.error('Error fetching FIR data:', err);
    return res.status(500).json({ message: 'Error fetching FIR details' });
  }
};




exports.getFirStatus = (req, res) => {
  const { firId } = req.params;

  const query = `SELECT status FROM fir_add WHERE fir_id = ?`;
  db.query(query, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching FIR status' });
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
      return res.status(500).json({ message: 'Failed to update FIR status' });
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
//       if (err) return res.status(500).json({ message: "Transaction error" });

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
//           if (err) return db.rollback(() => res.status(500).json({ message: "Error saving case details." }));

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
//               if (err) return db.rollback(() => res.status(500).json({ message: "Error saving fir_trial details." }));

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
//                   if (err) return db.rollback(() => res.status(500).json({ message: "Error updating fir_add." }));

//                   // Execute Victim Promises
//                   Promise.all(victimPromises)
//                       .then(() => {
//                           db.commit((err) => {
//                               if (err) return db.rollback(() => res.status(500).json({ message: "Transaction commit failed." }));
//                               res.status(200).json({ message: "Draft data saved successfully.", caseId });
//                           });
//                       })
//                       .catch((err) => {
//                           db.rollback(() => res.status(500).json({ message: "Error saving victim details." }));
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


// commanded for reference
// exports.saveStepSevenAsDraft = (req, res) => {

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
//   const parsedCompensationDetails = parseJSON(compensationDetails);
//   const parsedCompensationDetails_1 = parseJSON(compensationDetails_1);
//   const parsedCompensationDetails_2 = parseJSON(compensationDetails_2);
//   const parsedAppealDetails = parseJSON(appealDetails);
//   const parsedAppealDetailsOne = parseJSON(appealDetailsOne);
//   const parsedCaseAppealDetailsTwo = parseJSON(caseAppealDetailsTwo);

//         const randomCaseId_1 = generateRandomId(10);
//         console.log(randomCaseId_1)
//   if (!ogId) {
//     return res.status(400).json({ message: 'Missing required firId field.' });
//   }

//   db.beginTransaction(async (err) => {
//     if (err) {
//       console.error('Transaction error:', err);
//       return res.status(500).json({ message: 'Transaction error' });
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
//             judgementAwarded1 = ?
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
//           ogId,
//         ]);
//       } else {
//         await queryAsync(`
//           INSERT INTO case_details (fir_id, case_id, court_name, court_district, trial_case_number, public_prosecutor, prosecutor_phone, first_hearing_date, judgement_awarded, CaseHandledBy, NameOfAdvocate, advocateMobNumber, judgementAwarded1)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
//       judgementNature = ?
  
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
  
//     ogId
//   ]);
// } else {
//   await queryAsync(`
//     INSERT INTO case_court_detail_one (
//       fir_id, case_id, court_name, court_district, case_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? , ?)
//   `, [
//     ogId,
//     randomCaseId_1,
//     parsedTrialDetailsOne.courtName,
//     parsedTrialDetailsOne.courtDistrict,
//     parsedTrialDetailsOne.trialCaseNumber,
//     parsedTrialDetailsOne.publicProsecutor,
//     parsedTrialDetailsOne.prosecutorPhone,
//     parsedTrialDetailsOne.firstHearingDate ? parsedTrialDetailsOne.firstHearingDate : null,
//     parsedTrialDetailsOne.judgementAwarded ? parsedTrialDetailsOne.judgementAwarded : 'no',
//     parsedTrialDetailsOne.judgementNature,

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
//       judgementNature = ?

//     WHERE fir_id = ?
//   `, [
//     ogId,
//     parsedTrialDetailsTwo.courtName,
//     parsedTrialDetailsTwo.courtDistrict,
//     parsedTrialDetailsTwo.trialCaseNumber,
//     parsedTrialDetailsTwo.publicProsecutor,
//     parsedTrialDetailsTwo.prosecutorPhone,
//     parsedTrialDetailsTwo.firstHearingDate ? parsedTrialDetailsTwo.firstHearingDate : null,
//     parsedTrialDetailsTwo.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
//     parsedTrialDetailsTwo.judgementNature,

//     ogId
//   ]);
// } else {
//   await queryAsync(`
//     INSERT INTO case_court_details_two (
//       fir_id, court_name, case_id, court_district, case_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `, [
//     ogId,
//     parsedTrialDetailsTwo.courtName,
//     randomCaseId_1,
//     parsedTrialDetailsTwo.courtDistrict,
//     parsedTrialDetailsTwo.trialCaseNumber,
//     parsedTrialDetailsTwo.publicProsecutor,
//     parsedTrialDetailsTwo.prosecutorPhone,
//     parsedTrialDetailsTwo.firstHearingDate ? parsedTrialDetailsTwo.firstHearingDate : null,
//     parsedTrialDetailsTwo.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
//     parsedTrialDetailsTwo.judgementNature,

//   ]);
// }


//       // await queryAsync(`
//       //   UPDATE fir_add SET
//       //     nature_of_judgement = COALESCE(?, nature_of_judgement),
//       //     judgement_copy = COALESCE(?, judgement_copy)
//       //   WHERE fir_id = ?
//       // `, [parsedTrialDetails.judgementNature, parsedTrialDetails.uploadJudgement, ogId]);

//       await queryAsync(`
//         INSERT INTO fir_trial (fir_id, case_id,  total_amount_third_stage, proceedings_file_no, proceedings_date, Commissionerate_file)
//         VALUES (?, ?, ?, ?, ?, ?)
//         ON DUPLICATE KEY UPDATE
//           total_amount_third_stage = VALUES(total_amount_third_stage),
//           proceedings_file_no = VALUES(proceedings_file_no),
//           proceedings_date = VALUES(proceedings_date),
//           Commissionerate_file = VALUES(Commissionerate_file)
//       `, [
//         ogId,
//         randomCaseId_1,
//         parsedCompensationDetails.totalCompensation,
//         parsedCompensationDetails.proceedingsFileNo,
//         parsedCompensationDetails.proceedingsDate,
//         parsedCompensationDetails.uploadProceedings,
//       ]);

//       await queryAsync(`
//         INSERT INTO compensation_details
//             (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
//         VALUES (?, ?, ?, ?, ?, ?)
//         ON DUPLICATE KEY UPDATE
//             total_compensation = VALUES(total_compensation),
//             proceedings_file_no = VALUES(proceedings_file_no),
//             proceedings_date = VALUES(proceedings_date),
//             upload_proceedings = VALUES(upload_proceedings)
//     `, [
//         ogId,
//         randomCaseId_1, 
//         parsedCompensationDetails.totalCompensation,
//         parsedCompensationDetails.proceedingsFileNo,
//         parsedCompensationDetails.proceedingsDate,
//         parsedCompensationDetails.uploadProceedings
//     ]);
//       await queryAsync(`
//         INSERT INTO compensation_details_1 
//             (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
//         VALUES (?, ?, ?, ?, ?, ?)
//         ON DUPLICATE KEY UPDATE
//             total_compensation = VALUES(total_compensation),
//             proceedings_file_no = VALUES(proceedings_file_no),
//             proceedings_date = VALUES(proceedings_date),
//             upload_proceedings = VALUES(upload_proceedings)
//     `, [
//         ogId,
//         randomCaseId_1, 
//         parsedCompensationDetails_1.totalCompensation,
//         parsedCompensationDetails_1.proceedingsFileNo,
//         parsedCompensationDetails_1.proceedingsDate,
//         parsedCompensationDetails_1.uploadProceedings
//     ]);

    
//     await queryAsync(`
//       INSERT INTO compensation_details_2 
//           (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
//       VALUES (?, ?, ?, ?, ?, null)
//       ON DUPLICATE KEY UPDATE
//           total_compensation = VALUES(total_compensation),
//           proceedings_file_no = VALUES(proceedings_file_no),
//           proceedings_date = VALUES(proceedings_date),
//           upload_proceedings = VALUES(upload_proceedings)
//   `, [
//       ogId,
//       randomCaseId_1, 
//       parsedCompensationDetails_2.totalCompensation,
//       parsedCompensationDetails_2.proceedingsFileNo,
//       parsedCompensationDetails_2.proceedingsDate,
//       parsedCompensationDetails_2.uploadProceedings ? parsedCompensationDetails_2.uploadProceedings : null 
//   ]);
  
      
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
//               data.legal_opinion_obtained,
//               data.case_fit_for_appeal,
//               data.government_approval_for_appeal,
//               data.filed_by,
//               data.designated_court,
//               data.judgementNature,
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
//           db.rollback(() => res.status(500).json({ message: 'Transaction commit error' }));
//         }
//         res.status(200).json({ message: 'Step 7 updated successfully.' });
//       });
//     } catch (error) {
//       db.rollback(() => res.status(500).json({ message: 'Transaction failed', error }));
//     }
//   });

// }

exports.saveStepSevenAsDraft = (req, res) => {

  // console.log(req.body);

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
  const parsedCompensationDetails_1 = parseJSON(compensationDetails_1);
  const parsedCompensationDetails_2 = parseJSON(compensationDetails_2);
  const parsedAppealDetails = parseJSON(appealDetails);
  const parsedAppealDetailsOne = parseJSON(appealDetailsOne);
  const parsedCaseAppealDetailsTwo = parseJSON(caseAppealDetailsTwo);

        const randomCaseId_1 = generateRandomId(10);
        // console.log(randomCaseId_1)
  if (!ogId) {
    return res.status(400).json({ message: 'Missing required firId field.' });
  }

  db.beginTransaction(async (err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ message: 'Transaction error' });
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
          parsedTrialDetails.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
          parsedTrialDetails.CaseHandledBy,
          parsedTrialDetails.NameOfAdvocate,
          parsedTrialDetails.advocateMobNumber,
          parsedTrialDetails.judgementAwarded1 ? parsedTrialDetails.judgementAwarded1 : 'no',
          ogId,
        ]);
      } else {
        await queryAsync(`
          INSERT INTO case_details (fir_id, case_id, court_name, court_district, trial_case_number, public_prosecutor, prosecutor_phone, first_hearing_date, judgement_awarded, CaseHandledBy, NameOfAdvocate, advocateMobNumber, judgementAwarded1)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ogId,
          randomCaseId_1,
          parsedTrialDetails.courtName,
          parsedTrialDetails.courtDistrict,
          parsedTrialDetails.trialCaseNumber,
          parsedTrialDetails.publicProsecutor,
          parsedTrialDetails.prosecutorPhone,
          parsedTrialDetails.firstHearingDate,
          parsedTrialDetails.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
          parsedTrialDetails.CaseHandledBy,
          parsedTrialDetails.NameOfAdvocate,
          parsedTrialDetails.advocateMobNumber,
          parsedTrialDetails.judgementAwarded1 ? parsedTrialDetails.judgementAwarded1 : 'no',
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
    parsedTrialDetailsOne.firstHearingDate ? parsedTrialDetailsOne.firstHearingDate : null ,
    parsedTrialDetailsOne.judgementAwarded ? parsedTrialDetailsOne.judgementAwarded : 'no',
    parsedTrialDetailsOne.judgementNature,
  
    ogId
  ]);
} else {
  await queryAsync(`
    INSERT INTO case_court_detail_one (
      fir_id, case_id, court_name, court_district, case_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? , ?)
  `, [
    ogId,
    randomCaseId_1,
    parsedTrialDetailsOne.courtName,
    parsedTrialDetailsOne.courtDistrict,
    parsedTrialDetailsOne.trialCaseNumber,
    parsedTrialDetailsOne.publicProsecutor,
    parsedTrialDetailsOne.prosecutorPhone,
    parsedTrialDetailsOne.firstHearingDate ? parsedTrialDetailsOne.firstHearingDate : null,
    parsedTrialDetailsOne.judgementAwarded ? parsedTrialDetailsOne.judgementAwarded : 'no',
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
    parsedTrialDetailsTwo.firstHearingDate ? parsedTrialDetailsTwo.firstHearingDate : null,
    parsedTrialDetailsTwo.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
    parsedTrialDetailsTwo.judgementNature,

    ogId
  ]);
} else {
  await queryAsync(`
    INSERT INTO case_court_details_two (
      fir_id, court_name, case_id, court_district, case_number, public_prosecutor, prosecutor_phone, second_hearing_date, judgement_awarded, judgementNature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    ogId,
    parsedTrialDetailsTwo.courtName,
    randomCaseId_1,
    parsedTrialDetailsTwo.courtDistrict,
    parsedTrialDetailsTwo.trialCaseNumber,
    parsedTrialDetailsTwo.publicProsecutor,
    parsedTrialDetailsTwo.prosecutorPhone,
    parsedTrialDetailsTwo.firstHearingDate ? parsedTrialDetailsTwo.firstHearingDate : null,
    parsedTrialDetailsTwo.judgementAwarded ? parsedTrialDetails.judgementAwarded : 'no',
    parsedTrialDetailsTwo.judgementNature,

  ]);
}


      // await queryAsync(`
      //   UPDATE fir_add SET
      //     nature_of_judgement = COALESCE(?, nature_of_judgement),
      //     judgement_copy = COALESCE(?, judgement_copy)
      //   WHERE fir_id = ?
      // `, [parsedTrialDetails.judgementNature, parsedTrialDetails.uploadJudgement, ogId]);

      await queryAsync(`
        INSERT INTO fir_trial (fir_id, case_id,  total_amount_third_stage, proceedings_file_no, proceedings_date, Commissionerate_file)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_amount_third_stage = VALUES(total_amount_third_stage),
          proceedings_file_no = VALUES(proceedings_file_no),
          proceedings_date = VALUES(proceedings_date),
          Commissionerate_file = VALUES(Commissionerate_file)
      `, [
        ogId,
        randomCaseId_1,
        parsedCompensationDetails.totalCompensation,
        parsedCompensationDetails.proceedingsFileNo,
        parsedCompensationDetails.proceedingsDate,
        parsedCompensationDetails.uploadProceedings,
      ]);

      await queryAsync(`
        INSERT INTO compensation_details
            (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            total_compensation = VALUES(total_compensation),
            proceedings_file_no = VALUES(proceedings_file_no),
            proceedings_date = VALUES(proceedings_date),
            upload_proceedings = VALUES(upload_proceedings)
    `, [
        ogId,
        randomCaseId_1, 
        parsedCompensationDetails.totalCompensation,
        parsedCompensationDetails.proceedingsFileNo,
        parsedCompensationDetails.proceedingsDate,
        parsedCompensationDetails.uploadProceedings
    ]);
      await queryAsync(`
        INSERT INTO compensation_details_1 
            (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            total_compensation = VALUES(total_compensation),
            proceedings_file_no = VALUES(proceedings_file_no),
            proceedings_date = VALUES(proceedings_date),
            upload_proceedings = VALUES(upload_proceedings)
    `, [
        ogId,
        randomCaseId_1, 
        parsedCompensationDetails_1.totalCompensation,
        parsedCompensationDetails_1.proceedingsFileNo,
        parsedCompensationDetails_1.proceedingsDate,
        parsedCompensationDetails_1.uploadProceedings
    ]);

    
    await queryAsync(`
      INSERT INTO compensation_details_2 
          (fir_id, case_id, total_compensation, proceedings_file_no, proceedings_date, upload_proceedings)
      VALUES (?, ?, ?, ?, ?, null)
      ON DUPLICATE KEY UPDATE
          total_compensation = VALUES(total_compensation),
          proceedings_file_no = VALUES(proceedings_file_no),
          proceedings_date = VALUES(proceedings_date),
          upload_proceedings = VALUES(upload_proceedings)
  `, [
      ogId,
      randomCaseId_1, 
      parsedCompensationDetails_2.totalCompensation,
      parsedCompensationDetails_2.proceedingsFileNo,
      parsedCompensationDetails_2.proceedingsDate,
      parsedCompensationDetails_2.uploadProceedings ? parsedCompensationDetails_2.uploadProceedings : null 
  ]);
  
      
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
          db.rollback(() => res.status(500).json({ message: 'Transaction commit error' }));
        }
        res.status(200).json({ message: 'Step 7 updated successfully.' });
      });
    } catch (error) {
      db.rollback(() => res.status(500).json({ message: 'Transaction failed', error }));
    }
  });

}


const queryAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      // if (err) return reject(err);
      if(err) {
        // console.log(err)
        // console.log(query)
        return reject(err)
      }
      resolve(results);
    });
  });
};











// exports.AlterSave = (req, res) => {
//   const { firId, victims } = req.body;

//   // Get a connection from the pool
//   db.getConnection((err, connection) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to get database connection'.message });
//     }
    
//     // Start a transaction on the specific connection
//     connection.beginTransaction(async (transactionErr) => {
//       if (transactionErr) {
//         connection.release(); // Release the connection on error
//         return res.status(500).json({ message: 'Failed to start transaction', error: transactionErr });
//       }

//       try {
        

//         // Process victims sequentially to avoid race conditions
//         const updatedVictims = [];

//         for (const victim of victims) {
//           // If victim_id is provided, we just update that record
//           if (victim.victim_id) {
//             const updateQuery = `
//               UPDATE victims
//               SET
//                 offence_committed = ?,
//                 scst_sections = ?,
//                 sectionsIPC_JSON = ?,
//                 relief_applicable = ?
//               WHERE victim_id = ?`
            
            
//             const updateValues = [
//               JSON.stringify(victim.offenceCommitted || []),
//               JSON.stringify(victim.scstSections || []),
//               JSON.stringify(victim.sectionDetails || []),
//               victim.relief_applicable || 0,
//               victim.victim_id
//             ];

//             // Execute update with Promise
//             await new Promise((resolve, reject) => {
//               connection.query(updateQuery, updateValues, (err, result) => {
//                 if (err) reject(err);
//                 else resolve(result);
//               });
//             });
            
//             updatedVictims.push({
//               ...victim,
//               victim_id: victim.victim_id
//             });
//           } 
//         }

//         // Commit the transaction
//         connection.commit((commitErr) => {
//           if (commitErr) {
//             return connection.rollback(() => {
//               connection.release(); // Release connection on rollback
//               res.status(500).json({ message: 'Failed to commit transaction', error: commitErr });
//             });
//           }
          
//           connection.release(); // Release connection on successful commit
          
//           // Send success response
//           res.status(200).json({
//             message: 'Step 3 data saved successfully',
//             fir_id: firId
//           });
//         });
        
//       } catch (error) {
//         // Roll back transaction on error
//         connection.rollback(() => {
//           connection.release(); // Release connection on rollback
//           console.error('Transaction error:', error);
//           res.status(500).json({ message: 'Failed to process victim data', error: error.message });
//         });
//       }
//     });
//   });
// };








exports.AlterSave = (req, res) => {
  const { firId, victims, user_id } = req.body;

  // Get a connection from the pool
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to get database connection'.message });
    }
    
    // Start a transaction on the specific connection
    connection.beginTransaction(async (transactionErr) => {
      if (transactionErr) {
        connection.release(); // Release the connection on error
        return res.status(500).json({ message: 'Failed to start transaction', error: transactionErr });
      }

      try {
        
        // Insert into case_altered_log (parent table)
        const insertLogQuery = `
          INSERT INTO case_altered_log (
            fir_id, 
            created_by, 
            created_at, 
            section_changes_status, 
            victim_changes_status, 
            accused_changes_status
          ) VALUES (?, ?, NOW(), ?, ?, ?)`;

        const logValues = [
          firId,
          user_id, // Assuming user_id is available
          1, // section_changes_status (assuming changed)
          0, // victim_changes_status
          0, // accused_changes_status (not handling accused in this API)
        ];

        const logResult = await new Promise((resolve, reject) => {
          connection.query(insertLogQuery, logValues, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        const caseAlteredLogId = logResult.insertId;

        // Process victims sequentially to avoid race conditions
        const updatedVictims = [];

        for (const victim of victims) {
          // If victim_id is provided, we update that record
          if (victim.victim_id) {
            // First, get the current values from the victims table (for prev_ fields)
            const getCurrentDataQuery = `
              SELECT 
                offence_committed,
                scst_sections,
                sectionsIPC_JSON,
                relief_applicable
              FROM victims 
              WHERE victim_id = ?`;

            const currentData = await new Promise((resolve, reject) => {
              connection.query(getCurrentDataQuery, [victim.victim_id], (err, result) => {
                if (err) reject(err);
                else resolve(result[0] || {});
              });
            });

            // Insert into victim_altered_child_table (child table)
            const insertChildQuery = `
              INSERT INTO victim_altered_child_table (
                parent_id,
                victim_id,
                fir_id,
                prev_offence_committed,
                prev_sectionsIPC_JSON,
                prev_scst_sections,
                cur_offence_committed,
                cur_sectionsIPC_JSON,
                cur_scst_sections,
                created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

            const childValues = [
              caseAlteredLogId, // parent_id from case_altered_log
              victim.victim_id,
              firId,
              currentData.offence_committed || null, // prev_ values from current DB
              currentData.sectionsIPC_JSON || null,
              currentData.scst_sections || null,
              JSON.stringify(victim.offenceCommitted || []), // cur_ values from request body
              JSON.stringify(victim.sectionDetails || []),
              JSON.stringify(victim.scstSections || [])
            ];

            await new Promise((resolve, reject) => {
              connection.query(insertChildQuery, childValues, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });

            // Now update the victims table with new values
            const updateQuery = `
              UPDATE victims
              SET
                offence_committed = ?,
                scst_sections = ?,
                sectionsIPC_JSON = ?,
                relief_applicable = ?
              WHERE victim_id = ?`;
            
            const updateValues = [
              JSON.stringify(victim.offenceCommitted || []),
              JSON.stringify(victim.scstSections || []),
              JSON.stringify(victim.sectionDetails || []),
              victim.relief_applicable || 0,
              victim.victim_id
            ];

            await new Promise((resolve, reject) => {
              connection.query(updateQuery, updateValues, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
            
            updatedVictims.push({
              ...victim,
              victim_id: victim.victim_id
            });
          } 
        }

        const updateFirQuery = `
          UPDATE fir_add
          SET
            case_altered_status = 1,
            case_altered_date = NOW()
           
          WHERE fir_id = ?;
        `;
        const updateFirValues = [
          firId,
        ];

        // Execute FIR update with Promise
        await new Promise((resolve, reject) => {
          connection.query(updateFirQuery, updateFirValues, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        // Commit the transaction
        connection.commit((commitErr) => {
          if (commitErr) {
            return connection.rollback(() => {
              connection.release(); // Release connection on rollback
              res.status(500).json({ message: 'Failed to commit transaction', error: commitErr });
            });
          }
          
          connection.release(); // Release connection on successful commit
          
          // Send success response
          res.status(200).json({
            message: 'Step 3 data saved successfully with audit log',
            fir_id: firId,
            case_altered_log_id: caseAlteredLogId,
            updated_victims: updatedVictims.length
          });
        });
        
      } catch (error) {
        // Roll back transaction on error
        connection.rollback(() => {
          connection.release(); // Release connection on rollback
          console.error('Transaction error:', error);
          res.status(500).json({ message: 'Failed to process victim data', error: error.message });
        });
      }
    });
  });
};