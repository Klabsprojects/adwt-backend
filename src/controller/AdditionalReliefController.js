const db = require('../db'); // Update with actual DB connection


// Function to generate a random ID
function generateRandomId(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}


exports.getFIRAdditionalReliefList = (req, res) => {
  const query = `
    SELECT 
      f.fir_id,
      COUNT(v.relief_id) AS number_of_victims,
      SUM(v.additional_relief IS NOT NULL) AS victims_with_relief 
    FROM 
      fir_add f
    LEFT JOIN 
      victim_relief v 
    ON 
      f.fir_id = v.fir_id
    GROUP BY 
      f.fir_id;
  `;

  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Something went wrong. Please contact support." });
    }
    res.status(200).json(results);
  });
};


// exports.getFIRAdditionalReliefListByVictim = (req, res) => {
//   const query = `
//     SELECT 
//       f.fir_id,
//       v.victim_id,
//       v.victim_name
//     FROM 
//       fir_add f
//     LEFT JOIN 
//       victim_relief v 
//     ON 
//       f.fir_id = v.fir_id
//     WHERE SUM(v.additional_relief IS NOT NULL) > 0 GROUP BY f.fir_id
//   `;

//   db.query(query, (error, results) => {
//     if (error) {
//       return res.status(500).json({ error: error.message });
//     }
//     res.status(200).json(results);
//   });
// };

// exports.getFIRAdditionalReliefListByVictim = (req, res) => {
//   const query = `
//     SELECT 
//       f.fir_id, 
//       CONCAT(f.fir_number,'/', f.fir_number_suffix) fir_number ,
//       v.victim_id, 
//       v.victim_name 
//     FROM fir_add f
//     LEFT JOIN victim_relief v ON f.fir_id = v.fir_id
//     LEFT JOIN victims vm ON vm.victim_id = v.victim_id
//     WHERE JSON_LENGTH(v.additional_relief) > 0 and vm.delete_status = 0
//     GROUP BY f.fir_id, v.victim_id, v.victim_name
//   `;

//   db.query(query, (error, results) => {
//     if (error) {
//       return res.status(500).json({ error: error.message });
//     }
//     res.status(200).json(results);
//   });
// };



// exports.getFIRAdditionalReliefListByVictim = (req, res) => {

  
//   // Build WHERE clause based on provided filters
//   let whereClause = '  WHERE JSON_LENGTH(v.additional_relief) > 0 and vm.delete_status = 0 ';
//   const params = [];
  
//   // Add filters to where clause
//   if (req.query.search) {
//     const searchValue = `%${req.query.search}%`;
//     const searchValue2 = `${req.query.search}`;
//     whereClause += ` WHERE (f.fir_id LIKE ? OR CONCAT(f.fir_number, '/', f.fir_number_suffix) = ? OR f.revenue_district LIKE ? OR f.police_city LIKE ? OR f.police_station LIKE ?)`;
    
//     params.push(searchValue, searchValue2, searchValue, searchValue, searchValue);
//   }
  
//   if (req.query.district) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'f.police_city = ?';
//     params.push(req.query.district);
//   }

//   if (req.query.policeStationName) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'f.police_station = ?';
//     params.push(req.query.policeStationName);
//   }

//   if (req.query.revenue_district) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'f.revenue_district = ?';
//     params.push(req.query.revenue_district);
//   }

//   if (req.query.status) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     if (req.query.status == 0) {
//       whereClause += 'f.status >= 0 AND f.status <= 5';
//     } else {
//       whereClause += 'f.status = ?';
//       params.push(req.query.status);
//     }
//   }

//           const query = `
//                 SELECT 
//                       f.fir_id, 
//                       CONCAT(f.fir_number,'/', f.fir_number_suffix) fir_number ,
//                       v.victim_id, 
//                       v.victim_name ,
//                       f.revenue_district,
//                       f.police_station,
//                       f.police_city,
//                       f.status
//                     FROM fir_add f
//                     LEFT JOIN victim_relief v ON f.fir_id = v.fir_id
//                     LEFT JOIN victims vm ON vm.victim_id = v.victim_id
//                    ${whereClause}
//                     GROUP BY f.fir_id, v.victim_id, v.victim_name  ORDER BY v.created_at DESC 
//           `;
    
