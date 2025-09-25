const db = require('../db'); // Update with actual DB connection




// exports.getFIRReliefList = (req, res) => {

  
//   // Build WHERE clause based on provided filters
//   let whereClause = '';
//   const params = [];
  
//   // Add filters to where clause
//   if (req.query.search) {
//     const searchValue = `%${req.query.search}%`;
//     const searchValue2 = `${req.query.search}`;
//     whereClause += ` WHERE (fir_add.fir_id LIKE ? OR CONCAT(fir_add.fir_number, '/', fir_add.fir_number_suffix) = ? OR fir_add.revenue_district LIKE ? OR fir_add.police_city LIKE ? OR fir_add.police_station LIKE ?)`;
    
//     params.push(searchValue, searchValue2, searchValue, searchValue, searchValue);
//   }
  
//   if (req.query.district) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.police_city = ?';
//     params.push(req.query.district);
//   }

//   if (req.query.policeStationName) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.police_station = ?';
//     params.push(req.query.policeStationName);
//   }

//   if (req.query.police_zone) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.police_zone = ?';
//     params.push(req.query.police_zone);
//   }

//   if (req.query.police_range) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.police_range = ?';
//     params.push(req.query.police_range);
//   }

//   if (req.query.revenue_district) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.revenue_district = ?';
//     params.push(req.query.revenue_district);
//   }

//   if (req.query.Offence_group) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.Offence_group = ?';
//     params.push(req.query.Offence_group);
//   }

//   if (req.query.complaintReceivedType) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.complaintReceivedType = ?';
//     params.push(req.query.complaintReceivedType);
//   }
  
//   if (req.query.start_date) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'DATE(fir_add.date_of_registration) >= ?';
//     params.push(req.query.start_date);
//   }
  
//   if (req.query.end_date) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'DATE(fir_add.date_of_registration) <= ?';
//     params.push(req.query.end_date);
//   }

//   if (req.query.UIPT) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     if (req.query.UIPT == 'UI') {
//       whereClause += 'fir_add.status <= 5';
//     } else {
//       whereClause += 'fir_add.status >= 6';
//     }
//   }

//   if (req.query.status) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     if (req.query.status == 0) {
//       whereClause += 'fir_add.status >= 0 AND fir_add.status <= 5';
//     } else {
//       whereClause += 'fir_add.status = ?';
//       params.push(req.query.status);
//     }
//   }

//   if (req.query.year) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'DATE_FORMAT(fir_add.date_of_registration, "%Y") = ? ';
//     params.push(req.query.year);
//   }

//   if (req.query.chargesheetFromDate){
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'DATE(chargesheet_details.chargesheetDate) >= ?';
//     params.push(req.query.chargesheetFromDate);
//   } 
//   if (req.query.chargesheetToDate) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'DATE(chargesheet_details.chargesheetDate) <= ?';
//     params.push(req.query.chargesheetToDate);
//   }

//   let addingChargeSheet = '';
//   if (req.query.chargesheetFromDate || req.query.chargesheetToDate) {
//   // Only once
//     addingChargeSheet = `LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`;
//   }

//   whereClause += whereClause ? ' AND ' : ' WHERE ';
//   whereClause += 'fir_add.status >= 0 AND fir_add.status <= 7';

//           const query = `
//             SELECT 
//                   CONCAT(fir_add.fir_number,'/',fir_add.fir_number_suffix) as fir_number,
//                   fir_add.fir_id,
//                   fir_add.police_city,
//                   fir_add.police_station,
//                   fir_add.number_of_victim,
//                   users.name as created_by,
//                   fir_add.created_at,
//                   fir_add.status,
//                   fir_add.relief_status as relief_status,
//                   nature_of_judgement as nature_of_judgement,
//                   DATE(fir_add.date_of_registration) as date_of_reporting
//                 FROM fir_add
//                 LEFT JOIN users ON users.id = fir_add.created_by
//                 ${addingChargeSheet}
//                 ${whereClause} 
//                 ORDER BY fir_add.created_at DESC 
//           `;
    
//     const queryParams = [...params];

//     // console.log(query)
//     // console.log(queryParams)
    
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

exports.getFIRReliefList = (req, res) => {

  // Stage conditions
  const stageConditions = {
    firProposalNotYetReceived: `fir_add.status <= 4`,
    firReliefStageGiven: `fir_add.status >= 5 AND fir_add.relief_status IN (1,2,3)`,
    firReliefStagePending: `fir_add.status >= 5 AND fir_add.relief_status = 0`,
    chargesheetReliefStageGiven: `fir_add.status >= 6 AND fir_add.relief_status IN (2,3)`,
    chargesheetReliefStagePending: `fir_add.status >= 6 AND fir_add.relief_status <= 1`,
    trialReliefStageGiven: `fir_add.status = 7 AND fir_add.relief_status = 3`,
    trialReliefStagePending: `fir_add.status = 7 AND fir_add.relief_status <= 2`,

    mistakeOfFact: `(COALESCE(fir_add.HascaseMF, 0) = 1 OR COALESCE(chargesheet_details.case_type, '') = 'referredChargeSheet')`,
    sectionDeleted: `COALESCE(chargesheet_details.case_type, '') = 'sectionDeleted'`,
    firQuashed: `COALESCE(chargesheet_details.case_type, '') = 'firQuashed'`,
    acquitted: `COALESCE(case_details.judgementNature, '') = 'Acquitted'`,
    chargeAbated: `COALESCE(case_details.judgementNature, '') = 'Charge_Abated'`,
    quashed: `COALESCE(case_details.judgementNature, '') = 'Quashed'`
  };

  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  // Track required joins
  let joinUsers = true; // always needed
  let joinChargesheet = false;
  let joinCaseDetails = false;
  
  // Add filters to where clause
  if (req.query.search) {
    const searchValue = `%${req.query.search}%`;
    const searchValue2 = `${req.query.search}`;
    whereClause += ` WHERE (fir_add.fir_id LIKE ? OR CONCAT(fir_add.fir_number, '/', fir_add.fir_number_suffix) = ? OR fir_add.revenue_district LIKE ? OR fir_add.police_city LIKE ? OR fir_add.police_station LIKE ?)`;
    
    params.push(searchValue, searchValue2, searchValue, searchValue, searchValue);
  }
  
  if (req.query.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fir_add.police_city = ?';
    params.push(req.query.district);
  }

  if (req.query.policeStationName) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fir_add.police_station = ?';
    params.push(req.query.policeStationName);
  }

  if (req.query.police_zone) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fir_add.police_zone = ?';
    params.push(req.query.police_zone);
  }

  if (req.query.police_range) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fir_add.police_range = ?';
    params.push(req.query.police_range);
  }

  if (req.query.revenue_district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fir_add.revenue_district = ?';
    params.push(req.query.revenue_district);
  }

  if (req.query.Offence_group) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fir_add.Offence_group = ?';
    params.push(req.query.Offence_group);
  }

  if (req.query.complaintReceivedType) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fir_add.complaintReceivedType = ?';
    params.push(req.query.complaintReceivedType);
  }
  
  if (req.query.start_date) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'DATE(fir_add.date_of_registration) >= ?';
    params.push(req.query.start_date);
  }
  
  if (req.query.end_date) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'DATE(fir_add.date_of_registration) <= ?';
    params.push(req.query.end_date);
  }

  if (req.query.UIPT) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    if (req.query.UIPT == 'UI') {
      whereClause += 'fir_add.status <= 5';
    } else {
      whereClause += 'fir_add.status >= 6';
    }
  }

  if (req.query.status) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    if (req.query.status == 0) {
      whereClause += 'fir_add.status >= 0 AND fir_add.status <= 5';
    } else {
      whereClause += 'fir_add.status = ?';
      params.push(req.query.status);
    }
  }

  if (req.query.year) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'DATE_FORMAT(fir_add.date_of_registration, "%Y") = ? ';
    params.push(req.query.year);
  }

  if (req.query.chargesheetFromDate){
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'DATE(chargesheet_details.chargesheetDate) >= ?';
    params.push(req.query.chargesheetFromDate);
    joinChargesheet = true;
  } 
  if (req.query.chargesheetToDate) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'DATE(chargesheet_details.chargesheetDate) <= ?';
    params.push(req.query.chargesheetToDate);
    joinChargesheet = true;
  }

  // Stage filters (support multiple values, comma-separated)
  if (req.query.selectedStatus) {
    const stages = req.query.selectedStatus.split(",");
    const stageFilters = stages
      .filter(stage => stageConditions[stage])
      .map(stage => {
        if (['mistakeOfFact', 'sectionDeleted', 'firQuashed'].includes(stage)) {
          joinChargesheet = true;
        }
        if (['acquitted', 'chargeAbated', 'quashed'].includes(stage)) {
          joinCaseDetails = true;
        }
        return stageConditions[stage];
      });

    if (stageFilters.length) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += `(${stageFilters.join(" OR ")})`;
    }
  }

  // Always restrict valid status range
  whereClause += whereClause ? ' AND ' : ' WHERE ';
  whereClause += 'fir_add.status >= 0 AND fir_add.status <= 7';

  // Build joins dynamically
  let joins = 'LEFT JOIN users ON users.id = fir_add.created_by';
  if (joinChargesheet) joins += ' LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id';
  if (joinCaseDetails) joins += ' LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id';


    const query = `
    SELECT 
          CONCAT(fir_add.fir_number,'/',fir_add.fir_number_suffix) as fir_number,
          fir_add.fir_id,
          fir_add.police_city,
          fir_add.police_station,
          fir_add.number_of_victim,
          users.name as created_by,
          fir_add.created_at,
          fir_add.status,
          fir_add.relief_status as relief_status,
          nature_of_judgement as nature_of_judgement,
          DATE(fir_add.date_of_registration) as date_of_reporting
        FROM fir_add
        ${joins}
        ${whereClause} 
        ORDER BY fir_add.created_at DESC 
    `;
