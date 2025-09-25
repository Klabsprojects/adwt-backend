const db = require("../db"); // DB connection

// Fetches monthly report details from the database, including FIR information, victim details, chargesheet details, and report reasons for the current and previous month.


exports.getmonthlyreportdetail = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  const params = [];

  const addCondition = (sql, value, wildcard = false) => {
    conditions.push(sql);
    params.push(wildcard ? `%${value}%` : value);
  };

  const { search, district, police_zone, police_range, revenue_district, Offence_group,
          complaintReceivedType, start_date, end_date, UIPT, status, year, created_at, modified_at, 
          CreatedATstartDate, CreatedATendDate, ModifiedATstartDate, ModifiedATDate, legacy, 
          policeStation, caste, community, statusOfCase, sectionOfLaw, court, convictionType, 
          hasLegalObtained, caseFitForAppeal, filedBy, appealCourt, dataEntryStatus, 
          chargesheetFromDate, chargesheetToDate } = req.query;

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

  if (district) addCondition('fa.police_city = ?', district);
  if (police_zone) addCondition('fa.police_zone = ?', police_zone);
  if (police_range) addCondition('fa.police_range = ?', police_range);
  if (revenue_district) addCondition('fa.revenue_district = ?', revenue_district);
  if (Offence_group) addCondition('fa.Offence_group = ?', Offence_group);
  if (complaintReceivedType) addCondition('fa.complaintReceivedType = ?', complaintReceivedType);
  if (start_date) addCondition('DATE(fa.date_of_registration) >= ?', start_date);
  if (end_date) addCondition('DATE(fa.date_of_registration) <= ?', end_date);
  if (CreatedATstartDate) addCondition('DATE(fa.created_at) >= ?', CreatedATstartDate);
  if (CreatedATendDate) addCondition('DATE(fa.created_at) <= ?', CreatedATendDate);
  if (ModifiedATstartDate) addCondition('DATE(fa.updated_at) >= ?', ModifiedATstartDate);
  if (ModifiedATDate) addCondition('DATE(fa.updated_at) <= ?', ModifiedATDate);
  if (chargesheetFromDate) addCondition('DATE(chargesheet_details.chargesheetDate) >= ?', chargesheetFromDate);
  if (chargesheetToDate) addCondition('DATE(chargesheet_details.chargesheetDate) <= ?', chargesheetToDate);
  // if (created_at) addCondition('DATE_FORMAT(fa.created_at, "%Y-%m-%d") = ?', created_at);
  // if (modified_at) addCondition('DATE_FORMAT(fa.updated_at, "%Y-%m-%d") = ?', modified_at);
  //added by mohan02/aug/2025
  if (policeStation) addCondition('fa.police_station = ?', policeStation);

  let addingPTDetails = "";
  let addingCaseDetails = "";
  let addingChargeSheet = "";
  let addingAppealDetails = "";
  let addingOffenceActs = "";
  let groupByClause = "GROUP BY fa.fir_id";
  
  
  if (chargesheetFromDate || chargesheetToDate || 
    (statusOfCase && 
      (statusOfCase === "FirQuashed" || statusOfCase === "MF" || statusOfCase === "SectionDeleted" || statusOfCase === "Charge_Abated"))) {
  // Only once
    addingChargeSheet = `LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`;
   }
  if (statusOfCase) {
    if (statusOfCase === 'UI') {
      conditions.push('fa.status <= 5');
    } else if (statusOfCase === 'PT') {
      addingPTDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;

      conditions.push('fa.status >= 6');
      conditions.push(`case_details.judgement_awarded = 'no'`);
      conditions.push(`chargesheet_details.case_type = 'chargeSheet'`);
      
      //add case_details table judgement_awarded - "no" & chargesheet_details table - case_type = "chargeSheet"
    }
  }
  
  // 3. Conviction
  if (statusOfCase == "Convicted") {
    addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
    conditions.push(`case_details.judgementNature = 'Convicted'`);
  }

  // 4. Acquitted
  if (statusOfCase == "Acquitted") {
    addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
    conditions.push(`case_details.judgementNature = 'Acquitted'`);
  }

  // 5. FIR Quashed
  if (statusOfCase == "FirQuashed") {
    conditions.push(`chargesheet_details.case_type = 'firQuashed'`);
  }

  // 6. MF
  if (statusOfCase == "MF") {
    conditions.push(`(fa.HascaseMF = 1 OR chargesheet_details.case_type = 'referredChargeSheet')`);
  }

  // 7. Section Deleted (same as RCS)
  if (statusOfCase == "SectionDeleted") {
    conditions.push(`chargesheet_details.case_type = 'sectionDeleted'`);
  }

  // 8 & 9. Charge Abated / Quashed (Stage 7, judgementNature = Convicted)
  if (statusOfCase == "Charge_Abated") {
    addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
    conditions.push(`case_details.judgementNature = 'Charge_Abated'`);
  }

  if (statusOfCase == "Quashed") {
    addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
    conditions.push(`case_details.judgementNature = 'Quashed'`);
  }

  if (statusOfCase == "Appeal") {
    addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
    conditions.push(`case_details.judgementNature = 'Acquitted'`);
    addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`;
    conditions.push(`(appeal_details.filed_by IS NOT NULL AND appeal_details.filed_by <> '')`);
  }
  
  // Section of Law
  if (sectionOfLaw) {
    addingOffenceActs = `LEFT JOIN offence_acts ON offence_acts.group_code = fa.offence_group`;
    conditions.push(`offence_acts.group_code = '${sectionOfLaw}'`);
  }

  // Court
  if (court) {
    addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
    conditions.push(`case_details.court_name = '${court}'`);
  }

  // Conviction Type
  if (convictionType) {
    addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`;
    conditions.push(`case_details.Conviction_Type = '${convictionType}'`);
  }
 
  // Has Legal
  if (hasLegalObtained) {
    addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`;
    conditions.push(`appeal_details.legal_opinion_obtained = '${hasLegalObtained}'`);
  }

  // Fit for Appeal
  if (caseFitForAppeal) {
    addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`;
    conditions.push(`appeal_details.case_fit_for_appeal = '${caseFitForAppeal}'`);
  }

  // Filed By
  if (filedBy) {
    addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`;
    conditions.push(`appeal_details.filed_by = '${filedBy}'`);
  }

  // Appeal Court
  if (appealCourt) {
    addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`;
    conditions.push(`appeal_details.designated_court = '${appealCourt}'`);
  }

  if(caste || community){
    if(community) conditions.push(`v.community = '${community}'`);
    if(caste) conditions.push(`v.caste = '${caste}'`);
  }

  // Combine all joins
  let joins = [
    addingPTDetails,
    addingCaseDetails,
    addingChargeSheet,
    addingAppealDetails,
    addingOffenceActs
  ].filter(Boolean).join(" ");

  if (dataEntryStatus) {
      addCondition('fa.status = ?', dataEntryStatus);
  }

  if (year) addCondition('DATE_FORMAT(fa.date_of_registration, "%Y") = ?', year);

  if (legacy == "yes") {
    console.log("legacy", legacy);
    const legacyDate = '2025-03-20 09:18:11';
    addCondition('fa.created_at = ?', legacyDate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  if(caste || community){
    countQuery = `SELECT COUNT(*) AS total
    FROM (
      SELECT fa.fir_id
      FROM fir_add fa ${joins} ${whereClause} ${groupByClause} ) AS sub`;
  }
  else{
    countQuery = `SELECT COUNT(*) AS total FROM fir_add fa ${joins} ${whereClause} ${groupByClause}`;
  }
  
  try {
    db.query(countQuery, params, (err, countResults) => {
    if (err) return res.status(500).json({ message: 'Count query failed', error: err });
    console.log("countResults", countResults);
    //const total = countResults[0].total;
    const total = countResults.length != 0 ? countResults[0].total : 0;
    if (total === 0) {
      return res.status(200).json({ data: [], total: 0, page, pageSize, totalPages: 0 });
    }

    const totalPages = Math.ceil(total / pageSize);
    const validPage = Math.min(Math.max(1, page), totalPages);
    const validOffset = (validPage - 1) * pageSize;

    let query = `
      SELECT 
        fa.fir_id, 
        fa.police_city COLLATE utf8mb4_general_ci AS police_city,
        fa.police_station COLLATE utf8mb4_general_ci AS police_station,
        CONCAT(fa.fir_number, '/', fa.fir_number_suffix) AS fir_number,
        fa.number_of_victim, 
        fa.status, 
        fa.relief_status,
        v.community,
        v.caste,
        fa.police_zone,
        fa.revenue_district,
        fa.is_case_altered,
        fa.altered_date,
        us.name AS created_by, 
        DATE_FORMAT(fa.created_at, '%Y-%m-%d') AS created_at,
        DATE_FORMAT(fa.updated_at, '%Y-%m-%d') AS modified_at,
        DATE_FORMAT(fa.date_of_registration, '%Y-%m-%d') AS date_of_registration,
        DATE_FORMAT(rr.report_month, '%Y-%m-%d') AS report_month,

        GROUP_CONCAT(DISTINCT 
          REPLACE(REPLACE(v.offence_committed COLLATE utf8mb4_general_ci, '[', ''), ']', '') 
          ORDER BY v.victim_id DESC SEPARATOR ', ') AS offence_committed, 

        GROUP_CONCAT(DISTINCT 
          REPLACE(REPLACE(v.scst_sections COLLATE utf8mb4_general_ci, '[', ''), ']', '') 
          ORDER BY v.victim_id DESC SEPARATOR ', ') AS scst_sections,

        GROUP_CONCAT(DISTINCT cd.court_district COLLATE utf8mb4_general_ci ORDER BY cd.court_district SEPARATOR ', ') AS court_district, 
        GROUP_CONCAT(DISTINCT cd.court_name COLLATE utf8mb4_general_ci ORDER BY cd.court_name SEPARATOR ', ') AS court_name, 
        GROUP_CONCAT(DISTINCT cd.case_number COLLATE utf8mb4_general_ci ORDER BY cd.case_number SEPARATOR ', ') AS case_number,

        -- Latest report reason for current month
        (SELECT rr_inner.reason_for_status COLLATE utf8mb4_general_ci
        FROM report_reasons rr_inner 
        WHERE rr_inner.fir_id COLLATE utf8mb4_general_ci = fa.fir_id COLLATE utf8mb4_general_ci
          AND MONTH(rr_inner.report_month) = MONTH(CURDATE()) 
          AND YEAR(rr_inner.report_month) = YEAR(CURDATE()) 
        ORDER BY rr_inner.created_at DESC 
        LIMIT 1) AS current_month_reason_for_status,

        -- Latest report reason for previous month
        (SELECT rr_inner.reason_for_status COLLATE utf8mb4_general_ci
        FROM report_reasons rr_inner 
        WHERE rr_inner.fir_id COLLATE utf8mb4_general_ci = fa.fir_id COLLATE utf8mb4_general_ci
          AND MONTH(rr_inner.report_month) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
          AND YEAR(rr_inner.report_month) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
        ORDER BY rr_inner.created_at DESC 
        LIMIT 1) AS previous_month_reason_for_status,

        -- Trial or Investigation days
        CASE 
          WHEN fa.status >= 6 THEN DATEDIFF(CURDATE(), fa.date_of_registration)
          ELSE NULL 
        END AS pending_trial_case_days,

        CASE 
          WHEN fa.status <= 5 THEN DATEDIFF(CURDATE(), fa.date_of_registration)
          ELSE NULL 
        END AS under_investigation_case_days

      FROM fir_add fa
      LEFT JOIN victims v ON fa.fir_id = v.fir_id
      LEFT JOIN chargesheet_details cd ON fa.fir_id = cd.fir_id
      LEFT JOIN report_reasons rr ON fa.fir_id = rr.fir_id
      LEFT JOIN users us ON us.id = fa.created_by
      ${joins} ${whereClause} ${groupByClause}
      ORDER BY fa.created_at DESC;
    `;

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
  } catch (error) {
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};

//latest version
// exports.getmonthlyreportdetail = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;
//   const offset = (page - 1) * pageSize;

//   // Use a Map for conditions so we can dedupe SQL text AND keep params aligned
//   const conditionsMap = new Map(); // key: condition SQL, value: array of params (in order)
//   const joinsSet = new Set();      // dedupe joins
//   // baseParams will be flattened from conditionsMap later
//   const params = [];

//   // Helpers
//   const addCondition = (sql, value, wildcard = false) => {
//     if (!conditionsMap.has(sql)) {
//       if (value === undefined) conditionsMap.set(sql, []);
//       else conditionsMap.set(sql, [wildcard ? `%${value}%` : value]);
//     }
//   };

//   const addConditionMulti = (sql, values = [], wildcards = []) => {
//     if (!conditionsMap.has(sql)) {
//       const processed = values.map((v, i) => (wildcards[i] ? `%${v}%` : v));
//       conditionsMap.set(sql, processed);
//     }
//   };

//   // Destructure query params
//   const {
//     search, district, police_zone, police_range, revenue_district, Offence_group,
//     complaintReceivedType, start_date, end_date, UIPT, status, year, created_at, modified_at,
//     CreatedATstartDate, CreatedATendDate, ModifiedATstartDate, ModifiedATDate, legacy,
//     policeStation, caste, community, statusOfCase, sectionOfLaw, court, convictionType,
//     hasLegalObtained, caseFitForAppeal, filedBy, appealCourt, dataEntryStatus,
//     chargesheetFromDate, chargesheetToDate
//   } = req.query;

//   /* ---------------------
//     Basic filters
//     --------------------- */
//   if (search) {
//     const searchSql = `(
//       fa.fir_id LIKE ? OR
//       CONCAT(fa.fir_number, '/', fa.fir_number_suffix) = ? OR
//       fa.revenue_district LIKE ? OR
//       fa.police_city LIKE ? OR
//       fa.police_station LIKE ?
//     )`;
//     addConditionMulti(searchSql,
//       [`%${search}%`, search, `%${search}%`, `%${search}%`, `%${search}%`],
//       [true, false, true, true, true]
//     );
//   }

//   if (district) addCondition('fa.police_city = ?', district);
//   if (police_zone) addCondition('fa.police_zone = ?', police_zone);
//   if (police_range) addCondition('fa.police_range = ?', police_range);
//   if (revenue_district) addCondition('fa.revenue_district = ?', revenue_district);
//   if (Offence_group) addCondition('fa.Offence_group = ?', Offence_group);
//   if (complaintReceivedType) addCondition('fa.complaintReceivedType = ?', complaintReceivedType);
//   if (start_date) addCondition('DATE(fa.date_of_registration) >= ?', start_date);
//   if (end_date) addCondition('DATE(fa.date_of_registration) <= ?', end_date);
//   if (CreatedATstartDate) addCondition('DATE(fa.created_at) >= ?', CreatedATstartDate);
//   if (CreatedATendDate) addCondition('DATE(fa.created_at) <= ?', CreatedATendDate);
//   if (ModifiedATstartDate) addCondition('DATE(fa.updated_at) >= ?', ModifiedATstartDate);
//   if (ModifiedATDate) addCondition('DATE(fa.updated_at) <= ?', ModifiedATDate);
//   if (policeStation) addCondition('fa.police_station = ?', policeStation);

//   // NOTE: chargesheet fields use alias `cd` (the main query already LEFT JOINs chargesheet_details AS cd)
//   if (chargesheetFromDate) addCondition('DATE(cd.chargesheetDate) >= ?', chargesheetFromDate);
//   if (chargesheetToDate) addCondition('DATE(cd.chargesheetDate) <= ?', chargesheetToDate);

//   /* ---------------------
//     statusOfCase logic
//     --------------------- */
//   if (statusOfCase === 'UI') {
//     addCondition('fa.status <= 5');
//   }

//   if (statusOfCase === 'PT') {
//     // need case_details and chargesheet (cd already present)
//     joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//     addCondition('fa.status >= 6');
//     addCondition(`case_details.judgement_awarded = 'no'`);
//     addCondition(`cd.case_type = 'chargeSheet'`);
//   }

//   if (statusOfCase === "Convicted") {
//     joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//     addCondition(`case_details.judgementNature = 'Convicted'`);
//   }

//   if (statusOfCase === "Acquitted") {
//     joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//     addCondition(`case_details.judgementNature = 'Acquitted'`);
//   }

//   if (statusOfCase === "FirQuashed") {
//     addCondition(`cd.case_type = 'firQuashed'`);
//   }

//   if (statusOfCase === "MF") {
//     // MF => flagged in fa.HascaseMF or cd.case_type = 'referredChargeSheet'
//     addCondition(`(fa.HascaseMF = 1 OR cd.case_type = 'referredChargeSheet')`);
//   }

//   if (statusOfCase === "SectionDeleted") {
//     addCondition(`cd.case_type = 'sectionDeleted'`);
//   }

//   if (statusOfCase == "Charge_Abated") {
//     joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//     addCondition(`case_details.judgementNature = 'Charge_Abated'`);
//   }

//   if (statusOfCase == "Quashed") {
//     joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//     addCondition(`case_details.judgementNature = 'Quashed'`);
//   }

//   /* ---------------------
//     Section of law / court / conviction type
//     --------------------- */
//   if (sectionOfLaw) {
//     joinsSet.add(`LEFT JOIN offence_acts ON offence_acts.group_code = fa.offence_group`);
//     addCondition(`offence_acts.group_code = ?`, sectionOfLaw);
//   }

//   if (court) {
//     joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//     addCondition(`case_details.court_name = ?`, court);
//   }
//   if (convictionType) {
//     joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//     addCondition(`case_details.Conviction_Type = ?`, convictionType);
//   }

//   /* ---------------------
//     Appeal-related filters
//     --------------------- */
//   if (hasLegalObtained) {
//     joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`);
//     addCondition(`appeal_details.legal_opinion_obtained = ?`, hasLegalObtained);
//   }
//   if (caseFitForAppeal) {
//     joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`);
//     addCondition(`appeal_details.case_fit_for_appeal = ?`, caseFitForAppeal);
//   }
//   if (filedBy) {
//     joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`);
//     addCondition(`appeal_details.filed_by = ?`, filedBy);
//   }
//   if (appealCourt) {
//     joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`);
//     addCondition(`appeal_details.designated_court = ?`, appealCourt);
//   }

//   /* ---------------------
//     Victim filters (caste/community)
//     --------------------- */
//   let groupByClause = "GROUP BY fa.fir_id";
//   if (caste || community) {
//     // note: main SELECT uses v alias for victims, but we already join v below in the final query
//     if (community) addCondition(`v.community = ?`, community);
//     if (caste) addCondition(`v.caste = ?`, caste);
//   }

//   /* ---------------------
//     DATA ENTRY STATUS expanded mapping
//     --------------------- */
//   if (dataEntryStatus) {
//     switch (dataEntryStatus) {
//       case "MF":
//         // rely on cd alias (chargesheet_details already part of main SELECT)
//         addCondition(`(fa.HascaseMF = 1 OR cd.case_type = 'referredChargeSheet')`);
//         break;

//       case "SectionAltered":
//         addCondition(`fa.is_case_altered = 1`);
//         break;

//       case "SectionDeleted":
//         addCondition(`cd.case_type = 'sectionDeleted'`);
//         break;

//       case "FirQuashed":
//         addCondition(`cd.case_type = 'firQuashed'`);
//         break;

//       case "Charge_Abated":
//         joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//         addCondition(`case_details.judgementNature = 'Charge_Abated'`);
//         break;

//       case "Quashed":
//         joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//         addCondition(`case_details.judgementNature = 'Quashed'`);
//         break;

//       case "Appeal":
//         joinsSet.add(`LEFT JOIN case_details ON case_details.fir_id = fa.fir_id`);
//         joinsSet.add(`LEFT JOIN appeal_details ON appeal_details.fir_id = fa.fir_id`);
//         addCondition(`case_details.judgementNature = 'Acquitted'`);
//         addCondition(`(appeal_details.filed_by IS NOT NULL AND appeal_details.filed_by <> '')`);
//         break;

//       default:
//         // fallback numeric/normal status (keeps backward compatibility)
//         addCondition('fa.status = ?', dataEntryStatus);
//     }
//   }

//   /* ---------------------
//     Year / legacy
//     --------------------- */
//   if (year) addCondition('DATE_FORMAT(fa.date_of_registration, "%Y") = ?', year);

//   if (legacy === "yes") {
//     const legacyDate = '2025-03-20 09:18:11';
//     addCondition('fa.created_at = ?', legacyDate);
//   }

//   /* ---------------------
//     Build WHERE clause & params (preserve insertion order)
//     --------------------- */
//   const conditionKeys = Array.from(conditionsMap.keys());
//   const flatParams = [];
//   for (const key of conditionKeys) {
//     const vals = conditionsMap.get(key) || [];
//     flatParams.push(...vals);
//   }
//   const whereClause = conditionKeys.length ? `WHERE ${conditionKeys.join(' AND ')}` : '';

//   /* ---------------------
//     Build joins string
//     Note: keep these base joins present exactly as in your original query.
//     Additional joins (case_details, appeal_details, offence_acts) are taken from joinsSet.
//     --------------------- */
//   const dynamicJoins = [...joinsSet].join(' ');

//   /* ---------------------
//     COUNT query
//     --------------------- */
//   let countQuery;
//   if (caste || community) {
//     countQuery = `SELECT COUNT(*) AS total
//       FROM (
//         SELECT fa.fir_id
//         FROM fir_add fa
//         LEFT JOIN victims v ON fa.fir_id = v.fir_id
//         LEFT JOIN chargesheet_details cd ON fa.fir_id = cd.fir_id
//         LEFT JOIN report_reasons rr ON fa.fir_id = rr.fir_id
//         LEFT JOIN users us ON us.id = fa.created_by
//         ${dynamicJoins} ${whereClause} ${groupByClause}
//       ) AS sub`;
//   } else {
//     countQuery = `SELECT COUNT(*) AS total
//       FROM fir_add fa
//       LEFT JOIN victims v ON fa.fir_id = v.fir_id
//       LEFT JOIN chargesheet_details cd ON fa.fir_id = cd.fir_id
//       LEFT JOIN report_reasons rr ON fa.fir_id = rr.fir_id
//       LEFT JOIN users us ON us.id = fa.created_by
//       ${dynamicJoins} ${whereClause} ${groupByClause}`;
//   }

//   /* ---------------------
//     Execute queries
//     --------------------- */
//   try {
//     db.query(countQuery, flatParams, (err, countResults) => {
//       if (err) return res.status(500).json({ message: 'Count query failed', error: err });

//       const total = countResults.length !== 0 ? countResults[0].total : 0;
//       if (total === 0) {
//         return res.status(200).json({ data: [], total: 0, page, pageSize, totalPages: 0 });
//       }

//       const totalPages = Math.ceil(total / pageSize);
//       const validPage = Math.min(Math.max(1, page), totalPages);
//       const validOffset = (validPage - 1) * pageSize;

//       const query = `
//         SELECT 
//           fa.fir_id, 
//           fa.police_city COLLATE utf8mb4_general_ci AS police_city,
//           fa.police_station COLLATE utf8mb4_general_ci AS police_station,
//           CONCAT(fa.fir_number, '/', fa.fir_number_suffix) AS fir_number,
//           fa.number_of_victim, 
//           fa.status, 
//           fa.relief_status,
//           v.community,
//           v.caste,
//           fa.police_zone,
//           fa.revenue_district,
//           fa.is_case_altered,
//           fa.altered_date,
//           us.name AS created_by, 
//           DATE_FORMAT(fa.created_at, '%Y-%m-%d') AS created_at,
//           DATE_FORMAT(fa.updated_at, '%Y-%m-%d') AS modified_at,
//           DATE_FORMAT(fa.date_of_registration, '%Y-%m-%d') AS date_of_registration,
//           DATE_FORMAT(rr.report_month, '%Y-%m-%d') AS report_month,

//           GROUP_CONCAT(DISTINCT 
//             REPLACE(REPLACE(v.offence_committed COLLATE utf8mb4_general_ci, '[', ''), ']', '') 
//             ORDER BY v.victim_id DESC SEPARATOR ', ') AS offence_committed, 

//           GROUP_CONCAT(DISTINCT 
//             REPLACE(REPLACE(v.scst_sections COLLATE utf8mb4_general_ci, '[', ''), ']', '') 
//             ORDER BY v.victim_id DESC SEPARATOR ', ') AS scst_sections,

//           GROUP_CONCAT(DISTINCT cd.court_district COLLATE utf8mb4_general_ci ORDER BY cd.court_district SEPARATOR ', ') AS court_district, 
//           GROUP_CONCAT(DISTINCT cd.court_name COLLATE utf8mb4_general_ci ORDER BY cd.court_name SEPARATOR ', ') AS court_name, 
//           GROUP_CONCAT(DISTINCT cd.case_number COLLATE utf8mb4_general_ci ORDER BY cd.case_number SEPARATOR ', ') AS case_number,

//           (SELECT rr_inner.reason_for_status COLLATE utf8mb4_general_ci
//             FROM report_reasons rr_inner 
//             WHERE rr_inner.fir_id COLLATE utf8mb4_general_ci = fa.fir_id COLLATE utf8mb4_general_ci
//               AND MONTH(rr_inner.report_month) = MONTH(CURDATE()) 
//               AND YEAR(rr_inner.report_month) = YEAR(CURDATE()) 
//             ORDER BY rr_inner.created_at DESC 
//             LIMIT 1) AS current_month_reason_for_status,

//           (SELECT rr_inner.reason_for_status COLLATE utf8mb4_general_ci
//             FROM report_reasons rr_inner 
//             WHERE rr_inner.fir_id COLLATE utf8mb4_general_ci = fa.fir_id COLLATE utf8mb4_general_ci
//               AND MONTH(rr_inner.report_month) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
//               AND YEAR(rr_inner.report_month) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
//             ORDER BY rr_inner.created_at DESC 
//             LIMIT 1) AS previous_month_reason_for_status,

//           CASE 
//             WHEN fa.status >= 6 THEN DATEDIFF(CURDATE(), fa.date_of_registration)
//             ELSE NULL 
//           END AS pending_trial_case_days,

//           CASE 
//             WHEN fa.status <= 5 THEN DATEDIFF(CURDATE(), fa.date_of_registration)
//             ELSE NULL 
//           END AS under_investigation_case_days

//         FROM fir_add fa
//         LEFT JOIN victims v ON fa.fir_id = v.fir_id
//         LEFT JOIN chargesheet_details cd ON fa.fir_id = cd.fir_id
//         LEFT JOIN report_reasons rr ON fa.fir_id = rr.fir_id
//         LEFT JOIN users us ON us.id = fa.created_by
//         ${dynamicJoins} ${whereClause} ${groupByClause}
//         ORDER BY fa.created_at DESC
//         LIMIT ? OFFSET ?
//       `;

//       db.query(query, [...flatParams, pageSize, validOffset], (err, results) => {
//         if (err) return res.status(500).json({ message: 'Data query failed', error: err });

//         res.status(200).json({
//           data: results,
//           total,
//           page: validPage,
//           pageSize,
//           totalPages
//         });
//       });
//     });
//   } catch (error) {
//     console.error("Error in getmonthlyreportdetail:", error);
//     res.status(500).json({ error: "Failed to get report data." });
//   }

// }

// exports.GetDistrictWisePendingUI = async (req, res) => {
//   let query = `
//   SELECT 
//     revenue_district,
//     COUNT(CASE WHEN status <= 5 THEN 1 END) AS ui_total_cases,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) < 60 THEN 1 END) AS less_than_60_days,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) THEN 1 END) AS more_than_60_current_year,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) - 1 THEN 1 END) AS more_than_60_last_year,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) - 2 THEN 1 END) AS more_than_60_two_years_ago
//   FROM 
//     fir_add
//   GROUP BY 
//     revenue_district 
//   order by 
//     revenue_district
//   `;

//   const params = [];

//   try {
//     db.query(query, params, (err, results) => {
//       if (err) {
//         console.error("Database error:", err);
//         return res.status(500).json({
//           message: "Failed to retrieve data",
//           error: err,
//         });
//       }

//       if (results.length === 0) {
//         return res.status(200).json({ message: "No records found" });
//       }

//       // Calculate totals
//       const totals = {
//         revenue_district: 'Grand Total',
//         ui_total_cases: 0,
//         less_than_60_days: 0,
//         more_than_60_current_year: 0,
//         more_than_60_last_year: 0,
//         more_than_60_two_years_ago: 0
//       };

//       // Sum all values for each column
//       results.forEach(row => {
//         totals.ui_total_cases += row.ui_total_cases || 0;
//         totals.less_than_60_days += row.less_than_60_days || 0;
//         totals.more_than_60_current_year += row.more_than_60_current_year || 0;
//         totals.more_than_60_last_year += row.more_than_60_last_year || 0;
//         totals.more_than_60_two_years_ago += row.more_than_60_two_years_ago || 0;
//       });

//       // Add the totals row to the results
//       results.push(totals);

//       res.status(200).json({ data: results });
//     });
//   } catch (error) {
//     console.error("Error in getmonthlyreportdetail:", error);
//     res.status(500).json({ error: "Failed to get report data." });
//   }
// };



exports.GetDistrictWisePendingUI = async (req, res) => {
  const conditions = [];
  const params = [];
  
  // Handle multiple districts as array
  if (req.query.districts) {
    const districts = Array.isArray(req.query.districts) ? req.query.districts : [req.query.districts];
    const placeholders = districts.map(() => '?').join(',');
    conditions.push(`fa.revenue_district IN (${placeholders})`);
    params.push(...districts);
  }
  
  if (req.query.police_zone) {
    conditions.push('fa.police_zone = ?');
    params.push(req.query.police_zone);
  }
  
  if (req.query.Police_City) {
    conditions.push('fa.police_city = ?');
    params.push(req.query.Police_City);
  }

  if (req.query.Community) {
    conditions.push('vm.community = ?');
    params.push(req.query.Community);
  }

  if (req.query.Caste) {
    conditions.push('vm.caste = ?');
    params.push(req.query.Caste);
  }
  
  if (req.query.start_date) {
    conditions.push('fa.date_of_registration >= ?');
    params.push(req.query.start_date);
  }
  
  if (req.query.end_date) {
    conditions.push('fa.date_of_registration <= ?');
    params.push(req.query.end_date);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  let query = `
    SELECT 
      fa.revenue_district,
      COUNT(CASE WHEN fa.status <= 5 THEN 1 END) AS ui_total_cases,
      COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) < 60 THEN 1 END) AS less_than_60_days,
      COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) THEN 1 END) AS more_than_60_current_year,
      COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) - 1 THEN 1 END) AS more_than_60_last_year,
      COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) - 2 THEN 1 END) AS more_than_60_two_years_ago
    FROM 
      fir_add fa
    LEFT JOIN 
      victims vm on vm.fir_id = fa.fir_id
    ${whereClause}
    GROUP BY 
      fa.revenue_district 
    ORDER BY 
      fa.revenue_district
  `;

  try {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          message: "Failed to retrieve data",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: "No records found" });
      }

      // Calculate totals
      const totals = {
        revenue_district: 'Grand Total',
        ui_total_cases: 0,
        less_than_60_days: 0,
        more_than_60_current_year: 0,
        more_than_60_last_year: 0,
        more_than_60_two_years_ago: 0
      };

      // Sum all values for each column
      results.forEach(row => {
        totals.ui_total_cases += row.ui_total_cases || 0;
        totals.less_than_60_days += row.less_than_60_days || 0;
        totals.more_than_60_current_year += row.more_than_60_current_year || 0;
        totals.more_than_60_last_year += row.more_than_60_last_year || 0;
        totals.more_than_60_two_years_ago += row.more_than_60_two_years_ago || 0;
      });

      // Add the totals row to the results
      results.push(totals);

      res.status(200).json({ data: results });
    });
  } catch (error) {
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};

// exports.GetReasonWisePendingUI = async (req, res) => {
//   let query = `
//   SELECT 
//     rr.reason_for_status,
//     COUNT(CASE WHEN status <= 5 THEN 1 END) AS ui_total_cases,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) < 60 THEN 1 END) AS less_than_60_days,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) THEN 1 END) AS more_than_60_current_year,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) - 1 THEN 1 END) AS more_than_60_last_year,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) - 2 THEN 1 END) AS more_than_60_two_years_ago
//   FROM 
//     fir_add fa
//   LEFT JOIN report_reasons rr ON rr.fir_id = fa.fir_id
//   GROUP BY 
//     rr.reason_for_status 
//   order by 
//     rr.reason_for_status
//   `;

//   const params = [];

//   try {
//     db.query(query, params, (err, results) => {
//       if (err) {
//         console.error("Database error:", err);
//         return res.status(500).json({
//           message: "Failed to retrieve data",
//           error: err,
//         });
//       }

//       if (results.length === 0) {
//         return res.status(200).json({ message: "No records found" });
//       }

//       // Calculate totals
//       const totals = {
//         reason_for_status: 'Grand Total',
//         ui_total_cases: 0,
//         less_than_60_days: 0,
//         more_than_60_current_year: 0,
//         more_than_60_last_year: 0,
//         more_than_60_two_years_ago: 0

//       };

//       // Sum all values for each column
//       results.forEach(row => {
//         totals.ui_total_cases += row.ui_total_cases || 0;
//         totals.less_than_60_days += row.less_than_60_days || 0;
//         totals.more_than_60_current_year += row.more_than_60_current_year || 0;
//         totals.more_than_60_last_year += row.more_than_60_last_year || 0;
//         totals.more_than_60_two_years_ago += row.more_than_60_two_years_ago || 0;
//       });

//       // Add the totals row to the results
//       results.push(totals);


//       res.status(200).json({ data: results });
//     });
//   } catch (error) {
//     console.error("Error in getmonthlyreportdetail:", error);
//     res.status(500).json({ error: "Failed to get report data." });
//   }
// };

exports.GetReasonWisePendingUI = async (req, res) => {
  const conditions = [];
  const params = [];
  // Handle multiple districts as array
  if (req.query.districts) {
    const districts = Array.isArray(req.query.districts) ? req.query.districts : [req.query.districts];
    const placeholders = districts.map(() => '?').join(',');
    conditions.push(`fa.revenue_district IN (${placeholders})`);
    params.push(...districts);
  }
  
  if (req.query.police_zone) {
    conditions.push('fa.police_zone = ?');
    params.push(req.query.police_zone);
  }
  
  if (req.query.Police_City) {
    conditions.push('fa.police_city = ?');
    params.push(req.query.Police_City);
  }

  if (req.query.Community) {
    conditions.push('vm.community = ?');
    params.push(req.query.Community);
  }

  if (req.query.Caste) {
    conditions.push('vm.caste = ?');
    params.push(req.query.Caste);
  }
  
  if (req.query.start_date) {
    conditions.push('fa.date_of_registration >= ?');
    params.push(req.query.start_date);
  }
  
  if (req.query.end_date) {
    conditions.push('fa.date_of_registration <= ?');
    params.push(req.query.end_date);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let query = `
  SELECT 
    rr.reason_for_status,
    COUNT(CASE WHEN fa.status <= 5 THEN 1 END) AS ui_total_cases,
    COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) < 60 THEN 1 END) AS less_than_60_days,
    COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) THEN 1 END) AS more_than_60_current_year,
    COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) - 1 THEN 1 END) AS more_than_60_last_year,
    COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) - 2 THEN 1 END) AS more_than_60_two_years_ago
  FROM 
    fir_add fa
  LEFT JOIN 
    report_reasons rr ON rr.fir_id = fa.fir_id
  LEFT JOIN 
    victims vm on vm.fir_id = fa.fir_id
    ${whereClause}
  GROUP BY 
    rr.reason_for_status 
  order by 
    rr.reason_for_status
  `;

  try {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          message: "Failed to retrieve data",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: "No records found" });
      }

      // Calculate totals
      const totals = {
        reason_for_status: 'Grand Total',
        ui_total_cases: 0,
        less_than_60_days: 0,
        more_than_60_current_year: 0,
        more_than_60_last_year: 0,
        more_than_60_two_years_ago: 0

      };

      // Sum all values for each column
      results.forEach(row => {
        totals.ui_total_cases += row.ui_total_cases || 0;
        totals.less_than_60_days += row.less_than_60_days || 0;
        totals.more_than_60_current_year += row.more_than_60_current_year || 0;
        totals.more_than_60_last_year += row.more_than_60_last_year || 0;
        totals.more_than_60_two_years_ago += row.more_than_60_two_years_ago || 0;
      });

      // Add the totals row to the results
      results.push(totals);


      res.status(200).json({ data: results });
    });
  } catch (error) {
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};