//     const queryParams = [...params];

//     console.log(query)
//     console.log(queryParams)
    
//     db.query(query, queryParams, (err, results) => {
//       if (err) {
//         return res.status(500).json({ 
//           message: 'Failed to retrieve FIR list', 
//           error: err 
//         });
//       }
      
//       // Return paginated data with metadata
//       // res.status(200).json({
//       //   data: results
//       // });
//       res.status(200).json(results);
//     });
// };


exports.getFIRAdditionalReliefListByVictim = (req, res) => {
  // Build WHERE clause based on provided filters
  let whereClause = 'WHERE JSON_LENGTH(v.additional_relief) > 0 AND vm.delete_status = 0';
  const params = [];
  
  // Add filters to where clause
  if (req.query.search) {
    const searchValue = `%${req.query.search}%`;
    const searchValue2 = `${req.query.search}`;
    whereClause += ` AND (f.fir_id LIKE ? OR CONCAT(f.fir_number, '/', f.fir_number_suffix) = ? OR f.revenue_district LIKE ? OR f.police_city LIKE ? OR f.police_station LIKE ?)`;
    
    params.push(searchValue, searchValue2, searchValue, searchValue, searchValue);
  }
  
  if (req.query.district) {
    whereClause += ' AND f.police_city = ?';
    params.push(req.query.district);
  }

  if (req.query.policeStationName) {
    whereClause += ' AND f.police_station = ?';
    params.push(req.query.policeStationName);
  }

  if (req.query.revenue_district) {
    whereClause += ' AND f.revenue_district = ?';
    params.push(req.query.revenue_district);
  }

  if (req.query.status) {
    if (req.query.status == 0) {
      whereClause += ' AND f.status >= 0 AND f.status <= 5';
    } else {
      whereClause += ' AND f.status = ?';
      params.push(req.query.status);
    }
  }

  const query = `
    SELECT 
      f.fir_id, 
      CONCAT(f.fir_number,'/', f.fir_number_suffix) AS fir_number,
      v.victim_id, 
      v.victim_name,
      f.revenue_district,
      f.police_station,
      f.police_city,
      f.status
    FROM fir_add f
    LEFT JOIN victim_relief v ON f.fir_id = v.fir_id
    LEFT JOIN victims vm ON vm.victim_id = v.victim_id
    ${whereClause}
    GROUP BY f.fir_id, v.victim_id, v.victim_name  
    ORDER BY v.created_at DESC 
  `;

  const queryParams = [...params];

  // console.log(query);
  // console.log(queryParams);
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ 
        message: 'Failed to retrieve FIR list' // Don't expose full error object in production
      });
    }
    
    res.status(200).json(results);
  });
};

exports.getVictimDetailsByFirId = (req, res) => {
  const { fir_id } = req.query;  // Get fir_id from query parameters
  const { victim_id } = req.query;  // Get fir_id from query parameters

  if (!fir_id) {
    return res.status(400).json({ error: 'FIR ID is required' });
  }

  if (!victim_id) {
    return res.status(400).json({ error: 'Victim ID is required' });
  }


  // const query = `
  //   SELECT * FROM victim_relief a
  //   LEFT JOIN victims b ON a.fir_id = b.fir_id COLLATE utf8mb4_unicode_ci
  //   WHERE a.fir_id = ?;
  // `;


  const query = `
  SELECT * FROM victim_relief WHERE fir_id = ? and victim_id = ?;
`;  

  db.query(query, [fir_id,victim_id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Something went wrong. Please contact support." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No victims found for the given FIR ID.' });
    }

    res.status(200).json(results);  // Return all victims associated with fir_id
  });
};