console.log(params);
    const queryParams = [...params];

     console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        return res.status(500).json({ 
          message: 'Failed to retrieve FIR list', 
          error: err 
        });
      }
      
      // Return paginated data with metadata
      // res.status(200).json({
      //   data: results
      // });
      res.status(200).json(results);
    });
};

exports.getFIRReliefListV1 = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const conditionsSet = new Set();     // dedupe WHERE
  const joinsSet = new Set();          // dedupe LEFT JOIN
  const params = [];

  const addCondition = (sql, value, wildcard = false) => {
    conditionsSet.add(sql);
    params.push(wildcard ? `%${value}%` : value);
  };

  const {
    search, district, police_zone, police_range, revenue_district, Offence_group,
    complaintReceivedType, start_date, end_date, UIPT, status, year, created_at, modified_at,
    CreatedATstartDate, CreatedATendDate, ModifiedATstartDate, ModifiedATDate, legacy,
    policeStation, caste, community, statusOfCase, sectionOfLaw, court, convictionType,
    chargesheetDate, hasLegalObtained, caseFitForAppeal, filedBy, appealCourt, dataEntryStatus,
    chargesheetFromDate, chargesheetToDate, selectedStatus
  } = req.query;

  /* -------------------------------------------------------
    BASIC FILTERS
  ------------------------------------------------------- */
  if (search) {
    conditionsSet.add(`(
      fir_add.fir_id LIKE ? OR
      CONCAT(fir_add.fir_number, '/', fir_add.fir_number_suffix) = ? OR
      fir_add.revenue_district LIKE ? OR
      fir_add.police_city LIKE ? OR
      fir_add.police_station LIKE ?
    )`);
    params.push(`%${search}%`, search, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (district) addCondition('fir_add.police_city = ?', district);
  if (police_zone) addCondition('fir_add.police_zone = ?', police_zone);
  if (police_range) addCondition('fir_add.police_range = ?', police_range);
  if (revenue_district) addCondition('fir_add.revenue_district = ?', revenue_district);
  if (Offence_group) addCondition('fir_add.Offence_group = ?', Offence_group);
  if (complaintReceivedType) addCondition('fir_add.complaintReceivedType = ?', complaintReceivedType);
  if (start_date) addCondition('DATE(fir_add.date_of_registration) >= ?', start_date);
  if (end_date) addCondition('DATE(fir_add.date_of_registration) <= ?', end_date);
  if (CreatedATstartDate) addCondition('DATE(fir_add.created_at) >= ?', CreatedATstartDate);
  if (CreatedATendDate) addCondition('DATE(fir_add.created_at) <= ?', CreatedATendDate);
  if (ModifiedATstartDate) addCondition('DATE(fir_add.updated_at) >= ?', ModifiedATstartDate);
  if (ModifiedATDate) addCondition('DATE(fir_add.updated_at) <= ?', ModifiedATDate);
  if (policeStation) addCondition('fir_add.police_station = ?', policeStation);

  if (chargesheetFromDate) {
    joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
    addCondition('DATE(chargesheet_details.chargesheetDate) >= ?', chargesheetFromDate);
  }
  if (chargesheetToDate) {
    joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
    addCondition('DATE(chargesheet_details.chargesheetDate) <= ?', chargesheetToDate);
  }

  /* -------------------------------------------------------
    STATUS OF CASE (existing behavior you had)
  ------------------------------------------------------- */
  if (statusOfCase === 'UI') {
    conditionsSet.add('fir_add.status <= 5');
  }

  if (statusOfCase === 'PT') {
    joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
    joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
    conditionsSet.add('fir_add.status >= 6');
    conditionsSet.add(`case_details.judgement_awarded = 'no'`);
    conditionsSet.add(`chargesheet_details.case_type = 'chargeSheet'`);
  }

  if (statusOfCase === "Convicted") {
    joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`case_details.judgementNature = 'Convicted'`);
  }
  if (statusOfCase === "Acquitted") {
    joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`case_details.judgementNature = 'Acquitted'`);
  }
  if (statusOfCase === "FirQuashed") {
    joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`chargesheet_details.case_type = 'firQuashed'`);
  }
  if (statusOfCase === "MF") {
    joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`(fir_add.HascaseMF = 1 OR chargesheet_details.case_type = 'referredChargeSheet')`);
  }
  if (statusOfCase === "SectionDeleted") {
    joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`chargesheet_details.case_type = 'sectionDeleted'`);
  }
  if (statusOfCase === "Charge_Abated") {
    joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`case_details.judgementNature = 'Charge_Abated'`);
  }
  if (statusOfCase === "Quashed") {
    joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`case_details.judgementNature = 'Quashed'`);
  }

  /* -------------------------------------------------------
    SECTION OF LAW / COURT / CONVICTION / APPEAL
  ------------------------------------------------------- */
  if (sectionOfLaw) {
    joinsSet.add(`LEFT JOIN offence_acts ON offence_acts.group_code = fir_add.offence_group`);
    conditionsSet.add(`offence_acts.group_code = '${sectionOfLaw}'`);
  }

  if (court) {
    joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`case_details.court_name = '${court}'`);
  }
  if (convictionType) {
    joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`case_details.Conviction_Type = '${convictionType}'`);
  }

  if (hasLegalObtained) {
    joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`appeal_details.legal_opinion_obtained = '${hasLegalObtained}'`);
  }
  if (caseFitForAppeal) {
    joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`appeal_details.case_fit_for_appeal = '${caseFitForAppeal}'`);
  }
  if (filedBy) {
    joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`appeal_details.filed_by = '${filedBy}'`);
  }
  if (appealCourt) {
    joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`);
    conditionsSet.add(`appeal_details.designated_court = '${appealCourt}'`);
  }

  /* -------------------------------------------------------
    VICTIMS
  ------------------------------------------------------- */
  let groupByClause = "";
  if (caste || community) {
    joinsSet.add(`LEFT JOIN victims ON victims.fir_id = fir_add.fir_id`);
    if (community) conditionsSet.add(`victims.community = '${community}'`);
    if (caste) conditionsSet.add(`victims.caste = '${caste}'`);
    groupByClause = `GROUP BY fir_add.fir_id`;
  }

  /* -------------------------------------------------------
    DATA ENTRY STATUS (expanded mapping + fallback)
    - MF: HascaseMF OR referredChargeSheet
    - SectionAltered: is_case_altered = 1
    - SectionDeleted: chargesheet_details.case_type = 'sectionDeleted'
    - FirQuashed: chargesheet_details.case_type = 'firQuashed'
    - Charge_Abated: case_details.judgementNature = 'Charge_Abated'
    - Quashed: case_details.judgementNature = 'Quashed'
    - Appeal: judgementNature = 'Acquitted' AND any appeal_details.filed_by present
    - else: fallback to fir_add.status = ?
  ------------------------------------------------------- */
  if (dataEntryStatus) {
    switch (dataEntryStatus) {
      case "MF":
        joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
        conditionsSet.add(`(fir_add.HascaseMF = 1 OR chargesheet_details.case_type = 'referredChargeSheet')`);
        break;

      case "SectionAltered":
        conditionsSet.add(`fir_add.is_case_altered = 1`);
        break;

      case "SectionDeleted":
        joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
        conditionsSet.add(`chargesheet_details.case_type = 'sectionDeleted'`);
        break;

      case "FirQuashed":
        joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
        conditionsSet.add(`chargesheet_details.case_type = 'firQuashed'`);
        break;

      case "Charge_Abated":
        joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
        conditionsSet.add(`case_details.judgementNature = 'Charge_Abated'`);
        break;

      case "Quashed":
        joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
        conditionsSet.add(`case_details.judgementNature = 'Quashed'`);
        break;

      case "Appeal":
        joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
        joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`);
        conditionsSet.add(`case_details.judgementNature = 'Acquitted'`);
        conditionsSet.add(`(appeal_details.filed_by IS NOT NULL AND appeal_details.filed_by <> '')`);
        break;

      default:
        // fallback to original behavior (numeric/other custom values)
        addCondition('fir_add.status = ?', dataEntryStatus);
    }
  }

  /* -------------------------------------------------------
    YEAR / LEGACY
  ------------------------------------------------------- */
  if (year) addCondition('DATE_FORMAT(fir_add.date_of_registration, "%Y") = ?', year);

  if (legacy == "yes") {
    const legacyDate = '2025-03-20 09:18:11';
    addCondition('fir_add.created_at = ?', legacyDate);
  }

  /* -------------------------------------------------------
  STAGE FILTER (support multiple, comma-separated)
------------------------------------------------------- */
  const stageConditions = {
    firProposalNotYetReceived: `fir_add.status <= 4`,
    firReliefStageGiven: `fir_add.status >= 5 AND fir_add.relief_status IN (1,2,3)`,
    firReliefStagePending: `fir_add.status >= 5 AND fir_add.relief_status = 0`,
    chargesheetReliefStageGiven: `fir_add.status >= 6 AND fir_add.relief_status IN (2,3)`,
    chargesheetReliefStagePending: `fir_add.status >= 6 AND fir_add.relief_status <= 1`,
    trialReliefStageGiven: `fir_add.status = 7 AND fir_add.relief_status = 3`,
    trialReliefStagePending: `fir_add.status = 7 AND fir_add.relief_status <= 2`,

    // Case outcome / misc
    mistakeOfFact: `(COALESCE(fir_add.HascaseMF, 0) = 1 OR COALESCE(chargesheet_details.case_type, '') = 'referredChargeSheet')`,
    sectionDeleted: `COALESCE(chargesheet_details.case_type, '') = 'sectionDeleted'`,
    firQuashed: `COALESCE(chargesheet_details.case_type, '') = 'firQuashed'`,
    acquitted: `COALESCE(case_details.judgementNature, '') = 'Acquitted'`,
    chargeAbated: `COALESCE(case_details.judgementNature, '') = 'Charge_Abated'`,
    quashed: `COALESCE(case_details.judgementNature, '') = 'Quashed'`
  };

  if (selectedStatus) {
    const stageList = selectedStatus.split(",").map(s => s.trim()).filter(Boolean);

    const stageClauses = [];

    stageList.forEach(s => {
      if (stageConditions[s]) {
        // Add joins if needed
        if (["mistakeOfFact", "sectionDeleted", "firQuashed"].includes(s)) {
          joinsSet.add(`LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`);
        }
        if (["acquitted", "chargeAbated", "quashed"].includes(s)) {
          joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`);
        }

        stageClauses.push(stageConditions[s]);
      }
    });

    if (stageClauses.length > 0) {
      conditionsSet.add(`(${stageClauses.join(" OR ")})`);
    }
  }
  /* -------------------------------------------------------
    FINAL WHERE + JOINS
  ------------------------------------------------------- */
  const whereClause = conditionsSet.size ? `WHERE ${[...conditionsSet].join(' AND ')}` : '';
  const joins = [...joinsSet].join(" ");
  if(caste || community){
    countQuery = `SELECT COUNT(*) AS total
    FROM (
      SELECT fir_add.fir_id
      FROM fir_add LEFT JOIN users ON users.id = fir_add.created_by ${joins} ${whereClause} ${groupByClause} ) AS sub`;
  }
  else{
    countQuery = `SELECT COUNT(*) AS total FROM fir_add
    LEFT JOIN users ON users.id = fir_add.created_by ${joins} ${whereClause} ${groupByClause}`;
  }
  
    db.query(countQuery, params, (err, countResults) => {
      if (err) return res.status(500).json({ message: 'Count query failed', error: err });
      const total = countResults.length != 0 ? countResults[0].total : 0;
      if (total === 0) {
        return res.status(200).json({ data: [], total: 0, page, pageSize, totalPages: 0 });
      }
  
      const totalPages = Math.ceil(total / pageSize);
      const validPage = Math.min(Math.max(1, page), totalPages);
      const validOffset = (validPage - 1) * pageSize;
  
      const query = `SELECT 
      CONCAT(fir_add.fir_number,'/',fir_add.fir_number_suffix) as fir_number,
      fir_add.fir_id,
      fir_add.police_city,
      fir_add.police_station,
      fir_add.number_of_victim,
      users.name as created_by,
      fir_add.created_at,
      fir_add.status,
      fir_add.relief_status as relief_status,
      nature_of_judgement as nature_of_judgement,
      DATE(fir_add.date_of_registration) as date_of_reporting
    FROM fir_add
    LEFT JOIN users ON users.id = fir_add.created_by
    ${joins} ${whereClause} ${groupByClause} 
    ORDER BY fir_add.created_at DESC LIMIT ? OFFSET ?`;

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


// exports.getAlteredList = (req, res) => {

  
//   // Build WHERE clause based on provided filters
//   let whereClause = '';
//   const params = [];
  
//   // Add filters to where clause
//   if (req.query.search) {
//     const searchValue = `%${req.query.search}%`;
//     const searchValue2 = `${req.query.search}`;
//     whereClause += ` WHERE (fir_add.fir_id LIKE ? OR CONCAT(fir_add.fir_number, '/', fir_add.fir_number_suffix) = ? OR fir_add.revenue_district LIKE ? OR fir_add.police_city LIKE ? OR fir_add.police_station LIKE ?)`;
    
//     params.push(searchValue, searchValue2, searchValue, searchValue, searchValue);
//   }
  
//   if (req.query.district) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.police_city = ?';
//     params.push(req.query.district);
//   }

//   if (req.query.policeStationName) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.police_station = ?';
//     params.push(req.query.policeStationName);
//   }

//   if (req.query.police_zone) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.police_zone = ?';
//     params.push(req.query.police_zone);
//   }

//   if (req.query.police_range) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.police_range = ?';
//     params.push(req.query.police_range);
//   }

//   if (req.query.revenue_district) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.revenue_district = ?';
//     params.push(req.query.revenue_district);
//   }

//   if (req.query.Offence_group) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.Offence_group = ?';
//     params.push(req.query.Offence_group);
//   }

//   if (req.query.complaintReceivedType) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'fir_add.complaintReceivedType = ?';
//     params.push(req.query.complaintReceivedType);
//   }
  
//   if (req.query.start_date) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'DATE(fir_add.date_of_registration) >= ?';
//     params.push(req.query.start_date);
//   }
  
//   if (req.query.end_date) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'DATE(fir_add.date_of_registration) <= ?';
//     params.push(req.query.end_date);
//   }

//   if (req.query.UIPT) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     if (req.query.UIPT == 'UI') {
//       whereClause += 'fir_add.status <= 5';
//     } else {
//       whereClause += 'fir_add.status >= 6';
//     }
//   }

//   if (req.query.status) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     if (req.query.status == 0) {
//       whereClause += 'fir_add.status >= 0 AND fir_add.status <= 5';
//     } else {
//       whereClause += 'fir_add.status = ?';
//       params.push(req.query.status);
//     }
//   }

//   if (req.query.year) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'DATE_FORMAT(fir_add.date_of_registration, "%Y") = ? ';
//     params.push(req.query.year);
//   }

//           const query = `
//             SELECT 
//                   CONCAT(fir_add.fir_number,'/',fir_add.fir_number_suffix) as fir_number,
//                   fir_add.fir_id,
//                   fir_add.police_city,
//                   fir_add.police_station,
//                   fir_add.number_of_victim,
//                   users.name as created_by,
//                   fir_add.created_at,
//                   fir_add.status,
//                   fir_add.relief_status as relief_status,
//                   nature_of_judgement as nature_of_judgement
//                 FROM fir_add
//                 LEFT JOIN users ON users.id = fir_add.created_by
//                 INNER JOIN case_altered_log cal ON cal.fir_id = fir_add.fir_id
//                 ${whereClause} 
//                 ORDER BY fir_add.created_at DESC 
//           `;
    
//     const queryParams = [...params];

//     // console.log(query)
//     // console.log(queryParams)
    
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

exports.getAlteredList = (req, res) => {
  const conditions = [];
  const params = [];

  if (req.query.search) {
    const searchValue = `%${req.query.search}%`;
    const searchValue2 = `${req.query.search}`;
    conditions.push(`(
      fir_add.fir_id LIKE ? OR 
      CONCAT(fir_add.fir_number, '/', fir_add.fir_number_suffix) = ? OR 
      fir_add.revenue_district LIKE ? OR 
      fir_add.police_city LIKE ? OR 
      fir_add.police_station LIKE ?
    )`);
    params.push(searchValue, searchValue2, searchValue, searchValue, searchValue);
  }

  if (req.query.district) {
    conditions.push('fir_add.police_city = ?');
    params.push(req.query.district);
  }

  if (req.query.policeStationName) {
    conditions.push('fir_add.police_station = ?');
    params.push(req.query.policeStationName);
  }

  if (req.query.police_zone) {
    conditions.push('fir_add.police_zone = ?');
    params.push(req.query.police_zone);
  }

  if (req.query.police_range) {
    conditions.push('fir_add.police_range = ?');
    params.push(req.query.police_range);
  }

  if (req.query.revenue_district) {
    conditions.push('fir_add.revenue_district = ?');
    params.push(req.query.revenue_district);
  }

  if (req.query.Offence_group) {
    conditions.push('fir_add.Offence_group = ?');
    params.push(req.query.Offence_group);
  }

  if (req.query.complaintReceivedType) {
    conditions.push('fir_add.complaintReceivedType = ?');
    params.push(req.query.complaintReceivedType);
  }

  if (req.query.start_date) {
    conditions.push('DATE(fir_add.date_of_registration) >= ?');
    params.push(req.query.start_date);
  }

  if (req.query.end_date) {
    conditions.push('DATE(fir_add.date_of_registration) <= ?');
    params.push(req.query.end_date);
  }

  if (req.query.UIPT) {
    if (req.query.UIPT === 'UI') {
      conditions.push('fir_add.status <= 5');
    } else {
      conditions.push('fir_add.status >= 6');
    }
  }

  if (req.query.status !== undefined) {
    if (req.query.status == 0) {
      conditions.push('fir_add.status >= 0 AND fir_add.status <= 5');
    } else {
      conditions.push('fir_add.status = ?');
      params.push(req.query.status);
    }
  }

  if (req.query.year) {
    conditions.push('DATE_FORMAT(fir_add.date_of_registration, "%Y") = ?');
    params.push(req.query.year);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      CONCAT(fir_add.fir_number,'/',fir_add.fir_number_suffix) AS fir_number,
      fir_add.fir_id,
      fir_add.police_city,
      fir_add.police_station,
      fir_add.number_of_victim,
      users.name AS created_by,
      cal.created_at,
      fir_add.status,
      cal.id
    FROM fir_add
    INNER JOIN case_altered_log cal ON cal.fir_id = fir_add.fir_id
    LEFT JOIN users ON users.id = cal.created_by
    ${whereClause}
    ORDER BY cal.created_at DESC
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: 'Failed to retrieve FIR list',
        error: err.message,
      });
    }

    res.status(200).json(results);
  });
};




function generateRandomId(length = 36) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// exports.saveFirstInstallment = (req, res) => {
//   const { firId, victims, proceedings } = req.body;

//   if (!firId || !victims || !proceedings) {
//     return res.status(400).json({ message: 'Missing required fields.' });
//   }

//   db.beginTransaction((err) => {
//     if (err) return res.status(500).json({ message: 'Transaction error', error: err });

//     // Handle Victims - Update if exists, else Insert
//     const victimPromises = victims.map((victim) => {
//       return new Promise((resolve, reject) => {
//         const checkQuery = `SELECT COUNT(*) as count FROM victim_relief_first WHERE victim_relif_id = ? AND fir_id = ?`;
        
//         db.query(checkQuery, [victim.victimReliefId, firId], (err, results) => {
//           if (err) return reject(err);

//           const exists = results[0].count > 0;

//           const query = exists
//             ? `UPDATE victim_relief_first 
//                SET victim_id = ?, relief_id = ?, victim_name = ?, bank_account_number = ?, ifsc_code = ?, bank_name = ?, 
//                    relief_amount_scst = ?, relief_amount_exgratia = ?, relief_amount_first_stage = ?
//                WHERE victim_relif_id = ? AND fir_id = ?`
//             : `INSERT INTO victim_relief_first 
//                (victim_relif_id, victim_id, relief_id, fir_id, victim_name, bank_account_number, ifsc_code, bank_name, 
//                 relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage) 
//                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//           const values = exists
//             ? [
//                 victim.victimId,
//                 victim.reliefId,
//                 victim.victimName,
//                 victim.bankAccountNumber,
//                 victim.ifscCode,
//                 victim.bankName,
//                 victim.reliefAmountScst || 0,
//                 victim.reliefAmountExGratia || 0,
//                 victim.reliefAmountFirstStage || 0,
//                 victim.victimReliefId,
//                 firId,
//               ]
//             : [
//                 victim.victimReliefId || generateRandomId(6), // Generate ID if not provided
//                 victim.victimId,
//                 victim.reliefId,
//                 firId,
//                 victim.victimName,
//                 victim.bankAccountNumber,
//                 victim.ifscCode,
//                 victim.bankName,
//                 victim.reliefAmountScst || 0,
//                 victim.reliefAmountExGratia || 0,
//                 victim.reliefAmountFirstStage || 0,
//               ];

//           db.query(query, values, (err) => (err ? reject(err) : resolve()));
//         });
//       });
//     });

//     // Handle Proceedings - Update if exists, else Insert
//     const proceedingsPromiseFirst = new Promise((resolve, reject) => {
//       const checkQuery = `SELECT COUNT(*) as count FROM proceedings_victim_relief_first WHERE fir_id = ?`;

//       db.query(checkQuery, [firId], (err, results) => {
//         if (err) return reject(err);

//         const exists = results[0].count > 0;

//         const query = exists
//           ? `UPDATE proceedings_victim_relief_first 
//              SET proceedings_file_no = ?, proceedings_date = ?, proceedings_file = ?, pfms_portal_uploaded = ?, date_of_disbursement = ?
//              WHERE fir_id = ?`
//           : `INSERT INTO proceedings_victim_relief_first 
//              (proceeding_id, fir_id, proceedings_file_no, proceedings_date, proceedings_file, pfms_portal_uploaded, date_of_disbursement) 
//              VALUES (?, ?, ?, ?, ?, ?, ?)`;

//         const values = exists
//           ? [
//               proceedings.fileNo,
//               proceedings.fileDate,
//               proceedings.uploadDocument,
//               proceedings.pfmsPortalUploaded,
//               proceedings.dateOfDisbursement,
//               firId,
//             ]
//           : [
//               generateRandomId(6), // Generate new ID
//               firId,
//               proceedings.fileNo,
//               proceedings.fileDate,
//               proceedings.uploadDocument,
//               proceedings.pfmsPortalUploaded,
//               proceedings.dateOfDisbursement,
//             ];

//         db.query(query, values, (err) => (err ? reject(err) : resolve()));
//       });
//     });

//     // Handle Proceedings in proceedings_victim_relief - Update if exists, else Insert
//     const proceedingsPromise = new Promise((resolve, reject) => {
//       const checkQuery = `SELECT COUNT(*) as count FROM proceedings_victim_relief WHERE fir_id = ?`;

//       db.query(checkQuery, [firId], (err, results) => {
//         if (err) return reject(err);

//         const exists = results[0].count > 0;

//         const query = exists
//           ? `UPDATE proceedings_victim_relief 
//              SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, proceedings_file = ? 
//              WHERE fir_id = ?`
//           : `INSERT INTO proceedings_victim_relief 
//              (proceedings_id, fir_id, total_compensation, proceedings_file_no, proceedings_date, proceedings_file) 
//              VALUES (?, ?, ?, ?, ?, ?)`;

//         const values = exists
//           ? [
//               proceedings.totalCompensation || 0.0,
//               proceedings.fileNo,
//               proceedings.fileDate,
//               proceedings.uploadDocument,
//               firId,
//             ]
//           : [
//               generateRandomId(6), // Generate new ID
//               firId,
//               proceedings.totalCompensation || 0.0,
//               proceedings.fileNo,
//               proceedings.fileDate,
//               proceedings.uploadDocument,
//             ];

//         db.query(query, values, (err) => (err ? reject(err) : resolve()));
//       });
//     });

//     // Update FIR Status
//     const updateFirStatus = new Promise((resolve, reject) => {
//       const query = `UPDATE fir_add SET relief_status = ? WHERE fir_id = ?`;
//       const values = [1, firId];

//       db.query(query, values, (err) => (err ? reject(err) : resolve()));
//     });

//     // Execute all queries within the transaction
//     Promise.all([...victimPromises, proceedingsPromiseFirst, proceedingsPromise, updateFirStatus])
//       .then(() => {
//         db.commit((err) => {
//           if (err) {
//             return db.rollback(() => res.status(500).json({ message: 'Commit error', error: err }));
//           }
//           res.status(200).json({ message: 'First Installment Details Saved/Updated and FIR status updated successfully.' });
//         });
//       })
//       .catch((err) => {
//         db.rollback(() => res.status(500).json({ message: 'Transaction failed', error: err }));
//       });
//   });
// };



exports.saveFirstInstallment = (req, res) => {
  const { firId, victims, proceedings, saveDraft } = req.body;

  if (!firId || !victims || !proceedings) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  // Get a connection from the pool
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: 'Database connection error', error: err });
    }

    // Begin transaction on the connection
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Transaction error', error: err });
      }

      // Handle Victims - Update if exists, else Insert
      const victimPromises = victims.map((victim) => {
        return new Promise((resolve, reject) => {
          const checkQuery = `SELECT COUNT(*) as count FROM victim_relief_first WHERE victim_id = ? AND fir_id = ?`;
          
          connection.query(checkQuery, [victim.victimId, firId], (err, results) => {
            if (err) return reject(err);

            const exists = results[0].count > 0;

            const query = exists
              ? `UPDATE victim_relief_first 
                 SET victim_id = ?, relief_id = ?, victim_name = ?, bank_account_number = ?, ifsc_code = ?, bank_name = ?, 
                     relief_amount_scst = ?, relief_amount_exgratia = ?, relief_amount_first_stage = ?
                 WHERE victim_relif_id = ? AND fir_id = ?`
              : `INSERT INTO victim_relief_first 
                 (victim_relif_id, victim_id, relief_id, fir_id, victim_name, bank_account_number, ifsc_code, bank_name, 
                  relief_amount_scst, relief_amount_exgratia, relief_amount_first_stage) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = exists
              ? [
                  victim.victimId,
                  victim.reliefId,
                  victim.victimName || null,
                  victim.bankAccountNumber || null,
                  victim.ifscCode || null,
                  victim.bankName || null,
                  victim.reliefAmountScst || 0,
                  victim.reliefAmountExGratia || 0,
                  victim.reliefAmountFirstStage || 0,
                  victim.victimReliefId || null,
                  firId,
                ]
              : [
                  victim.victimReliefId || generateRandomId(6), // Generate ID if not provided
                  victim.victimId,
                  victim.reliefId || null,
                  firId,
                  victim.victimName || null,
                  victim.bankAccountNumber || null,
                  victim.ifscCode || null,
                  victim.bankName || null,
                  victim.reliefAmountScst || 0,
                  victim.reliefAmountExGratia || 0,
                  victim.reliefAmountFirstStage || 0,
                ];

            connection.query(query, values, (err) => (err ? reject(err) : resolve()));
          });
        });
      });

      // Handle Proceedings - Update if exists, else Insert
      const proceedingsPromiseFirst = new Promise((resolve, reject) => {
        const checkQuery = `SELECT COUNT(*) as count FROM proceedings_victim_relief_first WHERE fir_id = ?`;

        connection.query(checkQuery, [firId], (err, results) => {
          if (err) return reject(err);

          const exists = results[0].count > 0;

          const query = exists
            ? `UPDATE proceedings_victim_relief_first 
               SET proceedings_file_no = ?, proceedings_date = ?, proceedings_file = ?, pfms_portal_uploaded = ?, date_of_disbursement = ?
               WHERE fir_id = ?`
            : `INSERT INTO proceedings_victim_relief_first 
               (proceeding_id, fir_id, proceedings_file_no, proceedings_date, proceedings_file, pfms_portal_uploaded, date_of_disbursement) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

          const values = exists
            ? [
                proceedings.fileNo || null,
                proceedings.fileDate || null,
                proceedings.uploadDocument || null,
                proceedings.pfmsPortalUploaded || null,
                proceedings.dateOfDisbursement || null,
                firId,
              ]
            : [
                generateRandomId(6), // Generate new ID
                firId,
                proceedings.fileNo || null,
                proceedings.fileDate || null,
                proceedings.uploadDocument || null,
                proceedings.pfmsPortalUploaded || null,
                proceedings.dateOfDisbursement || null,
              ];

          connection.query(query, values, (err) => (err ? reject(err) : resolve()));
        });
      });

      // Handle Proceedings in proceedings_victim_relief - Update if exists, else Insert
      // const proceedingsPromise = new Promise((resolve, reject) => {
      //   const checkQuery = `SELECT COUNT(*) as count FROM proceedings_victim_relief WHERE fir_id = ?`;

      //   connection.query(checkQuery, [firId], (err, results) => {
      //     if (err) return reject(err);

      //     const exists = results[0].count > 0;

      //     const query = exists
      //       ? `UPDATE proceedings_victim_relief 
      //          SET total_compensation = ?, proceedings_file_no = ?, proceedings_date = ?, proceedings_file = ? 
      //          WHERE fir_id = ?`
      //       : `INSERT INTO proceedings_victim_relief 
      //          (proceedings_id, fir_id, total_compensation, proceedings_file_no, proceedings_date, proceedings_file) 
      //          VALUES (?, ?, ?, ?, ?, ?)`;

      //     const values = exists
      //       ? [
      //           proceedings.totalCompensation || 0.0,
      //           proceedings.fileNo || null,
      //           proceedings.fileDate || null,
      //           proceedings.uploadDocument || null,
      //           firId,
      //         ]
      //       : [
      //           generateRandomId(6), // Generate new ID
      //           firId,
      //           proceedings.totalCompensation || 0.0,
      //           proceedings.fileNo || null,
      //           proceedings.fileDate || null,
      //           proceedings.uploadDocument || null,
      //         ];

      //     connection.query(query, values, (err) => (err ? reject(err) : resolve()));
      //   });
      // }); commented on 19-jul-25 by Mohan

      // Update FIR Status
      const updateFirStatus = new Promise((resolve, reject) => {
        const query = `UPDATE fir_add SET relief_status = ? WHERE fir_id = ?`;
        const values = [saveDraft ? 0 : 1, firId];

        connection.query(query, values, (err) => (err ? reject(err) : resolve()));
      });

      // Execute all queries within the transaction
      Promise.all([...victimPromises, proceedingsPromiseFirst, updateFirStatus])
        .then(() => {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: 'Commit error', error: err });
              });
            }
            connection.release();
            res.status(200).json({ message: 'First Installment Details Saved/Updated and FIR status updated successfully.' });
          });
        })
        .catch((err) => {
          connection.rollback(() => {
            connection.release();
            res.status(500).json({ message: 'Transaction failed', error: err });
          });
        });
    });
  });
};