// exports.GetCommunity_Certificate_Report = async (req, res) => {
//   let query = `
//   SELECT 
//     fa.revenue_district,
//     COUNT(CASE WHEN status <= 5 THEN 1 END) AS ui_total_cases,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) < 60 THEN 1 END) AS less_than_60_days,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) THEN 1 END) AS more_than_60_current_year,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) - 1 THEN 1 END) AS more_than_60_last_year,
//     COUNT(CASE WHEN status <= 5 AND DATEDIFF(NOW(), date_of_registration) >= 60 AND YEAR(date_of_registration) = YEAR(NOW()) - 2 THEN 1 END) AS more_than_60_two_years_ago
//   FROM 
//     fir_add fa
//   LEFT JOIN 
//     report_reasons rr ON rr.fir_id = fa.fir_id
//   WHERE 
//     rr.reason_for_status LIKE '%Community Certificate%'
//   GROUP BY 
//     fa.revenue_district 
//   order by 
//     fa.revenue_district
//   `;

//   const params = [];

//   try {
//     db.query(query, params, (err, results) => {
//       if (err) {
//         console.error("Database error:", err);
//         return res.status(500).json({
//           message: "Failed to retrieve data",
//           error: err,
//         });
//       }

//       if (results.length === 0) {
//         return res.status(200).json({ message: "No records found" });
//       }
//       // Calculate totals
//       const totals = {
//         revenue_district: 'Grand Total',
//         ui_total_cases: 0,
//         less_than_60_days: 0,
//         more_than_60_current_year: 0,
//         more_than_60_last_year: 0,
//         more_than_60_two_years_ago: 0

