const db = require("../db"); // DB connection

exports.getadditionalreportdetail = async (req, res) => {
  let query = `SELECT 
    fa.fir_id, 
    fa.police_city,
    fa.police_station,
    v.community,
    v.caste,
    fa.police_zone,
    fa.revenue_district,
    DATE_FORMAT(fa.date_of_registration, '%Y-%m-%d') AS date_of_registration,
    CONCAT(fa.fir_number, '/', fa.fir_number_suffix) AS fir_number,
    fa.status,
    GROUP_CONCAT(DISTINCT v.victim_name ORDER BY v.victim_id DESC SEPARATOR ', ') AS victim_name,
    GROUP_CONCAT(DISTINCT v.victim_age ORDER BY v.victim_id DESC SEPARATOR ', ') AS victim_age,
    GROUP_CONCAT(DISTINCT v.victim_gender ORDER BY v.victim_id DESC SEPARATOR ', ') AS victim_gender,
    GROUP_CONCAT(DISTINCT 
        REPLACE(REPLACE(v.offence_committed, '[', ''), ']', '') 
        ORDER BY v.victim_id DESC SEPARATOR ', ') AS offence_committed, 
    GROUP_CONCAT(DISTINCT 
        REPLACE(REPLACE(v.scst_sections, '[', ''), ']', '') 
        ORDER BY v.victim_id DESC SEPARATOR ', ') AS scst_sections
    FROM fir_add fa
    LEFT JOIN victims v ON v.fir_id = fa.fir_id
    GROUP BY fa.fir_id
    ORDER BY fa.created_at DESC; -- Order by created_at to get latest FIR records first
  `;
  const params = [];

  try {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ message: "Failed to retrieve data" });
      }
      if (results.length === 0) {
        console.log("No records found");
        return res.status(200).json({ message: "No records found" });
      }
      // console.log('Query results:', results);
      res.status(200).json({ data: results, count: results.length });
    });
  } catch (error) {
    console.error("Error in getadditionalreportdetails:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};


exports.getAdditionalReportBfAbstract = async(req, res) => {
  try{
    // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  whereClause += whereClause ? ' AND ' : ' WHERE ';
  whereClause += "fa.date_of_registration < '2016-04-14'";

    const query = `

      SELECT 
      fa.revenue_district,
      COUNT(DISTINCT a.id) AS total_cases,
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Employment%' AND ad.employment_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS job_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Pension%' AND ad.pension_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Pension_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%House site Patta%' AND ad.house_site_patta_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Patta_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Education concession%' AND ad.education_concession_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Education_Given

      FROM 
        fir_add fa
      LEFT JOIN 
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN 
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN 
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause} 
      GROUP BY 
        fa.revenue_district
      
    `;
    
    const queryParams = [...params];

    // console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results.map(row => ({
          ...row,
          relief_pending: row.total_cases - (row.job_Given + row.Pension_Given + row.Patta_Given + row.Education_Given)
        }))
      });
    });
  }
  catch(err){
    console.log(err);
    return res.status(500).json({ 
      message: 'Failed to retrieve Data', 
      error: err 
    });
  }
}

exports.getAdditionalReportAfAbstract = async(req, res) => {
  try{
    // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  whereClause += whereClause ? ' AND ' : ' WHERE ';
  whereClause += "fa.date_of_registration >= '2016-04-14'";

    const query = `SELECT 
      fa.revenue_district,
      COUNT(DISTINCT a.id) AS total_cases,
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Employment%' AND ad.employment_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS job_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Pension%' AND ad.pension_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Pension_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%House site Patta%' AND ad.house_site_patta_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Patta_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Education concession%' AND ad.education_concession_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Education_Given

      FROM 
        fir_add fa
      LEFT JOIN 
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN 
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN 
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause} 
      GROUP BY 
        fa.revenue_district`;
    
    const queryParams = [...params];

    // console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results.map(row => ({
          ...row,
          employment_pending: row.total_cases - row.job_Given,
          pension_pending: row.total_cases - row.Pension_Given,
          patta_pending: row.total_cases - row.Patta_Given,
          education_pending: row.total_cases - row.Education_Given
        }))
      });
    });
  }
  catch(err){
    console.log(err);
    return res.status(500).json({ 
      message: 'Failed to retrieve Data', 
      error: err 
    });
  }
}