exports.getVictimsReliefDetails_1 = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

  const query = `
    SELECT
      vrf.relief_amount_scst as p1, vrf.relief_amount_exgratia as p2, vrf.relief_amount_first_stage, vr.victim_id AS victimId, vr.relief_id AS reliefId, vm.victim_name AS victimName, vr.relief_amount_scst AS firstInstallmentReliefScst, vr.relief_amount_exgratia AS firstInstallmentReliefExGratia , vrf.victim_relif_id, vrf.bank_account_number as firstInstallmentBankAccountNumber, vrf.ifsc_code as firstInstallmentIfscCode, vrf.bank_name as firstInstallmentBankName FROM victim_relief vr
      left join victim_relief_first vrf on vrf.victim_id = vr.victim_id
      left join victims vm on vm.victim_id = vr.victim_id
    WHERE vr.fir_id = ? and vm.delete_status = 0
  `;

  db.query(query, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch victim relief details', error: err });
    }

    return res.status(200).json({ victimsReliefDetails: results });
  });
};


exports.getTrialReliefDetails = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required' });
  }

  const query = `
    SELECT
    tsr.trialStageReliefAct as r1,
    tsr.trialStageReliefGovernment as r2,
    tsr.trialStageReliefTotal as r3,
      tr.trial_id AS trialId,
      tr.victim_id AS victimId,
      tr.fir_id AS firId,
      vm.victim_name AS victimName,
      tr.relief_amount_act AS reliefAmountAct,
      tr.relief_amount_government AS reliefAmountGovernment,
      tr.relief_amount_final_stage AS reliefAmountFinalStage
    FROM trial_relief tr
    left join victims vm on vm.victim_id = tr.victim_id
    left join trial_stage_relief tsr on tsr.victim_id = tr.victim_id

    WHERE tr.fir_id = ? and vm.delete_status = 0
  `;

  db.query(query, [firId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch trial relief details', error: err });
    }

    return res.status(200).json({ trialReliefDetails: results });
  });
};