//       };

//       // Sum all values for each column
//       results.forEach(row => {
//         totals.ui_total_cases += row.ui_total_cases || 0;
//         totals.less_than_60_days += row.less_than_60_days || 0;
//         totals.more_than_60_current_year += row.more_than_60_current_year || 0;
//         totals.more_than_60_last_year += row.more_than_60_last_year || 0;
//         totals.more_than_60_two_years_ago += row.more_than_60_two_years_ago || 0;
//       });

//       // Add the totals row to the results
//       results.push(totals);

//       res.status(200).json({ data: results });
//     });
//   } catch (error) {
//     console.error("Error in getmonthlyreportdetail:", error);
//     res.status(500).json({ error: "Failed to get report data." });
//   }
// };

exports.GetCommunity_Certificate_Report = async (req, res) => {
  const conditions = [];
  const params = [];
  conditions.push('rr.reason_for_status LIKE "%Community Certificate%"');
  // Handle multiple districts as array
  if (req.query.districts) {
    const districts = Array.isArray(req.query.districts) ? req.query.districts : [req.query.districts];
    const placeholders = districts.map(() => '?').join(',');
    conditions.push(`fa.revenue_district IN (${placeholders})`);
    params.push(...districts);
  }
  
  if (req.query.police_zone) {
    conditions.push('fa.police_zone = ?');
    params.push(req.query.police_zone);
  }
  
  if (req.query.Police_City) {
    conditions.push('fa.police_city = ?');
    params.push(req.query.Police_City);
  }

  if (req.query.Community) {
    conditions.push('vm.community = ?');
    params.push(req.query.Community);
  }

  if (req.query.Caste) {
    conditions.push('vm.caste = ?');
    params.push(req.query.Caste);
  }
  
  if (req.query.start_date) {
    conditions.push('fa.date_of_registration >= ?');
    params.push(req.query.start_date);
  }
  
  if (req.query.end_date) {
    conditions.push('fa.date_of_registration <= ?');
    params.push(req.query.end_date);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let query = `
  SELECT 
    fa.revenue_district,
    COUNT(CASE WHEN fa.status <= 5 THEN 1 END) AS ui_total_cases,
    COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) < 60 THEN 1 END) AS less_than_60_days,
    COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) THEN 1 END) AS more_than_60_current_year,
    COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) - 1 THEN 1 END) AS more_than_60_last_year,
    COUNT(CASE WHEN fa.status <= 5 AND DATEDIFF(NOW(), fa.date_of_registration) >= 60 AND YEAR(fa.date_of_registration) = YEAR(NOW()) - 2 THEN 1 END) AS more_than_60_two_years_ago
  FROM 
    fir_add fa
  LEFT JOIN 
    report_reasons rr ON rr.fir_id = fa.fir_id
  LEFT JOIN 
    victims vm on vm.fir_id = fa.fir_id
    ${whereClause}
  GROUP BY 
    fa.revenue_district 
  order by 
    fa.revenue_district
  `;

  try {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          message: "Failed to retrieve data",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: "No records found" });
      }
      // Calculate totals
      const totals = {
        revenue_district: 'Grand Total',
        ui_total_cases: 0,
        less_than_60_days: 0,
        more_than_60_current_year: 0,
        more_than_60_last_year: 0,
        more_than_60_two_years_ago: 0

      };

      // Sum all values for each column
      results.forEach(row => {
        totals.ui_total_cases += row.ui_total_cases || 0;
        totals.less_than_60_days += row.less_than_60_days || 0;
        totals.more_than_60_current_year += row.more_than_60_current_year || 0;
        totals.more_than_60_last_year += row.more_than_60_last_year || 0;
        totals.more_than_60_two_years_ago += row.more_than_60_two_years_ago || 0;
      });

      // Add the totals row to the results
      results.push(totals);

      res.status(200).json({ data: results });
    });
  } catch (error) {
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};