exports.getAdditionalReliefByFirId = (req, res) => {
  const { fir_id } = req.query;  // Get fir_id from query parameters
  const { victim_id } = req.query;  // Get fir_id from query parameters

  if (!fir_id) {
    return res.status(400).json({ error: 'FIR ID is required' });
  }

  const query = ` SELECT * FROM additional_relief af left join additional_relief_details arf on arf.additional_relief_id = af.id WHERE af.fir_id=? and af.victim_id = ? `;

  db.query(query, [fir_id,victim_id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Something went wrong. Please contact support." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No victims found for the given FIR ID.' });
    }

    res.status(200).json(results);  // Return all victims associated with fir_id
  });
};



// exports.saveAdditionalRelief = (req, res) => {
//   const formData = req.body;
//   const numberOfRecords = formData.victimName.length;
//   const insertPromises = [];
//   const relief_id = generateRandomId(6);

//   let promisesLeft = numberOfRecords;
//   const results = [];

//   for (let i = 0; i < numberOfRecords; i++) {
//     const query = `
//       INSERT INTO additional_relief (
//         fir_id, victim_id, victim_name, section, relief_id
//       ) 
//       VALUES (?, ?, ?, ?, ?)
//     `;
    
//     const victimNamevalue = formData.victimName[i] || '';
//     const victimidvalue = formData.victimId[i] || '';
//     const sectionValue = formData.sectionValue[i] || '';

//     const values = [
//       formData.fir_id,
//       victimidvalue,
//       victimNamevalue,
//       sectionValue,
//       relief_id
//     ];

//     db.execute(query, values, (error, result) => {
//       if (error) {
//         console.error('Error inserting data:', error);
//         return res.status(500).json({ message: 'Error inserting data', error });
//       }

//       const insertedId = result.insertId;

//       insertIntoAnotherTable(insertedId, formData, i, (err) => {
//         if (err) {
//           console.error('Error inserting into another table:', err);
//           return res.status(500).json({ message: 'Error inserting into another table', err });
//         }

//         promisesLeft--;

//         if (promisesLeft === 0) {
//           res.status(200).json({ message: 'Data saved successfully!' });
//         }
//       });
//     });
//   }
// };