exports.getSecondInstallmentDetails = (req, res) => {
  const { firId } = req.params;

  if (!firId) {
    return res.status(400).json({ message: 'FIR ID is required.' });
  }

  const query = `
    SELECT DISTINCT
      cv.fir_id, 
      cv.victim_id, 
      cv.chargesheet_id, 
      vm.victim_name AS secondInstallmentVictimName,
      cv.relief_amount_scst_1 AS secondInstallmentReliefScst, 
      cv.relief_amount_ex_gratia_1 AS secondInstallmentReliefExGratia, 
      cv.relief_amount_second_stage AS secondInstallmentTotalRelief,
      vrs.secondInstallmentReliefScst as q1,
      vrs.secondInstallmentReliefExGratia as q2,
      vrs.secondInstallmentReliefExGratia as q3,
      vrs.victim_chargesheet_id
    FROM chargesheet_victims cv
    left join victim_relief_second vrs on vrs.fir_id = cv.fir_id AND vrs.victim_id = cv.victim_id
    left join victims vm on vm.victim_id = cv.victim_id
    WHERE cv.fir_id = ? and vm.delete_status = 0
  `;

  db.query(query, [firId], (err, results) => {
    if (err) {
      console.error('Error fetching second installment details:', err);
      return res.status(500).json({ message: 'Failed to fetch second installment details.', error: err });
    }

    res.status(200).json({ victims: results });
  });
};