// exports.GetDistrictWisePendingPT = async (req, res) => {
//   let query = `
//   SELECT 
//     revenue_district,
//     COUNT(id) AS total,
//     COUNT(CASE WHEN DATEDIFF(NOW(), date_of_registration) < 365 THEN 1 END) AS less_than_one_year,
//     COUNT(CASE WHEN DATEDIFF(NOW(), date_of_registration) BETWEEN 365 AND 1824 THEN 1 END) AS between_1_and_5_years,
//     COUNT(CASE WHEN DATEDIFF(NOW(), date_of_registration) BETWEEN 1825 AND 3650 THEN 1 END) AS between_6_and_10_years,
//     COUNT(CASE WHEN DATEDIFF(NOW(), date_of_registration) BETWEEN 3651 AND 5475 THEN 1 END) AS between_11_and_15_years,
//     COUNT(CASE WHEN DATEDIFF(NOW(), date_of_registration) BETWEEN 5476 AND 7300 THEN 1 END) AS between_16_and_20_years,
//     COUNT(CASE WHEN DATEDIFF(NOW(), date_of_registration) > 7300 THEN 1 END) AS above_20_years
//   FROM 
//     fir_add
//   WHERE 
//     status >= 6 
//   GROUP BY 
//     revenue_district
//   ORDER BY
//     revenue_district;
//   `;