exports.getAdditionalReliefData = async(req, res) => {
  try{
    // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.district) {
    whereClause += ' AND fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.police_zone) {
    whereClause += ' AND fa.police_zone = ?';
    params.push(req.body.police_zone);
  }

  if (req.body.police_city) {
    whereClause += ' AND fa.police_city = ?';
    params.push(req.body.police_city);
  }

  if (req.body.offence) {
    whereClause += ' AND fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += ' AND vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += ' AND vm.caste = ?';
    params.push(req.body.caste);
  }

    const query = `SELECT 
    (CASE 
          WHEN fa.date_of_registration < '2016-04-14' THEN "Before 2016" ELSE "After 2016" END) AS asperact,
    vm.victim_name AS victimName,
    vm.victim_gender AS gender,
    vm.caste,
    vm.community,
    -- FIR Details
    fa.revenue_district,
    fa.police_city,
    fa.police_station,
    CONCAT(fa.fir_number, '/', fa.fir_number_suffix) AS fir_number,
    fa.date_of_registration AS FIR_date,
    COALESCE(
      CASE 
        WHEN a.section LIKE '%Employment%' 
             AND ad.employment_status = 'Yes' 
        THEN "Job Given"
        WHEN a.section LIKE '%Employment%' 
             AND ad.employment_status = 'Not Applicable' 
        THEN "Job Not Applicable"
        WHEN a.section LIKE '%Employment%' 
             AND (ad.employment_status IS NULL OR ad.employment_status = 'No') 
        THEN "Job Pending"
      END
    ) AS EmpStatus,
    ad.appointment_order_date AS JobGivendate,
    ad.relationship_to_victim as Employmentrelationship,
    ad.department_name,
    ad.designation,
    COALESCE(
      CASE 
        WHEN a.section LIKE '%Pension%' 
             AND ad.pension_status = 'Yes' 
        THEN "Pension Given"
        WHEN a.section LIKE '%Pension%' 
             AND ad.pension_status = 'Not Applicable' 
        THEN "Pension Not Applicable"
        WHEN a.section LIKE '%Pension%' 
             AND (ad.pension_status IS NULL OR ad.pension_status = 'No') 
        THEN "Pension Pending"
      END
    ) AS PensionStatus,
    ad.proceedings_date as PensionGivendate,
    ad.relationship as Pensionrelationship,
    COALESCE(
      CASE 
        WHEN a.section LIKE '%House site Patta%' 
             AND ad.house_site_patta_status = 'Yes' 
        THEN "Patta Given"
        WHEN a.section LIKE '%House site Patta%' 
             AND ad.house_site_patta_status = 'Not Applicable' 
        THEN "Patta Not Applicable"
        WHEN a.section LIKE '%House site Patta%' 
             AND (ad.house_site_patta_status IS NULL OR ad.house_site_patta_status = 'No') 
        THEN "Patta Pending"
      END
    ) AS PattaStatus,
    ad.house_site_patta_issue_date as PattaGivendate,
    COALESCE(
      CASE 
        WHEN a.section LIKE '%Education concession%' 
             AND ad.education_concession_status = 'Yes' 
        THEN "Education Given"
        WHEN a.section LIKE '%Education concession%' 
             AND ad.education_concession_status = 'Not Applicable' 
        THEN "Education Not Applicable"
        WHEN a.section LIKE '%Education concession%' 
             AND (ad.education_concession_status IS NULL OR ad.education_concession_status = 'No') 
        THEN "Education Pending"
      END
    ) AS EducationStatus,
    COALESCE(
      CASE 
        WHEN a.section LIKE '%Provisions%' 
             AND ad.provisions_status = 'Yes' 
        THEN "Provisions Given"
        WHEN a.section LIKE '%Provisions%' 
             AND ad.provisions_status = 'Not Applicable' 
        THEN "Provisions Not Applicable"
        WHEN a.section LIKE '%Provisions%' 
             AND (ad.provisions_status IS NULL OR ad.provisions_status = 'No') 
        THEN "Provisions Pending"
      END
    ) AS ProvisionStatus,
   ad.number_of_children as Schoolorcollege,
   ad.provisions_date_of_document as EducationGivendate

  FROM 
    fir_add fa  
  LEFT JOIN victim_relief v ON v.fir_id = fa.fir_id
  LEFT JOIN 
    additional_relief a ON fa.fir_id = a.fir_id
  LEFT JOIN 
    victims vm ON vm.victim_id = a.victim_id
  LEFT JOIN 
    additional_relief_details ad ON a.id = ad.additional_relief_id 
WHERE JSON_LENGTH(v.additional_relief) > 0 AND vm.delete_status = 0 AND COALESCE(fa.fir_id, vm.fir_id) IS NOT NULL
    AND TRIM(vm.victim_name) <> '' ${whereClause} GROUP BY fa.fir_id, v.victim_id, v.victim_name`;
    
    const queryParams = [...params];

    // console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      res.status(200).json({
        data: results
      });
    });
  }
  catch(err){
    console.log(err);
    return res.status(500).json({ 
      message: 'Failed to retrieve Data', 
      error: err 
    });
  }
}