function insertIntoAnotherTable(additionalReliefId, formData, index, callback) {
  const query = `
    INSERT INTO additional_relief_details (
      additional_relief_id,
      pension_status,
      not_applicable_reason,
      other_reason,
      relationship,
      pension_amount,
      dearness_allowance,
      total_pension_amount,
      file_number,
      proceedings_date,
      upload_proceedings,
      employment_status,
      employment_not_applicable_reason,
      employment_other_reason,
      relationship_to_victim,
      educational_qualification,
      department_name,
      office_name,
      designation,
      office_address,
      office_district,
      appointment_order_date,
      providing_order_date,
      house_site_patta_status,
      house_site_patta_reason,
      house_site_patta_other_reason,
      house_site_patta_relationship,
      house_site_patta_address,
      taluk_name,
      district_name,
      pin_code,
      house_site_patta_issue_date,
      education_concession_status,
      education_concession_reason,
      education_other_reason,
      number_of_children,
      child_details,
      provisions_status,
      provisions_not_applicable_reason,
      provisions_other_reason,
      provisions_relationship,
      provisions_file_number,
      provisions_date_of_document,
      upload_proceedings_document,
      burnt_house_status,
      burnt_house_reason,
      burnt_house_other_reason,
      burnt_house_estimated_amount,
      burnt_house_file_number,
      burnt_house_document_date,
      burnt_house_document_upload
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  // Defensive handling of null or undefined values
  const values = [
    additionalReliefId,
    formData.pensionStatus || null,
    formData.notApplicableReason || null,
    formData.otherReason || null,
    JSON.stringify(formData.relationship || []),
    formData.pensionAmount || null,
    formData.dearnessAllowance || null,
    formData.totalPensionAmount || null,
    formData.fileNumber || null,
    formData.proceedingsDate || null,
    formData.uploadProceedings || null,
    formData.employmentStatus || null,
    formData.notApplicableEmploymentReason || null,
    formData.employmentOtherReason || null,
    formData.relationshipToVictim || null,
    formData.educationalQualification || null,
    formData.departmentName || null,
    formData.officeName || null,
    formData.designation || null,
    formData.officeAddress || null,
    formData.officeDistrict || null,
    formData.appointmentOrderDate || null,
    formData.providingOrderDate || null,
    formData.houseSitePattaStatus || null,
    formData.notApplicableHouseSitePattaReason || null,
    formData.houseSitePattaOtherReason || null,
    formData.houseSitePattaRelationship || null,
    formData.houseSitePattaAddress || null,
    formData.talukName || null,
    formData.districtName || null,
    formData.pinCode || null,
    formData.houseSitePattaIssueDate || null,
    formData.educationConcessionStatus || null,
    formData.educationConcessionReason || null,
    formData.educationOtherReason || null,
    formData.numberOfChildren || null,
    formData.children || null,
    formData.provisionsGivenStatus || null,
    formData.reasonNotApplicable || null,
    formData.othersReason || null,
    formData.beneficiaryRelationship || null,
    formData.provisionsfileNumber || null,
    formData.dateOfProceedings || null,
    formData.uploadFile || null,
    formData.compensationGivenStatus || null,
    formData.compensationnotApplicableReason || null,
    formData.compensationotherReason || null,
    formData.compensationestimatedAmount || null,
    formData.proceedingsFileNumber || null,
    formData.compensationdateOfProceedings || null,
    formData.compensationuploadProceedings || null,
  ];

  // console.log('SQL Query: ', query);
  // console.log('Values: ', values);

  // For debugging, we can replace the placeholders with actual values in the query
  let finalQuery = query;
  values.forEach((value, idx) => {
    const placeholder = `?`;
    finalQuery = finalQuery.replace(placeholder, value !== null ? `'${value}'` : 'NULL');
  });

  // console.log('Final SQL Query with values: ', finalQuery);

  // Execute the query
  db.execute(finalQuery, callback);
}


exports.saveAdditionalRelief = (req, res) => {
  const formData = req.body;
  const numberOfRecords = formData.victimName.length;
  const relief_id = generateRandomId(6);
  let promisesLeft = numberOfRecords;

  for (let i = 0; i < numberOfRecords; i++) {
    const checkQuery = `
      SELECT id FROM additional_relief 
      WHERE fir_id = ? AND victim_id = ?
    `;

    const victimNamevalue = formData.victimName[i] || '';
    const victimidvalue = formData.victimId[i] || '';
    const sectionValue = formData.sectionValue[i] || '';

    // First check if record exists
    db.execute(checkQuery, [formData.fir_id, victimidvalue], (checkError, checkResult) => {
      if (checkError) {
        console.error('Error checking existing record:', checkError);
        return res.status(500).json({ message: 'Error checking existing record' });
      }

      // If record exists, update it
      if (checkResult.length > 0) {
        const updateQuery = `
          UPDATE additional_relief 
          SET victim_name = ?,
              section = ?,
              relief_id = ?
          WHERE fir_id = ? AND victim_id = ?
        `;

        const updateValues = [
          victimNamevalue,
          sectionValue,
          relief_id,
          formData.fir_id,
          victimidvalue
        ];

        db.execute(updateQuery, updateValues, (error, result) => {
          if (error) {
            console.error('Error updating data:', error);
            return res.status(500).json({ message: 'Error updating data' });
          }

          // After update, handle the details table
          handleDetailsTable(checkResult[0].id, formData, i, res, (err) => {
            if (err) {
              console.error('Error handling details table:', err);
              return res.status(500).json({ message: 'Error handling details table' });
            }

            promisesLeft--;
            if (promisesLeft === 0) {
              res.status(200).json({ message: 'Data saved successfully!' });
            }
          });
        });
      } else {
        // If record doesn't exist, insert new one
        const insertQuery = `
          INSERT INTO additional_relief (
            fir_id, victim_id, victim_name, section, relief_id
          ) 
          VALUES (?, ?, ?, ?, ?)
        `;

        const insertValues = [
          formData.fir_id,
          victimidvalue,
          victimNamevalue,
          sectionValue,
          relief_id
        ];

        db.execute(insertQuery, insertValues, (error, result) => {
          if (error) {
            console.error('Error inserting data:', error);
            return res.status(500).json({ message: 'Error inserting data' });
          }

          // After insert, handle the details table
          handleDetailsTable(result.insertId, formData, i, res, (err) => {
            if (err) {
              console.error('Error handling details table:', err);
              return res.status(500).json({ message: 'Error handling details table' });
            }

            promisesLeft--;
            if (promisesLeft === 0) {
              res.status(200).json({ message: 'Data saved successfully!' });
            }
          });
        });
      }
    });
  }
};

// function handleDetailsTable(additionalReliefId, formData, index, callback) {
//   // First check if details record exists
//   const checkQuery = `
//     SELECT id FROM additional_relief_details 
//     WHERE additional_relief_id = ?
//   `;

//   db.execute(checkQuery, [additionalReliefId], (checkError, checkResult) => {
//     if (checkError) {
//       return callback(checkError);
//     }

//     const values = [
//       additionalReliefId,
//       formData.pensionStatus || null,
//       formData.notApplicableReason || null,
//       formData.otherReason || null,
//       JSON.stringify(formData.relationship || []),
//       formData.pensionAmount || null,
//       formData.dearnessAllowance || null,
//       formData.totalPensionAmount || null,
//       formData.fileNumber || null,
//       formData.proceedingsDate || null,
//       formData.uploadProceedings || null,
//       formData.employmentStatus || null,
//       formData.notApplicableEmploymentReason || null,
//       formData.employmentOtherReason || null,
//       formData.relationshipToVictim || null,
//       formData.educationalQualification || null,
//       formData.departmentName || null,
//       formData.officeName || null,
//       formData.designation || null,
//       formData.officeAddress || null,
//       formData.officeDistrict || null,
//       formData.appointmentOrderDate || null,
//       formData.providingOrderDate || null,
//       formData.houseSitePattaStatus || null,
//       formData.notApplicableHouseSitePattaReason || null,
//       formData.houseSitePattaOtherReason || null,
//       formData.houseSitePattaRelationship || null,
//       formData.houseSitePattaAddress || null,
//       formData.talukName || null,
//       formData.districtName || null,
//       formData.pinCode || null,
//       formData.houseSitePattaIssueDate || null,
//       formData.educationConcessionStatus || null,
//       formData.educationConcessionReason || null,
//       formData.educationOtherReason || null,
//       formData.numberOfChildren || null,
//       formData.children || null,
//       formData.provisionsGivenStatus || null,
//       formData.reasonNotApplicable || null,
//       formData.othersReason || null,
//       formData.beneficiaryRelationship || null,
//       formData.provisionsfileNumber || null,
//       formData.dateOfProceedings || null,
//       formData.uploadFile || null,
//       formData.compensationGivenStatus || null,
//       formData.compensationnotApplicableReason || null,
//       formData.compensationotherReason || null,
//       formData.compensationestimatedAmount || null,
//       formData.proceedingsFileNumber || null,
//       formData.compensationdateOfProceedings || null,
//       formData.compensationuploadProceedings || null,
//     ];

//     if (checkResult.length > 0) {
//       // Update existing details record
//       const updateQuery = `
//         UPDATE additional_relief_details 
//         SET pension_status = ?,
//             not_applicable_reason = ?,
//             other_reason = ?,
//             relationship = ?,
//             pension_amount = ?,
//             dearness_allowance = ?,
//             total_pension_amount = ?,
//             file_number = ?,
//             proceedings_date = ?,
//             upload_proceedings = ?,
//             employment_status = ?,
//             employment_not_applicable_reason = ?,
//             employment_other_reason = ?,
//             relationship_to_victim = ?,
//             educational_qualification = ?,
//             department_name = ?,
//             office_name = ?,
//             designation = ?,
//             office_address = ?,
//             office_district = ?,
//             appointment_order_date = ?,
//             providing_order_date = ?,
//             house_site_patta_status = ?,
//             house_site_patta_reason = ?,
//             house_site_patta_other_reason = ?,
//             house_site_patta_relationship = ?,
//             house_site_patta_address = ?,
//             taluk_name = ?,
//             district_name = ?,
//             pin_code = ?,
//             house_site_patta_issue_date = ?,
//             education_concession_status = ?,
//             education_concession_reason = ?,
//             education_other_reason = ?,
//             number_of_children = ?,
//             child_details = ?,
//             provisions_status = ?,
//             provisions_not_applicable_reason = ?,
//             provisions_other_reason = ?,
//             provisions_relationship = ?,
//             provisions_file_number = ?,
//             provisions_date_of_document = ?,
//             upload_proceedings_document = ?,
//             burnt_house_status = ?,
//             burnt_house_reason = ?,
//             burnt_house_other_reason = ?,
//             burnt_house_estimated_amount = ?,
//             burnt_house_file_number = ?,
//             burnt_house_document_date = ?,
//             burnt_house_document_upload = ?
//         WHERE additional_relief_id = ?
//       `;
      
//       // Add the additional_relief_id to the end for WHERE clause
//       const updateValues = [...values, additionalReliefId];
//       db.execute(updateQuery, updateValues, callback);
//     } else {
//       // Insert new details record
//       const insertQuery = `
//         INSERT INTO additional_relief_details (
//           additional_relief_id,
//           pension_status,
//           not_applicable_reason,
//           other_reason,
//           relationship,
//           pension_amount,
//           dearness_allowance,
//           total_pension_amount,
//           file_number,
//           proceedings_date,
//           upload_proceedings,
//           employment_status,
//           employment_not_applicable_reason,
//           employment_other_reason,
//           relationship_to_victim,
//           educational_qualification,
//           department_name,
//           office_name,
//           designation,
//           office_address,
//           office_district,
//           appointment_order_date,
//           providing_order_date,
//           house_site_patta_status,
//           house_site_patta_reason,
//           house_site_patta_other_reason,
//           house_site_patta_relationship,
//           house_site_patta_address,
//           taluk_name,
//           district_name,
//           pin_code,
//           house_site_patta_issue_date,
//           education_concession_status,
//           education_concession_reason,
//           education_other_reason,
//           number_of_children,
//           child_details,
//           provisions_status,
//           provisions_not_applicable_reason,
//           provisions_other_reason,
//           provisions_relationship,
//           provisions_file_number,
//           provisions_date_of_document,
//           upload_proceedings_document,
//           burnt_house_status,
//           burnt_house_reason,
//           burnt_house_other_reason,
//           burnt_house_estimated_amount,
//           burnt_house_file_number,
//           burnt_house_document_date,
//           burnt_house_document_upload
//         )
//         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
//       `;
      
//       db.execute(insertQuery, values, callback);
//     }
//   });
// }


function handleDetailsTable(additionalReliefId, formData, index, res, callback) {
  // First check if details record exists
  const checkQuery = `
    SELECT id FROM additional_relief_details 
    WHERE additional_relief_id = ?
  `;

  db.execute(checkQuery, [additionalReliefId], (checkError, checkResult) => {
    if (checkError) {
      return callback(checkError);
    }

    const values = [
      additionalReliefId,
      formData.pensionStatus || null,
      formData.notApplicableReason || null,
      formData.otherReason || null,
      JSON.stringify(formData.relationship || []),
      formData.pensionAmount || null,
      formData.dearnessAllowance || null,
      formData.totalPensionAmount || null,
      formData.fileNumber || null,
      formData.proceedingsDate || null,
      formData.uploadProceedings || null,
      formData.employmentStatus || null,
      formData.notApplicableEmploymentReason || null,
      formData.employmentOtherReason || null,
      formData.relationshipToVictim || null,
      formData.educationalQualification || null,
      formData.departmentName || null,
      formData.officeName || null,
      formData.designation || null,
      formData.officeAddress || null,
      formData.officeDistrict || null,
      formData.appointmentOrderDate || null,
      formData.providingOrderDate || null,
      formData.houseSitePattaStatus || null,
      formData.notApplicableHouseSitePattaReason || null,
      formData.houseSitePattaOtherReason || null,
      formData.houseSitePattaRelationship || null,
      formData.houseSitePattaAddress || null,
      formData.talukName || null,
      formData.districtName || null,
      formData.pinCode || null,
      formData.houseSitePattaIssueDate || null,
      formData.educationConcessionStatus || null,
      formData.educationConcessionReason || null,
      formData.educationOtherReason || null,
      formData.numberOfChildren || null,
      formData.children || null,
      formData.provisionsGivenStatus || null,
      formData.reasonNotApplicable || null,
      formData.othersReason || null,
      formData.beneficiaryRelationship || null,
      formData.provisionsfileNumber || null,
      formData.dateOfProceedings || null,
      formData.uploadFile || null,
      formData.compensationGivenStatus || null,
      formData.compensationnotApplicableReason || null,
      formData.compensationotherReason || null,
      formData.compensationestimatedAmount || null,
      formData.proceedingsFileNumber || null,
      formData.compensationdateOfProceedings || null,
      formData.compensationuploadProceedings || null
    ];

    if (checkResult.length > 0) {
      // Update existing details record
      let updateQuery = `
        UPDATE additional_relief_details 
        SET pension_status = ${values[1] !== null ? `'${values[1]}'` : 'NULL'},
            not_applicable_reason = ${values[2] !== null ? `'${values[2]}'` : 'NULL'},
            other_reason = ${values[3] !== null ? `'${values[3]}'` : 'NULL'},
            relationship = ${values[4] !== null ? `'${values[4]}'` : 'NULL'},
            pension_amount = ${values[5] !== null ? `'${values[5]}'` : 'NULL'},
            dearness_allowance = ${values[6] !== null ? `'${values[6]}'` : 'NULL'},
            total_pension_amount = ${values[7] !== null ? `'${values[7]}'` : 'NULL'},
            file_number = ${values[8] !== null ? `'${values[8]}'` : 'NULL'},
            proceedings_date = ${values[9] !== null ? `'${values[9]}'` : 'NULL'},
            upload_proceedings = ${values[10] !== null ? `'${values[10]}'` : 'NULL'},
            employment_status = ${values[11] !== null ? `'${values[11]}'` : 'NULL'},
            employment_not_applicable_reason = ${values[12] !== null ? `'${values[12]}'` : 'NULL'},
            employment_other_reason = ${values[13] !== null ? `'${values[13]}'` : 'NULL'},
            relationship_to_victim = ${values[14] !== null ? `'${values[14]}'` : 'NULL'},
            educational_qualification = ${values[15] !== null ? `'${values[15]}'` : 'NULL'},
            department_name = ${values[16] !== null ? `'${values[16]}'` : 'NULL'},
            office_name = ${values[17] !== null ? `'${values[17]}'` : 'NULL'},
            designation = ${values[18] !== null ? `'${values[18]}'` : 'NULL'},
            office_address = ${values[19] !== null ? `'${values[19]}'` : 'NULL'},
            office_district = ${values[20] !== null ? `'${values[20]}'` : 'NULL'},
            appointment_order_date = ${values[21] !== null ? `'${values[21]}'` : 'NULL'},
            providing_order_date = ${values[22] !== null ? `'${values[22]}'` : 'NULL'},
            house_site_patta_status = ${values[23] !== null ? `'${values[23]}'` : 'NULL'},
            house_site_patta_reason = ${values[24] !== null ? `'${values[24]}'` : 'NULL'},
            house_site_patta_other_reason = ${values[25] !== null ? `'${values[25]}'` : 'NULL'},
            house_site_patta_relationship = ${values[26] !== null ? `'${values[26]}'` : 'NULL'},
            house_site_patta_address = ${values[27] !== null ? `'${values[27]}'` : 'NULL'},
            taluk_name = ${values[28] !== null ? `'${values[28]}'` : 'NULL'},
            district_name = ${values[29] !== null ? `'${values[29]}'` : 'NULL'},
            pin_code = ${values[30] !== null ? `'${values[30]}'` : 'NULL'},
            house_site_patta_issue_date = ${values[31] !== null ? `'${values[31]}'` : 'NULL'},
            education_concession_status = ${values[32] !== null ? `'${values[32]}'` : 'NULL'},
            education_concession_reason = ${values[33] !== null ? `'${values[33]}'` : 'NULL'},
            education_other_reason = ${values[34] !== null ? `'${values[34]}'` : 'NULL'},
            number_of_children = ${values[35] !== null ? `'${values[35]}'` : 'NULL'},
            child_details = ${values[36] !== null ? `'${values[36]}'` : 'NULL'},
            provisions_status = ${values[37] !== null ? `'${values[37]}'` : 'NULL'},
            provisions_not_applicable_reason = ${values[38] !== null ? `'${values[38]}'` : 'NULL'},
            provisions_other_reason = ${values[39] !== null ? `'${values[39]}'` : 'NULL'},
            provisions_relationship = ${values[40] !== null ? `'${values[40]}'` : 'NULL'},
            provisions_file_number = ${values[41] !== null ? `'${values[41]}'` : 'NULL'},
            provisions_date_of_document = ${values[42] !== null ? `'${values[42]}'` : 'NULL'},
            upload_proceedings_document = ${values[43] !== null ? `'${values[43]}'` : 'NULL'},
            burnt_house_status = ${values[44] !== null ? `'${values[44]}'` : 'NULL'},
            burnt_house_reason = ${values[45] !== null ? `'${values[45]}'` : 'NULL'},
            burnt_house_other_reason = ${values[46] !== null ? `'${values[46]}'` : 'NULL'},
            burnt_house_estimated_amount = ${values[47] !== null ? `'${values[47]}'` : 'NULL'},
            burnt_house_file_number = ${values[48] !== null ? `'${values[48]}'` : 'NULL'},
            burnt_house_document_date = ${values[49] !== null ? `'${values[49]}'` : 'NULL'},
            burnt_house_document_upload = ${values[50] !== null ? `'${values[50]}'` : 'NULL'}
        WHERE additional_relief_id = ${values[0]}
      `;

      db.execute(updateQuery, (error) => {
        if (error) {
          console.error('Error executing update query:', error);
        }
        callback(error);
      });
    } else {
      // Insert new details record
      // const insertQuery = `
      //   INSERT INTO additional_relief_details (
      //     additional_relief_id,
      //     pension_status,
      //     not_applicable_reason,
      //     other_reason,
      //     relationship,
      //     pension_amount,
      //     dearness_allowance,
      //     total_pension_amount,
      //     file_number,
      //     proceedings_date,
      //     upload_proceedings,
      //     employment_status,
      //     employment_not_applicable_reason,
      //     employment_other_reason,
      //     relationship_to_victim,
      //     educational_qualification,
      //     department_name,
      //     office_name,
      //     designation,
      //     office_address,
      //     office_district,
      //     appointment_order_date,
      //     providing_order_date,
      //     house_site_patta_status,
      //     house_site_patta_reason,
      //     house_site_patta_other_reason,
      //     house_site_patta_relationship,
      //     house_site_patta_address,
      //     taluk_name,
      //     district_name,
      //     pin_code,
      //     house_site_patta_issue_date,
      //     education_concession_status,
      //     education_concession_reason,
      //     education_other_reason,
      //     number_of_children,
      //     child_details,
      //     provisions_status,
      //     provisions_not_applicable_reason,
      //     provisions_other_reason,
      //     provisions_relationship,
      //     provisions_file_number,
      //     provisions_date_of_document,
      //     upload_proceedings_document,
      //     burnt_house_status,
      //     burnt_house_reason,
      //     burnt_house_other_reason,
      //     burnt_house_estimated_amount,
      //     burnt_house_file_number,
      //     burnt_house_document_date,
      //     burnt_house_document_upload
      //   )
      //   VALUES (
      //     ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      //   )
      // `;

      // db.execute(insertQuery, (error) => {
      //   if (error) {
      //     console.error('Error executing insert query:', error);
      //   }
      //   callback(error);
      // });

      // additionalReliefId, formData, index, callback

      insertIntoAnotherTable(additionalReliefId, formData, index, (err) => {
        if (err) {
          console.error('Error inserting into another table:', err);
          return res.status(500).json({ error: 'Internal Server Error' })
        }
        return res.status(200).json({ message: 'Data saved successfully!' });
      });
    }
  });
}