//   const params = [];

//   try {
//     db.query(query, params, (err, results) => {
//       if (err) {
//         console.error("Database error:", err);
//         return res.status(500).json({
//           message: "Failed to retrieve data",
//           error: err,
//         });
//       }

//       if (results.length === 0) {
//         return res.status(200).json({ message: "No records found" });
//       }

//       // Calculate totals
//       const totals = {
//         revenue_district: 'Grand Total',
//         total: 0,
//         less_than_one_year: 0,
//         between_1_and_5_years: 0,
//         between_6_and_10_years: 0,
//         between_11_and_15_years: 0,
//         between_16_and_20_years: 0,
//         above_20_years: 0,
 

//       };

//       // Sum all values for each column
//       results.forEach(row => {
//         totals.total += row.total || 0;
//         totals.less_than_one_year += row.less_than_one_year || 0;
//         totals.between_1_and_5_years += row.between_1_and_5_years || 0;
//         totals.between_6_and_10_years += row.between_6_and_10_years || 0;
//         totals.between_11_and_15_years += row.between_11_and_15_years || 0;
//         totals.between_16_and_20_years += row.between_16_and_20_years || 0;
//         totals.above_20_years += row.above_20_years || 0;

//       });

//       // Add the totals row to the results
//       results.push(totals);

