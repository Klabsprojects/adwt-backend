const db = require("../db"); // DB connection

// Retrieves monetary relief details related to FIRs, including police station information, victim details, and the latest status update reasons for the current and previous month.
exports.getmonetaryReliefDetails = async (req, res) => {
  let query = `
  SELECT 
    fa.fir_id, 
    fa.police_city, 
    fa.police_station, 
    CONCAT(fa.fir_number, '/', fa.fir_number_suffix) AS fir_number,
    fa.status, 
    fa.relief_status,
    v.community,
    v.caste,
    fa.police_zone,
    fa.revenue_district,
    DATE_FORMAT(fa.date_of_registration, '%Y-%m-%d') AS date_of_registration,
    GROUP_CONCAT(DISTINCT v.victim_name ORDER BY v.victim_id DESC SEPARATOR ', ') AS victim_name,
    DATE_FORMAT(rr.report_month, '%Y-%m-%d') AS report_month, -- Include report_month

    -- Aggregate victim details to avoid duplicate rows
    GROUP_CONCAT(DISTINCT 
            REPLACE(REPLACE(v.offence_committed, '[', ''), ']', '') 
            ORDER BY v.victim_id DESC SEPARATOR ', ') AS offence_committed,

    -- Get only the latest report reason for the current and previous month
    (SELECT rr.reason_for_status 
     FROM report_reasons rr 
     WHERE rr.fir_id = fa.fir_id 
     AND MONTH(rr.report_month) = MONTH(CURDATE()) 
     AND YEAR(rr.report_month) = YEAR(CURDATE()) 
     ORDER BY rr.created_at DESC 
     LIMIT 1) AS current_month_reason_for_status,

    (SELECT rr.reason_for_status 
     FROM report_reasons rr 
     WHERE rr.fir_id = fa.fir_id 
     AND MONTH(rr.report_month) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
     AND YEAR(rr.report_month) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
     ORDER BY rr.created_at DESC 
     LIMIT 1) AS previous_month_reason_for_status

  FROM fir_add fa
  LEFT JOIN victims v ON fa.fir_id = v.fir_id
  LEFT JOIN report_reasons rr ON fa.fir_id = rr.fir_id  -- Ensure report_month is included
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
          .json({ message: "Failed to retrieve data", error: err });
      }
      if (results.length === 0) {
        console.log("No records found");
        return res.status(200).json({ message: "No records found" });
      }
      console.log("Query results:", results);
      res.status(200).json({ data: results });
    });
  } catch (error) {
    console.error("Error in getmonetaryReliefDetails:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};


// Updates status and relief_status in fir_add table and insert/update reason_current_month into report_reasons table if provided
exports.updateMonetaryRelief = async (req, res) => {
  const records = req.body; // Expecting an array of objects

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "Request body must be an array with at least one object" });
  }

  try {
    let updatePromises = records.map((record) => {
      return new Promise((resolve, reject) => {
        const { fir_id, status, relief_status, reason_current_month, created_by } = record;
        if (!Array.isArray(records) || records.length === 0) return res.status(400).json({ message: "Invalid Request" });
        // Check if fir_id exists in fir_add table
        let checkQuery = `SELECT COUNT(*) AS count FROM fir_add WHERE fir_id = ?`;
        db.query(checkQuery, [fir_id], (checkErr, checkResults) => {
          if (checkErr) {
            console.error("Database error while checking FIR ID:", checkErr);
            return reject({ fir_id, message: "Database error while checking FIR ID", error: checkErr });
          }
          if (checkResults[0].count === 0) {
            return reject({ fir_id, message: "Invalid FIR ID" });
          }
          // Update status and relief_status in fir_add table
          let updateQuery = `UPDATE fir_add SET status = COALESCE(?, status), relief_status = COALESCE(?, relief_status) WHERE fir_id = ?`;
          let updateParams = [status, relief_status, fir_id];
          db.query(updateQuery, updateParams, (updateErr, updateResults) => {
            if (updateErr) {
              console.error("Database error while updating FIR status:", updateErr);
              return reject({ fir_id, message: "Failed to update FIR status", error: updateErr });
            }
            console.log(`FIR status updated successfully for FIR ID: ${fir_id}`);
            // Handle report_reasons table (Insert/Update)
            if (reason_current_month && created_by) {
              let checkReportQuery = `
                SELECT id FROM report_reasons 
                WHERE fir_id = ? 
                AND MONTH(report_month) = MONTH(CURDATE()) 
                AND YEAR(report_month) = YEAR(CURDATE())
              `;
              db.query(checkReportQuery, [fir_id], (checkReportErr, reportResults) => {
                if (checkReportErr) {
                  console.error("Database error while checking report_reasons:", checkReportErr);
                  return reject({ fir_id, message: "Failed to check report_reasons", error: checkReportErr });
                }
                if (reportResults.length > 0) {
                  // If a report exists for the current month, update it
                  let updateReportQuery = `
                    UPDATE report_reasons 
                    SET reason_for_status = ?, created_by = ?, report_month = CURRENT_DATE
                    WHERE id = ?
                  `;
                  let updateReportParams = [reason_current_month, created_by, reportResults[0].id];
                  db.query(updateReportQuery, updateReportParams, (updateReportErr, updateReportResults) => {
                    if (updateReportErr) {
                      console.error("Database error while updating reason:", updateReportErr);
                      return reject({ fir_id, message: "Failed to update reason", error: updateReportErr });
                    }
                    console.log(`Reason updated successfully for FIR ID: ${fir_id}`);
                    resolve({ fir_id, message: "Updated successfully" });
                  });
                } else {
                  // If no report exists for the current month, insert a new one
                  let insertReportQuery = `
                    INSERT INTO report_reasons (fir_id, report_month, reason_for_status, created_by) 
                    VALUES (?, CURDATE(), ?, ?)
                  `;
                  let insertReportParams = [fir_id, reason_current_month, created_by];
                  db.query(insertReportQuery, insertReportParams, (insertReportErr, insertReportResults) => {
                    if (insertReportErr) {
                      console.error("Database error while inserting reason:", insertReportErr);
                      return reject({ fir_id, message: "Failed to insert reason", error: insertReportErr });
                    }
                    console.log(`Reason inserted successfully for FIR ID: ${fir_id}`);
                    resolve({ fir_id, message: "Updated successfully" });
                  });
                }
              });
            } else {
              resolve({ fir_id, message: "Updated successfully" });
            }
          });
        });
      });
    });
    Promise.allSettled(updatePromises)
      .then((results) => {
        res.status(200).json({
          message: "Monetary Relief update completed",
          results,
        });
      })
      .catch((error) => {
        console.error("Error in Monetary Relief update:", error);
        res.status(500).json({ error: "Failed to process some Monetary Relief records", details: error });
      });

  } catch (error) {
    console.error("Error in update Monetary Relief:", error);
    res.status(500).json({ error: "Failed to update Monetary Relief report." });
  }
};




exports.getVmcReportList = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];
  
  // Add filters to where clause
  if (req.query.search) {
    const searchValue = `%${req.query.search}%`;
    whereClause += ` WHERE (year LIKE ? OR meeting_type LIKE ? OR meeting_quarter LIKE ? OR meeting_date LIKE ? OR subdivision LIKE ?)`;
    
    params.push(searchValue, searchValue, searchValue, searchValue, searchValue);
  }
  
  if (req.query.meeting_type) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'meeting_type = ?';
    params.push(req.query.meeting_type);
  }

  if (req.query.meeting_quarter) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'meeting_quarter = ?';
    params.push(req.query.meeting_quarter);
  }

  if (req.query.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'district = ?';
    params.push(req.query.district);
  }

  if (req.query.year) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'year = ?';
    params.push(req.query.year);
  }

  if (req.query.subdivision) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'subdivision = ?';
    params.push(req.query.subdivision);
  }

    // Get paginated data query
    const query = `SELECT year, meeting_type, meeting_quarter, meeting_date, meeting_time, district, subdivision, meeting_status, DATE_FORMAT(uploaded_date ,"%d %M %Y") as uploaded_date FROM vmc_meeting${whereClause} `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        return res.status(500).json({ 
          message: 'Failed to retrieve FIR list', 
          error: err 
        });
      }
      
      // Return paginated data with metadata
      res.status(200).json({
        data: results,
      });
    });
  };


exports.getmonetaryReliefData = async (req, res) => {

    // Build WHERE clause based on provided filters
    const whereConditions = [];
    const params = [];
    // Optional filters
    if (req.body.district) {
      whereConditions.push('fa.revenue_district = ?');
      params.push(req.body.district);
    }

    if (req.body.police_city) {
      whereConditions.push('fa.police_city = ?');
      params.push(req.body.police_city);
    }

    if (req.body.Status_Of_Case) {
      if (req.body.Status_Of_Case === 'UI') {
        whereConditions.push('fa.status <= 5');
      } else if (req.body.Status_Of_Case === 'PT') {
        whereConditions.push('fa.status > 5');
      }
    }

    if (req.body.community) {
      whereConditions.push('vm.community = ?');
      params.push(req.body.community);
    }

    if (req.body.caste) {
      whereConditions.push('vm.caste = ?');
      params.push(req.body.caste);
    }

    if (req.body.police_zone) {
      whereConditions.push('fa.police_zone = ?');
      params.push(req.body.police_zone);
    }

    if (req.body.Filter_From_Date) {
      whereConditions.push('fa.date_of_registration >= ?');
      params.push(req.body.Filter_From_Date);
    }

    if (req.body.Filter_To_Date) {
      whereConditions.push('fa.date_of_registration <= ?');
      params.push(req.body.Filter_To_Date);
    }

    limit = req.body.limit ? parseInt(req.body.limit) : 100;
    skip = req.body.skip ? parseInt(req.body.skip) : 0;

    // Final WHERE clause
    const whereClause = whereConditions.length > 0 ? ` AND ${whereConditions.join(' AND ')}` : '';

    const query = `SELECT
        vm.victim_name AS victimName,
        vm.victim_gender AS gender,
        vm.caste,
        vm.community,
        vm.offence_committed,

        -- FIR Details
        fa.revenue_district,
        fa.police_city,
        fa.police_station,
        CONCAT(fa.fir_number, '/', fa.fir_number_suffix) AS fir_number,
        fa.date_of_registration AS FIR_date,
        CASE
            WHEN fa.status <= 5 THEN 'FIR'
            WHEN fa.status = 6 THEN 'Chargesheet'
            WHEN fa.status = 7 THEN 'Final Stage'
            ELSE 'Unknown'
        END AS relief_stage,
        CASE 
            WHEN fa.relief_status = 3 THEN 'Relief Given' 
            ELSE 'Relief Pending' 
        END AS relief_status,
        rr.reason_for_status AS report_reason,
        -- First Stage Relief
        vrf.relief_amount_scst AS first_reliefScst,
        vrf.relief_amount_exgratia AS first_reliefExGratia,
        pvrf.proceedings_date AS first_proceeding_date,
        pvrf.date_of_disbursement AS first_disbursement_date,
        DATEDIFF(pvrf.date_of_disbursement, fa.date_of_registration) AS days_since_first_relief,
        -- Second Stage Relief
        vrs.secondInstallmentReliefScst AS second_reliefScst,
        vrs.secondInstallmentReliefExGratia AS second_reliefExGratia,
        sip.file_date AS second_proceeding_date,
        DATEDIFF(sip.date_of_disbursement, fa.date_of_registration) AS days_since_second_relief,
        sip.date_of_disbursement AS second_disbursement_date,

        -- Trial Stage Relief
        tsr.trialStageReliefAct AS trial_reliefScst,
        tsr.trialStageReliefGovernment AS trial_reliefExGratia,
        tp.file_date AS trial_proceeding_date,
        DATEDIFF(tp.date_of_disbursement, fa.date_of_registration) AS days_since_trial_relief,
        tp.date_of_disbursement AS trial_disbursement_date

    FROM victims vm

    -- First Stage Relief
    LEFT JOIN victim_relief_first vrf 
        ON vrf.victim_id = vm.victim_id

    LEFT JOIN proceedings_victim_relief_first pvrf 
        ON pvrf.fir_id = vrf.fir_id

    -- Second Stage Relief
    LEFT JOIN victim_relief_second vrs 
        ON vrs.victim_id = vm.victim_id

    LEFT JOIN second_installment_proceedings sip 
        ON sip.fir_id = vrs.fir_id

    -- Trial Stage Relief
    LEFT JOIN trial_stage_relief tsr 
        ON tsr.victim_id = vm.victim_id 

    LEFT JOIN trial_proceedings tp 
        ON tp.fir_id = tsr.fir_id
    -- Report Reasons for current month/year
    LEFT JOIN report_reasons rr 
        ON rr.fir_id COLLATE utf8mb4_general_ci = vrf.fir_id COLLATE utf8mb4_general_ci 
        AND MONTH(rr.created_at) = MONTH(CURDATE()) 
        AND YEAR(rr.created_at) = YEAR(CURDATE())
    -- FIR Add
    LEFT JOIN fir_add fa 
        ON fa.fir_id COLLATE utf8mb4_general_ci = COALESCE(vrf.fir_id COLLATE utf8mb4_general_ci, vm.fir_id COLLATE utf8mb4_general_ci)

    WHERE vm.delete_status = 0 AND COALESCE(fa.fir_id, vrf.fir_id, vm.fir_id) IS NOT NULL
        AND TRIM(vm.victim_name) <> '' ${whereClause} LIMIT ${limit}
        OFFSET ${skip}`;

    try {
      db.query(query, params, (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ message: "Failed to retrieve data", error: err });
        }
        if (results.length === 0) {
          console.log("No records found");
          return res.status(200).json({ message: "No records found" });
        }
        console.log("Query results:", results);
        res.status(200).json({ data: results });
      });
    } catch (error) {
      console.error("Error in getmonetaryReliefDetails:", error);
      res.status(500).json({ error: "Failed to get report data." });
    }
}

exports.getmonetaryReliefDataV1 = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  const params = [];

  const addCondition = (sql, value, wildcard = false) => {
    conditions.push(sql);
    params.push(wildcard ? `%${value}%` : value);
  };

  const { policeCity, policeZone, revenueDistrict, OffenceGroup, startDate, endDate, 
          caste, community, statusOfCase, sectionOfLaw, reliefStage, reliefStatus, download,search } = req.query;
  if (search) {
      conditions.push(`(
          fa.fir_id LIKE ? OR
          CONCAT(fa.fir_number, '/', fa.fir_number_suffix) = ? OR
          fa.revenue_district LIKE ? OR
          fa.police_city LIKE ? OR
          fa.police_station LIKE ?
          )`);
      params.push(`%${search}%`, search, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (policeZone) addCondition('fa.police_zone = ?', policeZone);
  if (policeCity) addCondition('fa.police_city = ?', policeCity);
  if (revenueDistrict) addCondition('fa.revenue_district = ?', revenueDistrict);
  if (OffenceGroup) addCondition('fa.Offence_group = ?', OffenceGroup);
  if (startDate) addCondition('DATE(fa.date_of_registration) >= ?', startDate);
  if (endDate) addCondition('DATE(fa.date_of_registration) <= ?', endDate);
  
  let addingPTDetails = "";
  let addingCaseDetails = "";
  let addingChargeSheet = "";
  let addingOffenceActs = "";
  

  let joinconditions = [];

  if (statusOfCase) {
    if (statusOfCase === 'UI') {
      conditions.push('fa.status <= 5');
    } else if (statusOfCase === 'PT') {
      addingPTDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id 
      LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fa.fir_id`;

      conditions.push('fa.status >= 6');
      conditions.push(`case_details.judgement_awarded = 'no'`);
      conditions.push(`chargesheet_details.case_type = 'chargeSheet'`);
    } else if (statusOfCase === 'MF') {
      conditions.push(`COALESCE(fa.HascaseMF, 0) = 1`);
    }
    else if (statusOfCase === 'FirQuashed') {
      addingChargeSheet = `LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fa.fir_id`;
      conditions.push(`COALESCE(chargesheet_details.case_type, '') = 'firQuashed'`);
    }
    else if (statusOfCase === 'SectionDeleted') {
      addingChargeSheet = `LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fa.fir_id`;
      conditions.push(`COALESCE(chargesheet_details.case_type, '') = 'sectionDeleted'`);
    }
    else if (statusOfCase === 'Charge_Abated') {
      addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
      conditions.push(`COALESCE(case_details.judgementNature, '') = 'Charge_Abated'`);
    }
    else if (statusOfCase === 'Quashed') {
      addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
      conditions.push(`COALESCE(case_details.judgementNature, '') = 'Quashed'`);
    }
    else if (statusOfCase == "Convicted") {
      addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
      conditions.push(`COALESCE(case_details.judgementNature, '') = 'Convicted'`);
    }
    else if (statusOfCase == "Acquitted") {
      addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
      conditions.push(`COALESCE(case_details.judgementNature, '') = 'Acquitted'`);
    }
  }
  
  if(reliefStage == "FirQuashed,MF,SectionDeleted,Charge_Abated,Quashed"){

    addingChargeSheet = `LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fa.fir_id`;
    addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
    conditions.push(`COALESCE(chargesheet_details.case_type, '') IN ('firQuashed', 'sectionDeleted', 'referredChargeSheet') 
    OR COALESCE(fa.HascaseMF, 0) = 1 OR COALESCE(case_details.judgementNature, '') IN ('Charge_Abated', 'Quashed')`);
  }

  // Section of Law
  if (sectionOfLaw) {
    addingOffenceActs = `LEFT JOIN offence_acts ON offence_acts.offence_act_name = fa.offence_group`;
    conditions.push(`offence_acts.offence_act_name = '${sectionOfLaw}'`);
  }

  if(caste || community){
    if(community) conditions.push(`vd.community = '${community}'`);
    if(caste) conditions.push(`vd.caste = '${caste}'`);
  }

  if (reliefStage) {
    if (reliefStatus === "notyetreceived") {
      // Override everything: not yet received means FIR stage not given
      conditions.push(`fa.status <= 4`);
    }
    else if(reliefStage == 'FIR'){
      conditions.push('fa.status >= 5');
    } else if(reliefStage == 'Chargesheet'){
      conditions.push('fa.status >= 6');
    } else if(reliefStage == 'TrialStage'){
      conditions.push('fa.status = 7');
    }
  }

  if(reliefStatus == "pending"){
    if(reliefStage == 'FIR'){
      conditions.push(`fa.relief_status IN (0)`);
    }
    else if(reliefStage == 'Chargesheet'){
      conditions.push(`fa.relief_status IN (0,1)`);
    }
    else if(reliefStage == 'TrialStage'){
      conditions.push(`fa.relief_status IN (0,1,2)`);
    }
  }
  else if(reliefStatus == "given"){
    if(reliefStage == 'FIR'){
      conditions.push(`fa.relief_status IN(1,2,3)`);
    }
    else if(reliefStage == 'Chargesheet'){
      conditions.push(`fa.relief_status IN(2,3)`);
    }
    else if(reliefStage == 'TrialStage'){
      conditions.push(`fa.relief_status = 3`);
    }
  }

  let pagination = `LIMIT ? OFFSET ?`;
  if(download == "yes"){
    //remove pagination
    pagination = "";
  }

  // Combine all joins
  let joins = [
    addingPTDetails,
    addingCaseDetails,
    addingChargeSheet,
    addingOffenceActs
  ].filter(Boolean).join(" ");
 
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  countQuery = `SELECT COUNT(DISTINCT fa.fir_id) AS total FROM fir_add fa LEFT JOIN victims vd ON vd.fir_id = fa.fir_id ${joins} ${whereClause}`;

  db.query(countQuery, params, (err, countResults) => {
    if (err) return res.status(500).json({ message: 'Count query failed', error: err });
     const total = countResults.length != 0 ? countResults[0].total : 0;
    if (total === 0) {
      return res.status(200).json({ data: [], total: 0, page, pageSize, totalPages: 0 });
    }

    const totalPages = Math.ceil(total / pageSize);
    const validPage = Math.min(Math.max(1, page), totalPages);
    const validOffset = (validPage - 1) * pageSize;

    const query = `WITH victim_data AS (
      SELECT
          vm.victim_id,
          vm.fir_id,
          vm.victim_name,
          vm.victim_gender,
          vm.caste,
          vm.community,
          vm.offence_committed,
  
          -- Relief - First Stage
          vrf.relief_amount_scst,
          vrf.relief_amount_exgratia,
          pvrf.proceedings_date AS first_proceeding_date,
          pvrf.date_of_disbursement AS first_disbursement_date,
  
          -- Relief - Second Stage
          vrs.secondInstallmentReliefScst,
          vrs.secondInstallmentReliefExGratia,
          sip.file_date AS second_proceeding_date,
          sip.date_of_disbursement AS second_disbursement_date,
  
          -- Relief - Trial Stage
          tsr.trialStageReliefAct,
          tsr.trialStageReliefGovernment,
          tp.file_date AS trial_proceeding_date,
          tp.date_of_disbursement AS trial_disbursement_date
  
      FROM victims vm
      LEFT JOIN victim_relief_first vrf 
          ON vrf.fir_id COLLATE utf8mb4_general_ci = vm.fir_id COLLATE utf8mb4_general_ci
      LEFT JOIN proceedings_victim_relief_first pvrf 
          ON pvrf.fir_id = vrf.fir_id
      LEFT JOIN victim_relief_second vrs 
          ON vrs.victim_id = vm.victim_id
      LEFT JOIN second_installment_proceedings sip 
          ON sip.fir_id = vrs.fir_id
      LEFT JOIN trial_stage_relief tsr 
          ON tsr.victim_id = vm.victim_id
      LEFT JOIN trial_proceedings tp 
          ON tp.fir_id = tsr.fir_id
      WHERE vm.delete_status = 0
        AND TRIM(vm.victim_name) <> ''
  )
  
  SELECT
      -- FIR Info
      fa.fir_id,
      fa.revenue_district,
      fa.police_city,
      fa.police_station,
      CONCAT(fa.fir_number, '/', fa.fir_number_suffix) AS fir_number,
      fa.date_of_registration AS FIR_date,
  
      -- Relief Stage (Exact mapping)
      CASE
          WHEN fa.status <= 5 THEN 'FIR'
          WHEN fa.status = 6 THEN 'Chargesheet'
          WHEN fa.status = 7 THEN 'Final Stage'
          ELSE 'Unknown'
      END AS relief_stage,
  
      -- Stage-wise Relief Status
      CASE 
          -- FIR Stage
          WHEN fa.status >= 5 AND fa.relief_status = 1 
              THEN 'FIR Stage - Relief Given'
          WHEN fa.status >= 5 AND fa.relief_status < 1 
              THEN 'FIR Stage - Relief Pending'
  
          -- Chargesheet Stage
          WHEN fa.status >= 6 AND fa.relief_status = 2 
              THEN 'Chargesheet Stage - Relief Given'
          WHEN fa.status >= 6 AND fa.relief_status < 2 
              THEN 'Chargesheet Stage - Relief Pending'
  
          -- Trial Stage
          WHEN fa.status = 7 AND fa.relief_status = 3 
              THEN 'Trial Stage - Relief Given'
          WHEN fa.status = 7 AND fa.relief_status < 3 
              THEN 'Trial Stage - Relief Pending'
  
          ELSE 'Not Applicable'
      END AS relief_status,
  
      -- Report Reason (for current month/year)
      rr.reason_for_status AS report_reason,
  
      -- Victim Info
      vd.victim_name,
      vd.victim_gender,
      vd.caste,
      vd.community,
      vd.offence_committed,
  
      -- First Stage Relief
      vd.relief_amount_scst,
      vd.relief_amount_exgratia,
      vd.first_proceeding_date,
      vd.first_disbursement_date,
      DATEDIFF(vd.first_disbursement_date, fa.date_of_registration) AS days_since_first_relief,
  
      -- Second Stage Relief
      vd.secondInstallmentReliefScst,
      vd.secondInstallmentReliefExGratia,
      vd.second_proceeding_date,
      vd.second_disbursement_date,
      DATEDIFF(vd.second_disbursement_date, fa.date_of_registration) AS days_since_second_relief,
  
      -- Trial Stage Relief
      vd.trialStageReliefAct,
      vd.trialStageReliefGovernment,
      vd.trial_proceeding_date,
      vd.trial_disbursement_date,
      DATEDIFF(vd.trial_disbursement_date, fa.date_of_registration) AS days_since_trial_relief
  
  FROM fir_add fa
  
  -- Join victims + reliefs
  LEFT JOIN victim_data vd 
      ON vd.fir_id = fa.fir_id
  
  -- Join report reasons for current month/year
  LEFT JOIN report_reasons rr 
      ON rr.fir_id = fa.fir_id
     AND MONTH(rr.created_at) = MONTH(CURDATE())
     AND YEAR(rr.created_at) = YEAR(CURDATE())
    ${joins} ${whereClause}
    GROUP BY fa.fir_id
    ORDER BY fa.fir_id ${pagination}`;
console.log(query);
 db.query(query, [...params, pageSize, validOffset], (err, results) => {
      if (err) return res.status(500).json({ message: 'Data query failed', error: err });

      res.status(200).json({
        data: results,
        total,
        page: validPage,
        pageSize,
        totalPages
      });
    });
  });
};