// exports.saveSecondInstallment = (req, res) => {
//   const { firId, victims, proceedings } = req.body;

//   if (!firId || !victims || !proceedings) {
//     return res.status(400).json({ message: "Missing required fields." });
//   }

//   db.beginTransaction((err) => {
//     if (err) return res.status(500).json({ message: "Transaction error", error: err });

//     // Handle Victims - Update if exists, else Insert
//     const victimPromises = victims.map((victim) => {
//       return new Promise((resolve, reject) => {
//         const checkQuery = `SELECT victim_chargesheet_id FROM victim_relief_second WHERE victim_chargesheet_id = ? AND fir_id = ?`;

//         db.query(checkQuery, [victim.victimChargesheetId, firId], (err, results) => {
//           if (err) return reject(err);

//           const exists = results.length > 0;
//           const victimChargesheetId = exists ? victim.victimChargesheetId : generateRandomId(10);;

//           const query = exists
//             ? `UPDATE victim_relief_second 
//                SET victim_id = ?, chargesheet_id = ?, victim_name = ?, 
//                    secondInstallmentReliefScst = ?, secondInstallmentReliefExGratia = ?, secondInstallmentTotalRelief = ?
//                WHERE victim_chargesheet_id = ? AND fir_id = ?`
//             : `INSERT INTO victim_relief_second 
//                (victim_chargesheet_id, victim_id, chargesheet_id, fir_id, victim_name, 
//                 secondInstallmentReliefScst, secondInstallmentReliefExGratia, secondInstallmentTotalRelief) 
//                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//           const values = exists
//             ? [
//                 victim.victimId,
//                 victim.chargesheetId,
//                 victim.victimName,
//                 victim.secondInstallmentReliefScst || 0,
//                 victim.secondInstallmentReliefExGratia || 0,
//                 victim.secondInstallmentTotalRelief || 0,
//                 victimChargesheetId,
//                 firId,
//               ]
//             : [
//                 victimChargesheetId,
//                 victim.victimId,
//                 victim.chargesheetId,
//                 firId,
//                 victim.victimName,
//                 victim.secondInstallmentReliefScst || 0,
//                 victim.secondInstallmentReliefExGratia || 0,
//                 victim.secondInstallmentTotalRelief || 0,
//               ];