//       res.status(200).json({ data: results });
//     });
//   } catch (error) {
//     console.error("Error in getmonthlyreportdetail:", error);
//     res.status(500).json({ error: "Failed to get report data." });
//   }
// };


exports.GetDistrictWisePendingPT = async (req, res) => {
  const conditions = [];
  const params = [];
  conditions.push('fa.status >= 6');
  // Handle multiple districts as array
  if (req.query.districts) {
    const districts = Array.isArray(req.query.districts) ? req.query.districts : [req.query.districts];
    const placeholders = districts.map(() => '?').join(',');
    conditions.push(`fa.revenue_district IN (${placeholders})`);
    params.push(...districts);
  }
  
  if (req.query.police_zone) {
    conditions.push('fa.police_zone = ?');
    params.push(req.query.police_zone);
  }
  
  if (req.query.Police_City) {
    conditions.push('fa.police_city = ?');
    params.push(req.query.Police_City);
  }

  if (req.query.Community) {
    conditions.push('vm.community = ?');
    params.push(req.query.Community);
  }

  if (req.query.Caste) {
    conditions.push('vm.caste = ?');
    params.push(req.query.Caste);
  }
  
  if (req.query.start_date) {
    conditions.push('fa.date_of_registration >= ?');
    params.push(req.query.start_date);
  }
  
  if (req.query.end_date) {
    conditions.push('fa.date_of_registration <= ?');
    params.push(req.query.end_date);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let query = `
  SELECT 
    fa.revenue_district,
    COUNT(fa.id) AS total,
    COUNT(CASE WHEN DATEDIFF(NOW(), fa.date_of_registration) < 365 THEN 1 END) AS less_than_one_year,
    COUNT(CASE WHEN DATEDIFF(NOW(), fa.date_of_registration) BETWEEN 365 AND 1824 THEN 1 END) AS between_1_and_5_years,
    COUNT(CASE WHEN DATEDIFF(NOW(), fa.date_of_registration) BETWEEN 1825 AND 3650 THEN 1 END) AS between_6_and_10_years,
    COUNT(CASE WHEN DATEDIFF(NOW(), fa.date_of_registration) BETWEEN 3651 AND 5475 THEN 1 END) AS between_11_and_15_years,
    COUNT(CASE WHEN DATEDIFF(NOW(), fa.date_of_registration) BETWEEN 5476 AND 7300 THEN 1 END) AS between_16_and_20_years,
    COUNT(CASE WHEN DATEDIFF(NOW(), fa.date_of_registration) > 7300 THEN 1 END) AS above_20_years
  FROM 
    fir_add fa
  LEFT JOIN 
    victims vm on vm.fir_id = fa.fir_id
    ${whereClause}
  GROUP BY 
    fa.revenue_district
  ORDER BY
    fa.revenue_district;
  `;

  try {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          message: "Failed to retrieve data",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: "No records found" });
      }

      // Calculate totals
      const totals = {
        revenue_district: 'Grand Total',
        total: 0,
        less_than_one_year: 0,
        between_1_and_5_years: 0,
        between_6_and_10_years: 0,
        between_11_and_15_years: 0,
        between_16_and_20_years: 0,
        above_20_years: 0,
 

      };

      // Sum all values for each column
      results.forEach(row => {
        totals.total += row.total || 0;
        totals.less_than_one_year += row.less_than_one_year || 0;
        totals.between_1_and_5_years += row.between_1_and_5_years || 0;
        totals.between_6_and_10_years += row.between_6_and_10_years || 0;
        totals.between_11_and_15_years += row.between_11_and_15_years || 0;
        totals.between_16_and_20_years += row.between_16_and_20_years || 0;
        totals.above_20_years += row.above_20_years || 0;

      });

      // Add the totals row to the results
      results.push(totals);

      res.status(200).json({ data: results });
    });
  } catch (error) {
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};

// exports.GetConvictionTypeRepot = async (req, res) => {
//   let query = `
//     SELECT 
//       Conviction_Type, count(id) as case_count
//     FROM 
//         fir_add
//     WHERE
//       Conviction_Type is not null and Conviction_Type != '' AND YEAR(date_of_registration) = YEAR(CURDATE())
//     GROUP BY 
//       Conviction_Type
//     ORDER BY
//       Conviction_Type
//   `;

//   const params = [];

//   try {
//     db.query(query, params, (err, results) => {
//       if (err) {
//         console.error("Database error:", err);
//         return res.status(500).json({
//           message: "Failed to retrieve data",
//           error: err,
//         });
//       }

//       if (results.length === 0) {
//         return res.status(200).json({ message: "No records found" });
//       }

//       // Calculate totals
//       const totals = {
//         Conviction_Type: 'Grand Total',
//         case_count: 0

//       };

//       // Sum all values for each column
//       results.forEach(row => {
//         totals.case_count += row.case_count || 0;
//       });

//       // Add the totals row to the results
//       results.push(totals);

//       res.status(200).json({ data: results });
//     });
//   } catch (error) {
//     console.error("Error in getmonthlyreportdetail:", error);
//     res.status(500).json({ error: "Failed to get report data." });
//   }
// };


