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
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json(results);
  });
};




exports.getVictimDetailsByFirId = (req, res) => {
  const { fir_id } = req.query;  // Get fir_id from query parameters

  if (!fir_id) {
    return res.status(400).json({ error: 'FIR ID is required' });
  }

  // const query = `
  //   SELECT * FROM victim_relief a
  //   LEFT JOIN victims b ON a.fir_id = b.fir_id COLLATE utf8mb4_unicode_ci
  //   WHERE a.fir_id = ?;
  // `;


  const query = `
  SELECT * FROM victim_relief WHERE fir_id=?;
`;


  

  db.query(query, [fir_id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No victims found for the given FIR ID.' });
    }

    res.status(200).json(results);  // Return all victims associated with fir_id
  });
};



exports.saveAdditionalRelief = (req, res) => {
  const formData = req.body;
  const numberOfRecords = formData.victimName.length;
  const insertPromises = [];
  const additional_relief_id = generateRandomId(6);

  let promisesLeft = numberOfRecords;
  const results = [];

  for (let i = 0; i < numberOfRecords; i++) {
    const query = `
      INSERT INTO additional_relief (
        fir_id, ,victim_id, victim_name, section, additional_relief_id
      ) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const victimNamevalue = formData.victimName[i] || '';
    const victimidvalue = formData.victimId[i] || '';
    const sectionValue = formData.sectionValue[i].join(', ') || '';

    const values = [
      formData.fir_id,
      victimidvalue,
      victimNamevalue,
      sectionValue,
      additional_relief_id
    ];

    db.execute(query, values, (error, result) => {
      if (error) {
        console.error('Error inserting data:', error);
        return res.status(500).json({ message: 'Error inserting data', error });
      }

      const insertedId = result.insertId;

      insertIntoAnotherTable(insertedId, formData, i, (err) => {
        if (err) {
          console.error('Error inserting into another table:', err);
          return res.status(500).json({ message: 'Error inserting into another table', err });
        }

        promisesLeft--;

        if (promisesLeft === 0) {
          res.status(200).json({ message: 'Data saved successfully!' });
        }
      });
    });
  }
};

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