//           db.query(query, values, (err) => (err ? reject(err) : resolve()));
//         });
//       });
//     });

//     // Handle Proceedings - Update if exists, else Insert
//     const proceedingsPromise = new Promise((resolve, reject) => {
//       const checkQuery = `SELECT COUNT(*) as count FROM second_installment_proceedings WHERE fir_id = ?`;

//       db.query(checkQuery, [firId], (err, results) => {
//         if (err) return reject(err);

//         const exists = results[0].count > 0;

//         const query = exists
//           ? `UPDATE second_installment_proceedings 
//              SET file_number = ?, file_date = ?, upload_document = ?, 
//                  pfms_portal_uploaded = ?, date_of_disbursement = ?
//              WHERE fir_id = ?`
//           : `INSERT INTO second_installment_proceedings 
//              (fir_id, file_number, file_date, upload_document, pfms_portal_uploaded, date_of_disbursement) 
//              VALUES (?, ?, ?, ?, ?, ?)`;

//         const values = exists
//           ? [
//               proceedings.fileNumber,
//               proceedings.fileDate,
//               proceedings.uploadDocument || null,
//               proceedings.pfmsPortalUploaded,
//               proceedings.dateOfDisbursement,
//               firId,
//             ]
//           : [
//               firId,
//               proceedings.fileNumber,
//               proceedings.fileDate,
//               proceedings.uploadDocument || null,
//               proceedings.pfmsPortalUploaded,
//               proceedings.dateOfDisbursement,
//             ];

//         db.query(query, values, (err) => (err ? reject(err) : resolve()));
//       });
//     });

//     // Update FIR Status
//     const updateFirStatus = new Promise((resolve, reject) => {
//       const query = `UPDATE fir_add SET relief_status = ? WHERE fir_id = ?`;
//       const values = [2, firId];

//       db.query(query, values, (err) => (err ? reject(err) : resolve()));
//     });

//     // Execute all queries within the transaction
//     Promise.all([...victimPromises, proceedingsPromise, updateFirStatus])
//       .then(() => {
//         db.commit((err) => {
//           if (err) {
//             return db.rollback(() => res.status(500).json({ message: "Commit error", error: err }));
//           }
//           res.status(200).json({ message: "Second Installment Details Saved/Updated and FIR status updated successfully." });
//         });
//       })
//       .catch((err) => {
//         db.rollback(() => res.status(500).json({ message: "Transaction failed", error: err }));
//       });
//   });
// };