exports.GetConvictionTypeRepot = async (req, res) => {
  const conditions = [];
  const params = [];
  conditions.push('Conviction_Type is not null and Conviction_Type != "" AND YEAR(date_of_registration) = YEAR(CURDATE())');
  // Handle multiple districts as array
  if (req.query.districts) {
    const districts = Array.isArray(req.query.districts) ? req.query.districts : [req.query.districts];
    const placeholders = districts.map(() => '?').join(',');
    conditions.push(`fa.revenue_district IN (${placeholders})`);
    params.push(...districts);
  }
  
  if (req.query.police_zone) {
    conditions.push('fa.police_zone = ?');
    params.push(req.query.police_zone);
  }
  
  if (req.query.Police_City) {
    conditions.push('fa.police_city = ?');
    params.push(req.query.Police_City);
  }

  if (req.query.Community) {
    conditions.push('vm.community = ?');
    params.push(req.query.Community);
  }

  if (req.query.Caste) {
    conditions.push('vm.caste = ?');
    params.push(req.query.Caste);
  }
  
  if (req.query.start_date) {
    conditions.push('fa.date_of_registration >= ?');
    params.push(req.query.start_date);
  }
  
  if (req.query.end_date) {
    conditions.push('fa.date_of_registration <= ?');
    params.push(req.query.end_date);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let query = `
    SELECT 
      fa.Conviction_Type, count(fa.id) as case_count
    FROM 
        fir_add fa
    LEFT JOIN 
      victims vm on vm.fir_id = fa.fir_id
    ${whereClause}
    GROUP BY 
      fa.Conviction_Type
    ORDER BY
      fa.Conviction_Type
  `;

  try {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          message: "Failed to retrieve data",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: "No records found" });
      }

      // Calculate totals
      const totals = {
        Conviction_Type: 'Grand Total',
        case_count: 0

      };

      // Sum all values for each column
      results.forEach(row => {
        totals.case_count += row.case_count || 0;
      });

      // Add the totals row to the results
      results.push(totals);

      res.status(200).json({ data: results });
    });
  } catch (error) {
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};

exports.getReasonCategories = async (req, res) => {
  try {
    const query = 'SELECT name FROM report_reason_categories';
    db.query(query, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send(result);
    });
  } catch (error) {
    console.error("Error in getting reason categories:", error);
    res.status(500).json({ error: "Failed to get reason categories." });
  }
};

exports.MonnthlyUpdate = async (req, res) => {
  let Reason = req.body.Reason;
  let remarks = "";
  if(Reason === "Others"){
    remarks = req.body.remarks;
  }
  let fir_id = req.body.fir_id;

  if (!fir_id || !Reason) {
    return res.status(400).json({ message: "Missing mandatory fields" });
  }

  const checkQuery = `
    SELECT * FROM report_reasons 
    WHERE fir_id = ? 
      AND MONTH(report_month) = MONTH(CURDATE()) 
      AND YEAR(report_month) = YEAR(CURDATE())
  `;
  const checkParams = [fir_id];

  try {
    db.query(checkQuery, checkParams, (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Database error:", checkErr);
        return res.status(500).json({ message: "Database error", error: checkErr });
      }

      if (checkResults.length > 0) {
        // Update existing record
        const updateQuery = `
          UPDATE report_reasons 
          SET reason_for_status = ?, remarks = ?, updated_at = NOW() 
          WHERE fir_id = ? 
            AND MONTH(report_month) = MONTH(CURDATE()) 
            AND YEAR(report_month) = YEAR(CURDATE())
        `;
        const updateParams = [Reason, remarks, fir_id];

        db.query(updateQuery, updateParams, (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Update error:", updateErr);
            return res.status(500).json({ message: "Update failed", error: updateErr });
          }
          return res.status(200).json({ message: "Record updated successfully" });
        });

      } else {
        // Insert new record
        const insertQuery = `
          INSERT INTO report_reasons 
          (fir_id, report_month, reason_for_status, remarks, created_at, updated_at)
          VALUES (?, CURDATE(), ?, ?, NOW(), NOW())
        `;
        const insertParams = [fir_id, Reason, remarks];

        db.query(insertQuery, insertParams, (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Insert error:", insertErr);
            return res.status(500).json({ message: "Insert failed", error: insertErr });
          }
          return res.status(201).json({ message: "Record inserted successfully" });
        });
      }
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};



// Updates status in fir_add table and insert/update reason_current_month into report_reasons table if provided
exports.updateMonthlyReports = async (req, res) => {
  const records = req.body; // Expecting an array of objects

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "Request body must be an array with at least one object" });
  }

  try {
    let updatePromises = records.map((record) => {
      return new Promise((resolve, reject) => {
        const { fir_id, status, reason_current_month, created_by } = record;
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
          // Update status in fir_add table
          let updateQuery = `UPDATE fir_add SET status = COALESCE(?, status) WHERE fir_id = ?`;
          let updateParams = [status, fir_id];
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
          message: "Monthly reports update completed",
          results,
        });
      })
      .catch((error) => {
        console.error("Error in Monthly reports update:", error);
        res.status(500).json({ error: "Failed to process some Monthly reports records", details: error });
      });

  } catch (error) {
    console.error("Error in update Monthly reports:", error);
    res.status(500).json({ error: "Failed to update Monthly reports." });
  }
};

exports.getMRFAbstract = async (req, res) => {

  try{
    console.log(req.body);
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

    whereConditions.push(`fa.revenue_district IS NOT NULL AND fa.revenue_district <> ''`);
    // Final WHERE clause
    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    // SQL Query
    const query = `SELECT 
    fa.revenue_district,
    fa.police_station,

    -- Total cases (including MF)
    SUM(CASE WHEN fa.status >= 1 THEN 1 ELSE 0 END) AS total_cases,

    -- MF count
    SUM(
        CASE 
            WHEN COALESCE(fa.HascaseMF, 0) = 1 THEN 1
            WHEN COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet', 'firQuashed', 'sectionDeleted') THEN 1 
            WHEN COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed') THEN 1           
            ELSE 0 
        END
    ) AS mf_cases,

    -- Not yet received (status <= 4 and not MF/quashed/abated)
    SUM(CASE 
      WHEN fa.status <= 4 
           AND NOT (COALESCE(fa.HascaseMF, 0) = 1 
                AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted') 
                AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed'))
           THEN 1
           ELSE 0 
      END
  ) AS notyetreceived,

    -- FIR Proposal sent to DC (cumulative)
    SUM(
        CASE 
            WHEN fa.status >= 5 
                 AND COALESCE(fa.HascaseMF, 0) <> 1
                 AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
                 AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
            THEN 1 ELSE 0 
        END
    ) AS fir_proposal_sent_to_dc,

    -- FIR Relief Given (any installment 1,2,3)
    SUM(
        CASE 
            WHEN COALESCE(fa.relief_status, 0) IN (1,2,3)
                 AND COALESCE(fa.HascaseMF, 0) <> 1
                 AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
                 AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
            THEN 1 ELSE 0 
        END
    ) AS fir_relief_given,

    -- FIR Relief Pending
    SUM(
        CASE 
            WHEN fa.status >= 5
                 AND COALESCE(fa.HascaseMF, 0) <> 1
                 AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
                 AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
                 AND COALESCE(fa.relief_status, 0) = 0
            THEN 1 ELSE 0 
        END
    ) AS fir_relief_pending,

    -- Chargesheet Proposal sent to DC (cumulative)
    SUM(
        CASE 
            WHEN fa.status >= 6 
                 AND NOT (COALESCE(fa.HascaseMF, 0) = 1 
                          AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted') 
                          AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed'))
            THEN 1 
          ELSE 0 
        END
    ) AS chargesheet_proposal_sent_to_dc,
 
    -- Chargesheet Relief Given (2nd or 3rd installment)
    SUM(
        CASE 
            WHEN COALESCE(fa.relief_status, 0) IN (2,3)
                 AND COALESCE(fa.HascaseMF, 0) <> 1
                 AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
                 AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
            THEN 1 ELSE 0 
        END
    ) AS chargesheet_relief_given,

    -- Chargesheet Relief Pending
    SUM(
        CASE 
            WHEN fa.status >= 6
                  AND NOT (COALESCE(fa.HascaseMF, 0) = 1 
                  AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted') 
                  AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed'))
                 AND COALESCE(fa.relief_status, 0) NOT IN (2,3)
            THEN 1 ELSE 0 
        END
    ) AS chargesheet_relief_pending,

    -- Trial Proposal sent to DC (only final stage)
    SUM(
        CASE 
            WHEN fa.status = 7 
                 AND NOT (COALESCE(fa.HascaseMF, 0) = 1 
                          AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted') 
                          AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed'))
            THEN 1 ELSE 0 
        END
    ) AS trial_proposal_sent_to_dc,

    -- Trial Relief Given (only 3rd installment)
    SUM(
        CASE 
            WHEN COALESCE(fa.relief_status, 0) = 3
                 AND COALESCE(fa.HascaseMF, 0) <> 1
                 AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
                 AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
            THEN 1 ELSE 0 
        END
    ) AS trial_relief_given,

    -- Trial Relief Pending
    SUM(
        CASE 
            WHEN fa.status = 7
                  AND NOT (COALESCE(fa.HascaseMF, 0) = 1 
                  AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted') 
                  AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed'))
                 AND COALESCE(fa.relief_status, 0) <> 3
            THEN 1 ELSE 0 
        END
    ) AS trial_relief_pending

FROM fir_add fa
LEFT JOIN chargesheet_details 
       ON chargesheet_details.fir_id = fa.fir_id
LEFT JOIN case_details 
       ON case_details.fir_id = fa.fir_id
${whereClause}
GROUP BY fa.revenue_district 
ORDER BY fa.revenue_district ASC`;
      
    // Execute Query
    db.query(query, params, (err, results) => {
      console.log(results);
      if (err) {
        console.error('Error fetching district relief data:', err);
        return res.status(500).json({ 
          message: 'Failed to retrieve district relief data', 
          error: err 
        });
      }

      res.status(200).json({
        data: results.map(row => ({
          ...row,
          total_cases: Number(row.total_cases),
          mf_cases: Number(row.mf_cases),
          nonmf_case: Number(row.total_cases) - Number(row.mf_cases),
          notyetreceived: Number(row.notyetreceived),
          fir_proposal_sent_to_dc: Number(row.fir_proposal_sent_to_dc),
          chargesheet_proposal_sent_to_dc: Number(row.chargesheet_proposal_sent_to_dc),
          trial_proposal_sent_to_dc: Number(row.trial_proposal_sent_to_dc),
          fir_relief_given: Number(row.fir_relief_given),
          chargesheet_relief_given: Number(row.chargesheet_relief_given),
          trial_relief_given: Number(row.trial_relief_given),
          fir_relief_pending: Number(row.fir_relief_pending),
          chargesheet_relief_pending: Number(row.chargesheet_relief_pending),
          trial_relief_pending: Number(row.trial_relief_pending),
        }))
      });
    });

  }
  catch(error){
    console.error("Error in getMonthly reports:", error);
    res.status(500).json({ error: "Failed to get Monthly reports." });
  }
}

exports.getMRFAbstractDetails = async (req, res) => {

  try{
    console.log(req.body);
  // Build WHERE clause based on provided filters
    const whereConditions = [];
    const params = [];
    let condition = "";
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
    else{
      // whereConditions.push('fa.status >= ?');
      // params.push(5);
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

    if(req.body.status == "firpending"){
      condition = ` AND COALESCE(fa.relief_status, 0) = 0 AND fa.status >= 5 
      AND COALESCE(fa.HascaseMF, 0) <> 1
           AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
           AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')`;
    }
    else if(req.body.status == "chargepending"){
      condition = ` AND fa.status >= 6 AND NOT (COALESCE(fa.HascaseMF, 0) = 1 
      AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted') 
      AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed')) AND COALESCE(fa.relief_status, 0) NOT IN (2,3)`;
    }
    else if(req.body.status == "trialpending"){
      condition = ` AND fa.status = 7 AND COALESCE(fa.relief_status, 0) <=2 AND NOT (COALESCE(fa.HascaseMF, 0) = 1 
      AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted') 
      AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed'))`;
    }
    else if(req.body.status == "firgiven"){
      condition = ` AND COALESCE(fa.relief_status, 0) IN (1,2,3) AND COALESCE(fa.HascaseMF, 0) <> 1 
      AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')`;
    }
    else if(req.body.status == "chargegiven"){
      condition = ` AND COALESCE(fa.relief_status, 0) IN (2,3) AND COALESCE(fa.HascaseMF, 0) <> 1 
      AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')`;
    }
    else if(req.body.status == "trialgiven"){
      condition = ` AND COALESCE(fa.relief_status, 0) = 3 AND COALESCE(fa.HascaseMF, 0) <> 1 
      AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')`;
    }
    else if(req.body.status == "mf"){
      condition = ` AND (COALESCE(fa.HascaseMF, 0) = 1
      OR COALESCE(chargesheet_details.case_type, '') IN ('referredChargeSheet','firQuashed','sectionDeleted')
      OR COALESCE(case_details.judgementNature, '') IN ('Charge_Abated','Quashed'))`;
    }
    else if(req.body.status == "nonmf"){
      condition = ` AND COALESCE(fa.HascaseMF, 0) <> 1
      AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
      AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')`;
    }
    else if(req.body.status == "notyetreceived"){
      condition = ` AND fa.status <= 4 AND COALESCE(fa.HascaseMF, 0) <> 1 
      AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted') 
      AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated', 'Quashed')`;
    }
    else{
      //this will used for totalcases too
      condition = " ";
    }
    whereConditions.push(`fa.revenue_district IS NOT NULL AND fa.revenue_district <> ''`);
    // Final WHERE clause
    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    // SQL Query
    const query = `SELECT 
    CONCAT(fa.fir_number, '/', fa.fir_number_suffix) AS fir_number_full,
    fa.status,
    fa.revenue_district,
    DATE(fa.date_of_registration) AS register_date,
    fa.fir_id AS firId,
    fa.police_station,

    -- FIR stage status
    CASE 
        WHEN fa.status >= 5
             AND COALESCE(fa.HascaseMF, 0) <> 1
             AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
             AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
             AND COALESCE(fa.relief_status, 0) = 0
        THEN 'Relief Pending'
        WHEN COALESCE(fa.relief_status, 0) IN (1,2,3)
        THEN 'Relief Given'
        ELSE 'Relief Pending'
    END AS fir_status,

    CASE 
        WHEN fa.status >= 5
             AND COALESCE(fa.HascaseMF, 0) <> 1
             AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
             AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
             AND COALESCE(fa.relief_status, 0) = 0
        THEN DATEDIFF(CURDATE(), fa.date_of_registration)
    END AS fir_pending_days,

    -- Chargesheet stage status
    CASE 
        WHEN fa.status >= 6
             AND COALESCE(fa.HascaseMF, 0) <> 1
             AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
             AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
             AND COALESCE(fa.relief_status, 0) NOT IN (2,3)
        THEN 'Relief Pending'
        WHEN COALESCE(fa.relief_status, 0) IN (2,3)
        THEN 'Relief Given'
        ELSE 'Relief Pending'
    END AS chargesheet_status,

    CASE 
        WHEN fa.status >= 6
              AND NOT (COALESCE(fa.HascaseMF, 0) = 1
              AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted')
              AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed'))
             AND COALESCE(fa.relief_status, 0) NOT IN (2,3)
        THEN DATEDIFF(CURDATE(), chargesheet_details.chargesheetDate)
    END AS chargesheet_pending_days,

    -- Trial stage status
    CASE 
        WHEN fa.status = 7
             AND COALESCE(fa.HascaseMF, 0) <> 1
             AND COALESCE(chargesheet_details.case_type, '') NOT IN ('referredChargeSheet','firQuashed','sectionDeleted')
             AND COALESCE(case_details.judgementNature, '') NOT IN ('Charge_Abated','Quashed')
             AND COALESCE(fa.relief_status, 0) <> 3
        THEN 'Relief Pending'
        WHEN COALESCE(fa.relief_status, 0) = 3
        THEN 'Relief Given'
        ELSE 'Relief Pending'
    END AS trial_status,

    CASE 
        WHEN fa.status = 7
              AND NOT (COALESCE(fa.HascaseMF, 0) = 1 
              AND COALESCE(chargesheet_details.case_type, NULL) IN ('referredChargeSheet','firQuashed','sectionDeleted') 
              AND COALESCE(case_details.judgementNature, NULL) IN ('Charge_Abated', 'Quashed'))
             AND COALESCE(fa.relief_status, 0) <> 3
        THEN DATEDIFF(CURDATE(), case_details.Judgement_Date)
    END AS trial_pending_days,

    -- Proposal status flags
    CASE WHEN fa.status >= 5 THEN 'Yes' ELSE 'No' END AS fir_proposal_status, 
    CASE WHEN fa.status >= 6 THEN 'Yes' ELSE 'No' END AS chargesheet_proposal_status, 
    CASE WHEN fa.status >= 7 THEN 'Yes' ELSE 'No' END AS trial_proposal_status

FROM fir_add fa
LEFT JOIN chargesheet_details 
       ON chargesheet_details.fir_id = fa.fir_id
LEFT JOIN case_details 
       ON case_details.fir_id = fa.fir_id
       ${whereClause} ${condition}`;
      
    console.log(query);
    // Execute Query
    db.query(query, params, (err, results) => {
      if (err) {
        console.error('Error fetching district relief data:', err);
        return res.status(500).json({ 
          message: 'Failed to retrieve district relief data', 
          error: err 
        });
      }

      res.status(200).json({
        data: results
      });
    });

  }
  catch(error){
    console.error("Error in getMonthly reports:", error);
    res.status(500).json({ error: "Failed to get Monthly reports." });
  }
}