exports.saveSecondInstallment = (req, res) => {
  const { firId, victims, proceedings, saveDraft } = req.body;

  if (!firId || !victims || !proceedings) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // Get a connection from the pool
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: 'Database connection error', error: err });
    }

    // Begin transaction on the connection
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Transaction error", error: err });
      }

      // Handle Victims - Update if exists, else Insert
      const victimPromises = victims.map((victim) => {
        return new Promise((resolve, reject) => {
          const checkQuery = `SELECT victim_chargesheet_id FROM victim_relief_second WHERE victim_id = ? AND fir_id = ?`;

          connection.query(checkQuery, [victim.victimId, firId], (err, results) => {
            if (err) return reject(err);

            const exists = results.length > 0;
            const victimChargesheetId = exists ? victim.victimChargesheetId : generateRandomId(10);

            const query = exists
              ? `UPDATE victim_relief_second 
                 SET victim_id = ?, chargesheet_id = ?, victim_name = ?, 
                     secondInstallmentReliefScst = ?, secondInstallmentReliefExGratia = ?, secondInstallmentTotalRelief = ?
                 WHERE victim_chargesheet_id = ? AND fir_id = ?`
              : `INSERT INTO victim_relief_second 
                 (victim_chargesheet_id, victim_id, chargesheet_id, fir_id, victim_name, 
                  secondInstallmentReliefScst, secondInstallmentReliefExGratia, secondInstallmentTotalRelief) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = exists
              ? [
                  victim.victimId,
                  victim.chargesheetId || null,
                  victim.victimName || null,
                  victim.secondInstallmentReliefScst || 0,
                  victim.secondInstallmentReliefExGratia || 0,
                  victim.secondInstallmentTotalRelief || 0,
                  victimChargesheetId || null,
                  firId,
                ]
              : [
                  victimChargesheetId || null,
                  victim.victimId,
                  victim.chargesheetId || null,
                  firId,
                  victim.victimName || null,
                  victim.secondInstallmentReliefScst || 0,
                  victim.secondInstallmentReliefExGratia || 0,
                  victim.secondInstallmentTotalRelief || 0,
                ];

            connection.query(query, values, (err) => (err ? reject(err) : resolve()));
          });
        });
      });

      // Handle Proceedings - Update if exists, else Insert
      const proceedingsPromise = new Promise((resolve, reject) => {
        const checkQuery = `SELECT COUNT(*) as count FROM second_installment_proceedings WHERE fir_id = ?`;

        connection.query(checkQuery, [firId], (err, results) => {
          if (err) return reject(err);

          const exists = results[0].count > 0;

          const query = exists
            ? `UPDATE second_installment_proceedings 
               SET file_number = ?, file_date = ?, upload_document = ?, 
                   pfms_portal_uploaded = ?, date_of_disbursement = ?
               WHERE fir_id = ?`
            : `INSERT INTO second_installment_proceedings 
               (fir_id, file_number, file_date, upload_document, pfms_portal_uploaded, date_of_disbursement) 
               VALUES (?, ?, ?, ?, ?, ?)`;

          const values = exists
            ? [
                proceedings.fileNumber || null,
                proceedings.fileDate || null,
                proceedings.uploadDocument || null,
                proceedings.pfmsPortalUploaded || null,
                proceedings.dateOfDisbursement || null,
                firId,
              ]
            : [
                firId,
                proceedings.fileNumber || null,
                proceedings.fileDate || null,
                proceedings.uploadDocument || null,
                proceedings.pfmsPortalUploaded || null,
                proceedings.dateOfDisbursement || null,
              ];

          connection.query(query, values, (err) => (err ? reject(err) : resolve()));
        });
      });

      // Update FIR Status
      const updateFirStatus = new Promise((resolve, reject) => {
        const query = `UPDATE fir_add SET relief_status = ? WHERE fir_id = ?`;
        const values = [saveDraft ? 1 : 2, firId];

        connection.query(query, values, (err) => (err ? reject(err) : resolve()));
      });

      // Execute all queries within the transaction
      Promise.all([...victimPromises, proceedingsPromise, updateFirStatus])
        .then(() => {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: "Commit error", error: err });
              });
            }
            connection.release();
            res.status(200).json({ message: "Second Installment Details Saved/Updated and FIR status updated successfully." });
          });
        })
        .catch((err) => {
          connection.rollback(() => {
            connection.release();
            res.status(500).json({ message: "Transaction failed", error: err });
          });
        });
    });
  });
};


// exports.saveThirdInstallmentDetails = (req, res) => {
//   const { firId, victims, proceedings } = req.body;

//   if (!firId || !victims || !proceedings) {
//     return res.status(400).json({ message: "Missing required fields." });
//   }

//   db.beginTransaction((err) => {
//     if (err) return res.status(500).json({ message: "Transaction error", error: err });

//     // Handle Victims - Update if exists, else Insert
//     const victimPromises = victims.map((victim) => {
//       return new Promise((resolve, reject) => {
//         const checkQuery = `SELECT trial_stage_id FROM trial_stage_relief WHERE trial_id = ? AND fir_id = ?`;

//         db.query(checkQuery, [victim.trialId, firId], (err, results) => {
//           if (err) return reject(err);

//           const trialStageId = results.length > 0 ? results[0].trial_stage_id : generateRandomId(10);
//           console.log('trialStageId',trialStageId)
//           console.log('checkQuery',checkQuery)
//           console.log('results',results)

//           const query = results.length > 0
//             ? `UPDATE trial_stage_relief 
//                SET victim_id = ?, trial_id = ?, victim_name = ?, 
//                    trialStageReliefAct = ?, trialStageReliefGovernment = ?, trialStageReliefTotal = ?
//                WHERE trial_stage_id = ? AND fir_id = ?`
//             : `INSERT INTO trial_stage_relief 
//                (trial_stage_id, victim_id, trial_id, fir_id, victim_name, 
//                 trialStageReliefAct, trialStageReliefGovernment, trialStageReliefTotal) 
//                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//           const values = results.length > 0
//             ? [
//                 victim.victimId,
//                 victim.trialId,
//                 victim.victimName,
//                 victim.thirdInstallmentReliefAct || 0,
//                 victim.thirdInstallmentReliefGovernment || 0,
//                 victim.thirdInstallmentReliefTotal || 0,
//                 trialStageId,
//                 firId,
//               ]
//             : [
//                 trialStageId,
//                 victim.victimId,
//                 victim.trialId,
//                 firId,
//                 victim.victimName,
//                 victim.thirdInstallmentReliefAct || 0,
//                 victim.thirdInstallmentReliefGovernment || 0,
//                 victim.thirdInstallmentReliefTotal || 0,
//               ];

//           db.query(query, values, (err) => (err ? reject(err) : resolve()));
//         });
//       });
//     });

//     // Handle Proceedings - Update if exists, else Insert
//     const proceedingsPromise = new Promise((resolve, reject) => {
//       const checkQuery = `SELECT COUNT(*) as count FROM trial_proceedings WHERE fir_id = ? AND trial_id = ?`;

//       db.query(checkQuery, [firId,proceedings.trialId], (err, results) => {
//         if (err) return reject(err);

//         const exists = results[0].count > 0;

//         const query = exists
//           ? `UPDATE trial_proceedings 
//              SET file_number = ?, file_date = ?, upload_document = ?, 
//                  pfms_portal_uploaded = ?, date_of_disbursement = ?
//              WHERE fir_id = ? AND trial_id = ? `
//           : `INSERT INTO trial_proceedings 
//              (trial_id, fir_id, file_number, file_date, upload_document, pfms_portal_uploaded, date_of_disbursement) 
//              VALUES (?, ?, ?, ?, ?, ?, ?)`;

//         const values = exists
//           ? [
//               proceedings.fileNumber,
//               proceedings.fileDate,
//               proceedings.uploadDocument || null,
//               proceedings.pfmsPortalUploaded,
//               proceedings.dateOfDisbursement,
//               firId,
//               proceedings.trialId,
//             ]
//           : [
//               proceedings.trialId,
//               firId,
//               proceedings.fileNumber,
//               proceedings.fileDate,
//               proceedings.uploadDocument || null,
//               proceedings.pfmsPortalUploaded,
//               proceedings.dateOfDisbursement,
//             ];

//         db.query(query, values, (err) => (err ? reject(err) : resolve()));
//       });
//     });

//     // Update FIR Status
//     const updateFirStatus = new Promise((resolve, reject) => {
//       const query = `UPDATE fir_add SET relief_status = ? WHERE fir_id = ?`;
//       const values = [3, firId];

//       db.query(query, values, (err) => (err ? reject(err) : resolve()));
//     });

//     // Execute all queries within the transaction
//     Promise.all([...victimPromises, proceedingsPromise, updateFirStatus])
//       .then(() => {
//         db.commit((err) => {
//           if (err) {
//             return db.rollback(() => res.status(500).json({ message: "Commit error", error: err }));
//           }
//           res.status(200).json({ message: "Third Installment Details Saved/Updated and FIR status updated successfully." });
//         });
//       })
//       .catch((err) => {
//         db.rollback(() => res.status(500).json({ message: "Transaction failed", error: err }));
//       });
//   });
// };


// exports.saveThirdInstallmentDetails = (req, res) => {
//   const { firId, victims, proceedings } = req.body;

//   if (!firId || !victims || !proceedings) {
//     return res.status(400).json({ message: "Missing required fields." });
//   }

//   // Get a connection from the pool
//   db.getConnection((err, connection) => {
//     if (err) {
//       return res.status(500).json({ message: 'Database connection error', error: err });
//     }

//     // Begin transaction on the connection
//     connection.beginTransaction((err) => {
//       if (err) {
//         connection.release();
//         return res.status(500).json({ message: "Transaction error", error: err });
//       }

//       // Handle Victims - Update if exists, else Insert
//       const victimPromises = victims.map((victim) => {
//         return new Promise((resolve, reject) => {
//           const checkQuery = `SELECT id FROM trial_stage_relief WHERE victim_id = ? AND fir_id = ?`;

//           connection.query(checkQuery, [victim.victimId, firId], (err, results) => {
//             if (err) return reject(err);

//             const trialStageId = results.length > 0 ? results[0].trial_stage_id : generateRandomId(10);
//             console.log('trialStageId', trialStageId);
//             console.log('checkQuery', checkQuery);
//             console.log('results', results);

//             const query = results.length > 0
//               ? `UPDATE trial_stage_relief 
//                  SET victim_id = ?, trial_id = ?, victim_name = ?, 
//                      trialStageReliefAct = ?, trialStageReliefGovernment = ?, trialStageReliefTotal = ?
//                  WHERE trial_stage_id = ? AND fir_id = ?`
//               : `INSERT INTO trial_stage_relief 
//                  (trial_stage_id, victim_id, trial_id, fir_id, victim_name, 
//                   trialStageReliefAct, trialStageReliefGovernment, trialStageReliefTotal) 
//                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//             const values = results.length > 0
//               ? [
//                   victim.victimId,
//                   victim.trialId || null,
//                   victim.victimName || null,
//                   victim.thirdInstallmentReliefAct || 0,
//                   victim.thirdInstallmentReliefGovernment || 0,
//                   victim.thirdInstallmentReliefTotal || 0,
//                   trialStageId || null,
//                   firId,
//                 ]
//               : [
//                   trialStageId || null,
//                   victim.victimId,
//                   victim.trialId || null,
//                   firId,
//                   victim.victimName || null,
//                   victim.thirdInstallmentReliefAct || 0,
//                   victim.thirdInstallmentReliefGovernment || 0,
//                   victim.thirdInstallmentReliefTotal || 0,
//                 ];

//             connection.query(query, values, (err) => (err ? reject(err) : resolve()));
//           });
//         });
//       });

//       // Handle Proceedings - Update if exists, else Insert
//       const proceedingsPromise = new Promise((resolve, reject) => {
//         const checkQuery = `SELECT COUNT(*) as count FROM trial_proceedings WHERE fir_id = ?`;

//         connection.query(checkQuery, [firId], (err, results) => {
//           if (err) return reject(err);

//           const exists = results[0].count > 0;

//           const query = exists
//             ? `UPDATE trial_proceedings 
//                SET file_number = ?, file_date = ?, upload_document = ?, 
//                    pfms_portal_uploaded = ?, date_of_disbursement = ?
//                WHERE fir_id = ? AND trial_id = ?`
//             : `INSERT INTO trial_proceedings 
//                (trial_id, fir_id, file_number, file_date, upload_document, pfms_portal_uploaded, date_of_disbursement) 
//                VALUES (?, ?, ?, ?, ?, ?, ?)`;

//           const values = exists
//             ? [
//                 proceedings.fileNumber || null,
//                 proceedings.fileDate || null,
//                 proceedings.uploadDocument || null,
//                 proceedings.pfmsPortalUploaded || null,
//                 proceedings.dateOfDisbursement || null,
//                 firId,
//                 proceedings.trialId || null,
//               ]
//             : [
//                 proceedings.trialId || null,
//                 firId,
//                 proceedings.fileNumber || null,
//                 proceedings.fileDate || null,
//                 proceedings.uploadDocument || null,
//                 proceedings.pfmsPortalUploaded || null,
//                 proceedings.dateOfDisbursement || null,
//               ];

//           connection.query(query, values, (err) => (err ? reject(err) : resolve()));
//         });
//       });

//       // Update FIR Status
//       const updateFirStatus = new Promise((resolve, reject) => {
//         const query = `UPDATE fir_add SET relief_status = ? WHERE fir_id = ?`;
//         const values = [3, firId];

//         connection.query(query, values, (err) => (err ? reject(err) : resolve()));
//       });

//       // Execute all queries within the transaction
//       Promise.all([...victimPromises, proceedingsPromise, updateFirStatus])
//         .then(() => {
//           connection.commit((err) => {
//             if (err) {
//               return connection.rollback(() => {
//                 connection.release();
//                 res.status(500).json({ message: "Commit error", error: err });
//               });
//             }
//             connection.release();
//             res.status(200).json({ message: "Third Installment Details Saved/Updated and FIR status updated successfully." });
//           });
//         })
//         .catch((err) => {
//           connection.rollback(() => {
//             connection.release();
//             res.status(500).json({ message: "Transaction failed", error: err });
//           });
//         });
//     });
//   });
// };


exports.saveThirdInstallmentDetails = (req, res) => {
  const { firId, victims, proceedings, saveDraft } = req.body;

  if (!firId || !victims || !proceedings) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Database connection error', error: err });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Transaction error", error: err });
      }

      const victimPromises = victims.map((victim) => {
        return new Promise((resolve, reject) => {
          const checkQuery = `SELECT id, trial_stage_id FROM trial_stage_relief WHERE victim_id = ? AND fir_id = ?`;

          connection.query(checkQuery, [victim.victimId, firId], (err, results) => {
            if (err) return reject(err);

            const trialStageId = results.length > 0 ? results[0].trial_stage_id : generateRandomId(10);
            const query = results.length > 0
              ? `UPDATE trial_stage_relief 
                 SET trial_id = ?, victim_name = ?, 
                     trialStageReliefAct = ?, trialStageReliefGovernment = ?, trialStageReliefTotal = ?
                 WHERE trial_stage_id = ? AND fir_id = ?`
              : `INSERT INTO trial_stage_relief 
                 (trial_stage_id, victim_id, trial_id, fir_id, victim_name, 
                  trialStageReliefAct, trialStageReliefGovernment, trialStageReliefTotal) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = results.length > 0
              ? [
                  victim.trialId || null,
                  victim.victimName || null,
                  victim.thirdInstallmentReliefAct || 0,
                  victim.thirdInstallmentReliefGovernment || 0,
                  victim.thirdInstallmentReliefTotal || 0,
                  trialStageId,
                  firId
                ]
              : [
                  trialStageId,
                  victim.victimId,
                  victim.trialId || null,
                  firId,
                  victim.victimName || null,
                  victim.thirdInstallmentReliefAct || 0,
                  victim.thirdInstallmentReliefGovernment || 0,
                  victim.thirdInstallmentReliefTotal || 0
                ];

            connection.query(query, values, (err) => (err ? reject(err) : resolve()));
          });
        });
      });

      const proceedingsPromise = new Promise((resolve, reject) => {
        const checkQuery = `SELECT COUNT(*) as count FROM trial_proceedings WHERE fir_id = ?`;

        connection.query(checkQuery, [firId], (err, results) => {
          if (err) return reject(err);

          const exists = results[0].count > 0;
          const query = exists
            ? `UPDATE trial_proceedings 
               SET file_number = ?, file_date = ?, upload_document = ?, 
                   pfms_portal_uploaded = ?, date_of_disbursement = ?
               WHERE fir_id = ?`
            : `INSERT INTO trial_proceedings 
               ( fir_id, file_number, file_date, upload_document, pfms_portal_uploaded, date_of_disbursement) 
               VALUES (?, ?, ?, ?, ?, ?)`;

          const values = exists
            ? [
                proceedings.fileNumber || null,
                proceedings.fileDate || null,
                proceedings.uploadDocument || null,
                proceedings.pfmsPortalUploaded || null,
                proceedings.dateOfDisbursement || null,
                firId,
              ]
            : [
                firId,
                proceedings.fileNumber || null,
                proceedings.fileDate || null,
                proceedings.uploadDocument || null,
                proceedings.pfmsPortalUploaded || null,
                proceedings.dateOfDisbursement || null
              ];

          connection.query(query, values, (err) => (err ? reject(err) : resolve()));
        });
      });

      const updateFirStatus = new Promise((resolve, reject) => {
        connection.query(
          `UPDATE fir_add SET relief_status = ? WHERE fir_id = ?`,
          [saveDraft ? 2 : 3, firId],
          (err) => (err ? reject(err) : resolve())
        );
      });

      Promise.all([...victimPromises, proceedingsPromise, updateFirStatus])
        .then(() => {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: "Commit error", error: err });
              });
            }
            connection.release();
            res.status(200).json({ message: "Third Installment Details Saved/Updated and FIR status updated successfully." });
          });
        })
        .catch((err) => {
          connection.rollback(() => {
            connection.release();
            res.status(500).json({ message: "Transaction failed", error: err });
          });
        });
    });
  });
};



exports.AllReliefDetails = async (req, res) => {
  const { firId } = req.body;
  console.log(req.body);

  if (!firId) {
    return res.status(400).json({ message: 'Fir Id is missing' });
  }

  try {
    // Define queries separately
    const firstInstallmentQuery = `SELECT id as pid, proceeding_id, proceedings_file_no, proceedings_date, proceedings_file, pfms_portal_uploaded , date_of_disbursement FROM proceedings_victim_relief_first WHERE fir_id = ?`;
    const secondInstallmentQuery = `SELECT id as pid, file_number, file_date, upload_document, pfms_portal_uploaded, date_of_disbursement FROM second_installment_proceedings WHERE fir_id = ?`;
    const trialProceedingsQuery = `SELECT id as pid, trial_id, file_number, file_date, upload_document, pfms_portal_uploaded, date_of_disbursement FROM trial_proceedings WHERE fir_id = ?`;

    // Execute all queries asynchronously
    const [firstInstallment, secondInstallment, trialProceedings] = await Promise.all([
      new Promise((resolve, reject) => {
        db.query(firstInstallmentQuery, [firId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(secondInstallmentQuery, [firId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(trialProceedingsQuery, [firId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
    ]);

    // Send response
    res.json({ firstInstallment, secondInstallment, trialProceedings });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Failed to fetch relief details', error });
  }
};








