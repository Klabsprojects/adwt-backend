// firListController.js

// Import database connection (Assuming you're using a MySQL or other relational database)
const { on } = require('nodemailer/lib/xoauth2');
const db = require('../db'); // Adjust the path to your actual DB config

// Controller to fetch all FIRs
exports.getFirList = (req, res) => {
  //console.log("Fetching FIR list"); // For debugging, this should log to your backend console
  const query = `SELECT id, fir_id, police_city, police_station, concat(fir_number,'/',fir_number_suffix) fir_number, created_by, created_at, status, relief_status, Offence_group FROM fir_add ORDER BY created_at DESC`; // Fetch all FIRs sorted by created_at

  db.query(query, (err, results) => {
    if (err) {
      //console.error('Database error:', err); // Log the error in case of a DB error
      return res.status(500).json({ message: 'Failed to retrieve FIR list', error: err });
    }
    if (results.length === 0) {
      //console.log('No FIRs found'); // Log that no FIRs were found
      return res.status(404).json({ message: 'No FIRs found' });
    }
    //console.log('FIR list fetched:', results); // Log the results
    res.status(200).json(results); // Return the results to the client
  });
};


// exports.getFirListPaginated = (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 50;
//   const offset = (page - 1) * pageSize;
  
//   // Build WHERE clause based on provided filters
//   let whereClause = '';
//   const params = [];
  
//   if (req.query.district) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     whereClause += 'police_city = ?';
//     params.push(req.query.district);
//   }
  
//   if (req.query.status) {
//     whereClause += whereClause ? ' AND ' : ' WHERE ';
//     if (req.query.status == 0) {
//       whereClause += 'status >= 0 AND status <= 5';
//     } else {
//       whereClause += 'status = ?';
//       params.push(req.query.status);
//     }
//   }
  
//   // Count total records first
//   const countQuery = `SELECT COUNT(*) as total FROM fir_add${whereClause}`;
  
//   db.query(countQuery, params, (err, countResults) => {
//     if (err) {
//       return res.status(500).json({ message: 'Failed to count FIR records', error: err });
//     }
    
//     const total = countResults[0].total;
    
//     // If no records, return empty array with count
//     if (total === 0) {
//       return res.status(200).json({ 
//         data: [], 
//         total: 0, 
//         page: page,
//         pageSize: pageSize
//       });
//     }
    
//     // Get paginated records
//     const query = `SELECT id, fir_id, police_city, police_station, 
//                   concat(fir_number,'/',fir_number_suffix) fir_number, 
//                   created_by, created_at, status, relief_status 
//                   FROM fir_add${whereClause} 
//                   ORDER BY created_at DESC 
//                   LIMIT ? OFFSET ?`;
    
//     // Add the LIMIT and OFFSET parameters
//     const queryParams = [...params, pageSize, offset];
    
//     db.query(query, queryParams, (err, results) => {
//       if (err) {
//         return res.status(500).json({ message: 'Failed to retrieve FIR list', error: err });
//       }
      
//       // Return paginated data with metadata
//       res.status(200).json({
//         data: results,
//         total: total,
//         page: page,
//         pageSize: pageSize
//       });
//     });
//   });
// };


exports.getPoliceRanges = (req, res) => {
  const query = " SELECT distinct police_range FROM fir_add order by police_range ASC";
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};

exports.getRevenue_district = (req, res) => {
  const query = " SELECT distinct revenue_district FROM fir_add order by revenue_district ASC";
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(result);
  });
};



// exports.getFirListPaginated = (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;
//   const offset = (page - 1) * pageSize;
  
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
  
//   // Add other filters as needed
  
//   // Count total records query
//   const countQuery = `SELECT COUNT(*) as total FROM fir_add${whereClause}`;
  
//   db.query(countQuery, params, (err, countResults) => {
//     if (err) {
//       return res.status(500).json({ 
//         message: 'Failed to count FIR records', 
//         error: err 
//       });
//     }
    
//     const total = countResults[0].total;
    
//     // If no records found
//     if (total === 0) {
//       return res.status(200).json({
//         data: [],
//         total: 0,
//         page: page,
//         pageSize: pageSize,
//         totalPages: 0
//       });
//     }
    
//     // Calculate total pages
//     const totalPages = Math.ceil(total / pageSize);
    
//     // Ensure the page is within valid range
//     const validPage = Math.min(Math.max(1, page), totalPages);
//     const validOffset = (validPage - 1) * pageSize;
    
//     // Get paginated data query
//     // const query = `
//     // SELECT ROW_NUMBER() OVER () AS row_num, id, fir_id, DATE_FORMAT(date_of_registration, "%Y") as year , police_city, police_station, police_zone, police_range, revenue_district,  officer_name, complaintReceivedType, complaintRegisteredBy, complaintReceiverName, officer_designation, place_of_occurrence,  DATE_FORMAT(date_of_registration, '%d/%m/%Y') AS date_of_registration,  nature_of_judgement,  DATE_FORMAT(date_of_occurrence, '%d/%m/%Y') AS date_of_occurrence,  time_of_occurrence, DATE_FORMAT(date_of_occurrence_to, '%d/%m/%Y') AS date_of_occurrence_to, time_of_occurrence_to , time_of_registration, name_of_complainant, Offence_group,
//     //               concat(fir_number,'/',fir_number_suffix) fir_number, 
//     //               created_by, created_at, status, relief_status 
//     //               FROM fir_add${whereClause} 
//     //               ORDER BY created_at DESC 
//     //               LIMIT ? OFFSET ?
//     //               `;

//           const query = `
//                     SELECT ROW_NUMBER() OVER () AS row_num, 
//                       fir_add.id, 
//                       fir_add.fir_id, 
//                       DATE_FORMAT(fir_add.date_of_registration, "%Y") as year, 
//                       fir_add.police_city, 
//                       fir_add.police_station, 
//                       fir_add.police_zone, 
//                       fir_add.police_range, 
//                       fir_add.revenue_district,  
//                       fir_add.officer_name, 
//                       fir_add.complaintReceivedType, 
//                       fir_add.complaintRegisteredBy, 
//                       fir_add.complaintReceiverName, 
//                       fir_add.officer_designation, 
//                       fir_add.place_of_occurrence,  
//                       DATE_FORMAT(fir_add.date_of_registration, '%d/%m/%Y') AS date_of_registration,  
//                       fir_add.nature_of_judgement,  
//                       DATE_FORMAT(fir_add.date_of_occurrence, '%d/%m/%Y') AS date_of_occurrence,  
//                       fir_add.time_of_occurrence, 
//                       DATE_FORMAT(fir_add.date_of_occurrence_to, '%d/%m/%Y') AS date_of_occurrence_to, 
//                       fir_add.time_of_occurrence_to, 
//                       fir_add.time_of_registration, 
//                       fir_add.name_of_complainant, 
//                       fir_add.Offence_group,
//                       CONCAT(fir_add.fir_number,'/',fir_add.fir_number_suffix) fir_number, 
//                       users.name AS created_by, 
//                       fir_add.created_at, 
//                       fir_add.status, 
//                       fir_add.relief_status ,
//                       fir_add.case_altered_status
//                 FROM fir_add
//                 LEFT JOIN users ON users.id = fir_add.created_by
//                 ${whereClause} 
//                 ORDER BY fir_add.created_at DESC 
//                 LIMIT ? OFFSET ?
//           `;
    
//     const queryParams = [...params, pageSize, validOffset];

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
//       res.status(200).json({
//         data: results,
//         total: total,
//         page: validPage,
//         pageSize: pageSize,
//         totalPages: totalPages
//       });
//     });
//   });
// };


// enhanced version
// exports.getFirListPaginated = (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;
//   const offset = (page - 1) * pageSize;

//   const conditions = [];
//   const params = [];

//   const addCondition = (sql, value, wildcard = false) => {
//     conditions.push(sql);
//     params.push(wildcard ? `%${value}%` : value);
//   };

//   const { search, district, police_zone, police_range, revenue_district, Offence_group,
//           complaintReceivedType, start_date, end_date, UIPT, status, year, created_at, modified_at, 
//           CreatedATstartDate, CreatedATendDate, ModifiedATstartDate, ModifiedATDate, legacy, 
//           policeStation, caste, community, statusOfCase, sectionOfLaw, court, convictionType, 
//           chargesheetDate, hasLegalObtained, caseFitForAppeal, filedBy, appealCourt, dataEntryStatus, 
//           chargesheetFromDate, chargesheetToDate } = req.query;

//   if (search) {
//     conditions.push(`(
//       fir_add.fir_id LIKE ? OR
//       CONCAT(fir_add.fir_number, '/', fir_add.fir_number_suffix) = ? OR
//       fir_add.revenue_district LIKE ? OR
//       fir_add.police_city LIKE ? OR
//       fir_add.police_station LIKE ?
//     )`);
//     params.push(`%${search}%`, search, `%${search}%`, `%${search}%`, `%${search}%`);
//   }

//   if (district) addCondition('fir_add.police_city = ?', district);
//   if (police_zone) addCondition('fir_add.police_zone = ?', police_zone);
//   if (police_range) addCondition('fir_add.police_range = ?', police_range);
//   if (revenue_district) addCondition('fir_add.revenue_district = ?', revenue_district);
//   if (Offence_group) addCondition('fir_add.Offence_group = ?', Offence_group);
//   if (complaintReceivedType) addCondition('fir_add.complaintReceivedType = ?', complaintReceivedType);
//   if (start_date) addCondition('DATE(fir_add.date_of_registration) >= ?', start_date);
//   if (end_date) addCondition('DATE(fir_add.date_of_registration) <= ?', end_date);
//   if (CreatedATstartDate) addCondition('DATE(fir_add.created_at) >= ?', CreatedATstartDate);
//   if (CreatedATendDate) addCondition('DATE(fir_add.created_at) <= ?', CreatedATendDate);
//   if (ModifiedATstartDate) addCondition('DATE(fir_add.updated_at) >= ?', ModifiedATstartDate);
//   if (ModifiedATDate) addCondition('DATE(fir_add.updated_at) <= ?', ModifiedATDate);
//   if (chargesheetFromDate) addCondition('DATE(chargesheet_details.chargesheetDate) >= ?', chargesheetFromDate);
//   if (chargesheetToDate) addCondition('DATE(chargesheet_details.chargesheetDate) <= ?', chargesheetToDate);
//   // if (created_at) addCondition('DATE_FORMAT(fa.created_at, "%Y-%m-%d") = ?', created_at);
//   // if (modified_at) addCondition('DATE_FORMAT(fa.updated_at, "%Y-%m-%d") = ?', modified_at);
//   //added by mohan02/aug/2025
//   if (policeStation) addCondition('fir_add.police_station = ?', policeStation);

//   let addingPTDetails = "";
//   let addingCaseDetails = "";
//   let addingChargeSheet = "";
//   let addingAppealDetails = "";
//   let addingOffenceActs = "";
//   let addingVictims = "";
//   let groupByClause = "";

//   let joinconditions = [];

//   if (chargesheetFromDate || chargesheetToDate || 
//     (statusOfCase && 
//       (statusOfCase === "FirQuashed" || statusOfCase === "MF" || statusOfCase === "SectionDeleted" || statusOfCase === "ChargeAbated"))) {
//   // Only once
//     addingChargeSheet = `LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`;
//   }
  
//   if (statusOfCase) {
//     if (statusOfCase === 'UI') {
//       conditions.push('fir_add.status <= 5');
//     } else if (statusOfCase === 'PT') {
//       addingPTDetails = `LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id 
//       LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`;

//       conditions.push('fir_add.status >= 6');
//       conditions.push(`case_details.judgement_awarded = 'no'`);
//       conditions.push(`chargesheet_details.case_type = 'chargeSheet'`);
      
//       //add case_details table judgement_awarded - "no" & chargesheet_details table - case_type = "chargeSheet"
//     }
//   }
//   // 3. Conviction - Stage 7 - FNo: 87  => table - case_Details `judgementNature` = 'Convicted'
//   // 4. Acquitted - - Stage 7 - FNo: 87 => table - case_Details `judgementNature` = 'Acquitted'
//   // 5. FIR Quashed - Stage 6 - FNo:66 => chargesheet_details table - case_type = "rcs"
//   // 6. MF - Stage 6 - FNo:66 Value RCS, FIR Stage 5 - MF Check Box => if mf is true or chargesheet_details table - case_type = "rcs"
//   // 7. Section Deleted - Stage 6 - FNo:66 => chargesheet_details table - case_type = "rcs"
//   // 8. Charge Abated - Stage 7 - FNo: 87 => table - case_Details `judgementNature` = 'Convicted'
//   // 9. Quashed - Stage 7 - FNo: 87  => table - case_Details `judgementNature` = 'Convicted'
//   // Section of Law - get from offence_acts table use left join fir_add.offence_group
//   // Court - 
//   // conviction type => FROM `case_details` WHERE `fir_id` = 'qp1IRA' ORDER BY `Conviction_Type`
//   // chargesheetdate => table - chargesheet_details - chargesheetDate
//   // has legal => table - appeal_details - legal_opinion_obtained no, yes
//   // Is the Case Fit for Appeal => table - appeal_details - case_fit_for_appeal - yes, no
//   // Who has filed the appeal => table - appeal_details - filed_by - government,victim,no appeal yet
//   // Appeal Court (High Court/ Supreme Court) => table - appeal_details - designated_court - highCourt
//   // Judgement type - Need to get clarification from department

//   // 3. Conviction
//   if (statusOfCase == "Convicted") {
//     addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`;
//     conditions.push(`case_details.judgementNature = 'Convicted'`);
//   }

//   // 4. Acquitted
//   if (statusOfCase == "Acquitted") {
//     addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`;
//     conditions.push(`case_details.judgementNature = 'Acquitted'`);
//   }

//   // 5. FIR Quashed
//   if (statusOfCase == "FirQuashed") {
//     conditions.push(`chargesheet_details.case_type = 'firQuashed'`);
//   }

//   // 6. MF
//   if (statusOfCase == "MF") {
//     conditions.push(`(fir_add.HascaseMF = 1 OR chargesheet_details.case_type = 'referredChargeSheet')`);
//   }

//   // 7. Section Deleted (same as RCS)
//   if (statusOfCase == "SectionDeleted") {
//     conditions.push(`chargesheet_details.case_type = 'sectionDeleted'`);
//   }

//   // 8 & 9. Charge Abated / Quashed (Stage 7, judgementNature = Convicted)
//   if (statusOfCase == "Charge_Abated") {
//     addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`;
//     conditions.push(`case_details.judgementNature = 'Charge_Abated'`);
//   }

//   if (statusOfCase == "Quashed") {
//     addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`;
//     conditions.push(`case_details.judgementNature = 'Quashed'`);
//   }

//   // Section of Law
//   if (sectionOfLaw) {
//     addingOffenceActs = `LEFT JOIN offence_acts ON offence_acts.group_code = fir_add.offence_group`;
//     conditions.push(`offence_acts.group_code = '${sectionOfLaw}'`);
//   }

//   // Court
//   if (court) {
//     addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`;
//     conditions.push(`case_details.court_name = '${court}'`);
//   }

//   // Conviction Type
//   if (convictionType) {
//     addingCaseDetails = `LEFT JOIN case_details ON case_details.fir_id = fir_add.fir_id`;
//     conditions.push(`case_details.Conviction_Type = '${convictionType}'`);
//   }
  
//   // Chargesheet Date
//   // if (chargesheetDate) {
//   //   addingChargeSheet = `LEFT JOIN chargesheet_details ON chargesheet_details.fir_id = fir_add.fir_id`;
//   //   conditions.push(`chargesheet_details.chargesheetDate = '${chargesheetDate}'`);
//   // }

//   // Has Legal
//   if (hasLegalObtained) {
//     addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`;
//     conditions.push(`appeal_details.legal_opinion_obtained = '${hasLegalObtained}'`);
//   }

//   // Fit for Appeal
//   if (caseFitForAppeal) {
//     addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`;
//     conditions.push(`appeal_details.case_fit_for_appeal = '${caseFitForAppeal}'`);
//   }

//   // Filed By
//   if (filedBy) {
//     addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`;
//     conditions.push(`appeal_details.filed_by = '${filedBy}'`);
//   }

//   // Appeal Court
//   if (appealCourt) {
//     addingAppealDetails = `LEFT JOIN appeal_details ON appeal_details.fir_id = fir_add.fir_id`;
//     conditions.push(`appeal_details.designated_court = '${appealCourt}'`);
//   }

//   if(caste || community){
//     addingVictims = `LEFT JOIN victims ON victims.fir_id = fir_add.fir_id`;
//     if(community) conditions.push(`victims.community = '${community}'`);
//     if(caste) conditions.push(`victims.caste = '${caste}'`);
//     groupByClause = `GROUP BY fir_add.fir_id`;
//   }

//   // Combine all joins
//   let joins = [
//     addingPTDetails,
//     addingVictims,
//     addingCaseDetails,
//     addingChargeSheet,
//     addingAppealDetails,
//     addingOffenceActs
//   ].filter(Boolean).join(" ");

//   if (dataEntryStatus) {
//       addCondition('fir_add.status = ?', dataEntryStatus);
//   }

//   if (year) addCondition('DATE_FORMAT(fir_add.date_of_registration, "%Y") = ?', year);

//   if (legacy == "yes") {
//     console.log("legacy", legacy);
//     const legacyDate = '2025-03-20 09:18:11';
//     addCondition('fir_add.created_at = ?', legacyDate);
//   }

//   const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

//   console.log(joins,"---",whereClause,"----",groupByClause);
//   if(caste || community){
//     countQuery = `SELECT COUNT(*) AS total
//     FROM (
//       SELECT fir_add.fir_id
//       FROM fir_add ${joins} ${whereClause} ${groupByClause} ) AS sub`;
//   }
//   else{
//     countQuery = `SELECT COUNT(*) AS total FROM fir_add ${joins} ${whereClause} ${groupByClause}`;
//   }
//   console.log("countQuery", countQuery);
//   db.query(countQuery, params, (err, countResults) => {
//     if (err) return res.status(500).json({ message: 'Count query failed', error: err });
//     console.log("countResults", countResults);
//     //const total = countResults[0].total;
//     const total = countResults.length != 0 ? countResults[0].total : 0;
//     if (total === 0) {
//       return res.status(200).json({ data: [], total: 0, page, pageSize, totalPages: 0 });
//     }

//     const totalPages = Math.ceil(total / pageSize);
//     const validPage = Math.min(Math.max(1, page), totalPages);
//     const validOffset = (validPage - 1) * pageSize;

//     const query = `
//       SELECT 
//       ROW_NUMBER() OVER () AS row_num,
//         fir_add.id, fir_add.fir_id,
//         DATE_FORMAT(fir_add.date_of_registration, "%Y") AS year,
//         fir_add.police_city, fir_add.police_station,
//         fir_add.police_zone, fir_add.police_range,
//         fir_add.revenue_district, fir_add.officer_name,
//         fir_add.complaintReceivedType, fir_add.complaintRegisteredBy,
//         fir_add.complaintReceiverName, fir_add.officer_designation,
//         fir_add.place_of_occurrence,
//         DATE_FORMAT(fir_add.date_of_registration, '%d/%m/%Y') AS date_of_registration,
//         fir_add.nature_of_judgement,
//         DATE_FORMAT(fir_add.date_of_occurrence, '%d/%m/%Y') AS date_of_occurrence,
//         fir_add.time_of_occurrence,
//         DATE_FORMAT(fir_add.date_of_occurrence_to, '%d/%m/%Y') AS date_of_occurrence_to,
//         fir_add.time_of_occurrence_to, fir_add.time_of_registration,
//         fir_add.name_of_complainant, fir_add.Offence_group,
//         CONCAT(fir_add.fir_number,'/',fir_add.fir_number_suffix) AS fir_number,
//         users.name AS created_by,
//         DATE_FORMAT(fir_add.created_at, '%d/%m/%Y') AS created_at,
//         DATE_FORMAT(fir_add.updated_at, '%d/%m/%Y') AS modified_at,
//         fir_add.status,
//         fir_add.relief_status, fir_add.case_altered_status,
//         fir_add.HascaseMF, fir_add.is_case_altered,
//         fir_add.altered_date
//       FROM fir_add
//       LEFT JOIN users ON users.id = fir_add.created_by
//       ${joins} ${whereClause} ${groupByClause}
//       ORDER BY fir_add.created_at DESC
//       LIMIT ? OFFSET ?
//     `;
// console.log("query", query);
//  db.query(query, [...params, pageSize, validOffset], (err, results) => {
//       if (err) return res.status(500).json({ message: 'Data query failed', error: err });

//       res.status(200).json({
//         data: results,
//         total,
//         page: validPage,
//         pageSize,
//         totalPages
//       });
//     });
//   });
// };

// latest version 
exports.getFirListPaginated = (req, res) => {
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
    chargesheetFromDate, chargesheetToDate
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
    FINAL WHERE + JOINS
  ------------------------------------------------------- */
  const whereClause = conditionsSet.size ? `WHERE ${[...conditionsSet].join(' AND ')}` : '';
  const joins = [...joinsSet].join(" ");

  /* -------------------------------------------------------
    COUNT + DATA QUERIES
  ------------------------------------------------------- */
  let countQuery;
  if (caste || community) {
    countQuery = `SELECT COUNT(*) AS total
      FROM (
        SELECT fir_add.fir_id
        FROM fir_add ${joins} ${whereClause} ${groupByClause} ) AS sub`;
  } else {
    countQuery = `SELECT COUNT(*) AS total FROM fir_add ${joins} ${whereClause} ${groupByClause}`;
  }

  db.query(countQuery, params, (err, countResults) => {
    if (err) return res.status(500).json({ message: 'Count query failed', error: err });

    const total = countResults.length !== 0 ? countResults[0].total : 0;
    if (total === 0) {
      return res.status(200).json({ data: [], total: 0, page, pageSize, totalPages: 0 });
    }

    const totalPages = Math.ceil(total / pageSize);
    const validPage = Math.min(Math.max(1, page), totalPages);
    const validOffset = (validPage - 1) * pageSize;

    const query = `
      SELECT 
        ROW_NUMBER() OVER () AS row_num,
        fir_add.id, fir_add.fir_id,
        DATE_FORMAT(fir_add.date_of_registration, "%Y") AS year,
        fir_add.police_city, fir_add.police_station,
        fir_add.police_zone, fir_add.police_range,
        fir_add.revenue_district, fir_add.officer_name,
        fir_add.complaintReceivedType, fir_add.complaintRegisteredBy,
        fir_add.complaintReceiverName, fir_add.officer_designation,
        fir_add.place_of_occurrence,
        DATE_FORMAT(fir_add.date_of_registration, '%d/%m/%Y') AS date_of_registration,
        fir_add.nature_of_judgement,
        DATE_FORMAT(fir_add.date_of_occurrence, '%d/%m/%Y') AS date_of_occurrence,
        fir_add.time_of_occurrence,
        DATE_FORMAT(fir_add.date_of_occurrence_to, '%d/%m/%Y') AS date_of_occurrence_to,
        fir_add.time_of_occurrence_to, fir_add.time_of_registration,
        fir_add.name_of_complainant, fir_add.Offence_group,
        CONCAT(fir_add.fir_number,'/',fir_add.fir_number_suffix) AS fir_number,
        users.name AS created_by,
        DATE_FORMAT(fir_add.created_at, '%d/%m/%Y') AS created_at,
        DATE_FORMAT(fir_add.updated_at, '%d/%m/%Y') AS modified_at,
        fir_add.status,
        fir_add.relief_status, fir_add.case_altered_status,
        fir_add.HascaseMF, fir_add.is_case_altered,
        fir_add.altered_date
      FROM fir_add
      LEFT JOIN users ON users.id = fir_add.created_by
      ${joins} ${whereClause} ${groupByClause}
      ORDER BY fir_add.created_at DESC
      LIMIT ? OFFSET ?
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
}


// view
exports.getFirView = async (req, res)  => {
  const { fir_id } = req.query;

  const query1 = `SELECT * FROM fir_add f  
  LEFT JOIN victims v ON f.fir_id = v.fir_id 
  WHERE f.fir_id = ?`;

  const query2 =`SELECT * FROM fir_add f 
  LEFT JOIN accuseds a ON f.fir_id = a.fir_id 
  WHERE f.fir_id = ?`;

  const query3 =`SELECT * FROM fir_add f 
  LEFT JOIN victim_relief vr ON f.fir_id = vr.fir_id 
  WHERE f.fir_id = ?`;

  const query4 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN case_details cd 
    ON f.fir_id COLLATE utf8mb4_general_ci = cd.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;


  const query5 =`SELECT * FROM fir_add f 
  LEFT JOIN fir_trial ft ON f.fir_id = ft.fir_id 
  WHERE f.fir_id = ?`;

  const query6 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN case_details h 
    ON f.fir_id COLLATE utf8mb4_general_ci = h.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;


  const query7 =`SELECT * FROM fir_add f WHERE f.fir_id = ?`;

  const query8 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN trial_relief tr 
    ON f.fir_id COLLATE utf8mb4_general_ci = tr.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;


const query9 = `
SELECT * FROM fir_add f 
LEFT JOIN appeal_details a 
ON f.fir_id = a.fir_id COLLATE utf8mb4_general_ci
WHERE f.fir_id = ?;
`;

  // const query10 =`SELECT * FROM fir_add f 
  // LEFT JOIN case_court_detail_one cdo ON f.fir_id = cdo.fir_id 
  // WHERE f.fir_id = ?`;

  const query10 = `
SELECT * FROM fir_add f 
LEFT JOIN case_court_detail_one cdo 
ON f.fir_id COLLATE utf8mb4_general_ci = cdo.fir_id COLLATE utf8mb4_general_ci
WHERE f.fir_id = ? COLLATE utf8mb4_general_ci;
`;

  const query11 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN case_hearing_detail_one ho 
    ON f.fir_id COLLATE utf8mb4_general_ci = ho.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;

const query12 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN appeal_details_one ao 
    ON CONVERT(f.fir_id USING utf8mb4) = CONVERT(ao.fir_id USING utf8mb4) 
  WHERE CONVERT(f.fir_id USING utf8mb4) = ?;
`;

const query13 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN case_court_details_two cd2 
    ON CONVERT(f.fir_id USING utf8mb4) = CONVERT(cd2.fir_id USING utf8mb4) 
  WHERE CONVERT(f.fir_id USING utf8mb4) = ?;
`;

const query14 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN case_hearing_details_two cdt 
    ON f.fir_id COLLATE utf8mb4_general_ci = cdt.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;

const query15 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN hearing_details_one nxt 
    ON f.fir_id COLLATE utf8mb4_general_ci = nxt.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;

const query16 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN case_hearing_details_two chd2 
    ON f.fir_id COLLATE utf8mb4_general_ci = chd2.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;

const query17 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN case_appeal_details_two ad2 
    ON CONVERT(f.fir_id USING utf8mb4) = CONVERT(ad2.fir_id USING utf8mb4) 
  WHERE CONVERT(f.fir_id USING utf8mb4) = ?;
`;

const query18 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN hearing_details_two nxt1 
    ON f.fir_id COLLATE utf8mb4_general_ci = nxt1.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;

const query19 = `
  SELECT * 
  FROM fir_add f 
  LEFT JOIN hearing_details_three nxt2 
    ON f.fir_id COLLATE utf8mb4_general_ci = nxt2.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;



const query = `
  SELECT * 
  FROM fir_add f  
  LEFT JOIN victims v 
    ON f.fir_id COLLATE utf8mb4_general_ci = v.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN accuseds a 
    ON f.fir_id COLLATE utf8mb4_general_ci = a.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN victim_relief vr 
    ON f.fir_id COLLATE utf8mb4_general_ci = vr.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN attachment_relief ar 
    ON f.fir_id COLLATE utf8mb4_general_ci = ar.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN chargesheet_details cd 
    ON f.fir_id COLLATE utf8mb4_general_ci = cd.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN chargesheet_victims cv 
    ON f.fir_id COLLATE utf8mb4_general_ci = cv.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN trial_relief fr 
    ON f.fir_id COLLATE utf8mb4_general_ci = fr.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN hearing_details_one hdo 
    ON f.fir_id COLLATE utf8mb4_general_ci = hdo.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN hearing_details_two hdt 
    ON f.fir_id COLLATE utf8mb4_general_ci = hdt.fir_id COLLATE utf8mb4_general_ci 
  LEFT JOIN hearing_details_three hd3 
    ON f.fir_id COLLATE utf8mb4_general_ci = hd3.fir_id COLLATE utf8mb4_general_ci 
  WHERE f.fir_id COLLATE utf8mb4_general_ci = ? 
`;

const caseDetails = await queryAsync(`SELECT * FROM case_details WHERE fir_id = ?`, [fir_id]);


const caseCourtDetailOne = await queryAsync(`SELECT * FROM case_court_detail_one WHERE fir_id = ?`, [fir_id]);
const caseCourtDetailsTwo = await queryAsync(`SELECT * FROM case_court_details_two WHERE fir_id = ?`, [fir_id]);
const compensation_details = await queryAsync(`SELECT * FROM compensation_details WHERE fir_id = ?`, [fir_id]);
const compensation_details_1 = await queryAsync(`SELECT * FROM compensation_details_1 WHERE fir_id = ?`, [fir_id]);
const compensation_details_2 = await queryAsync(`SELECT * FROM compensation_details_2 WHERE fir_id = ?`, [fir_id]);





const firDetails = await queryAsync(`SELECT * FROM fir_add WHERE fir_id = ?`, [fir_id]);



const trialDetails = await queryAsync(`SELECT * FROM fir_trial WHERE fir_id = ?`, [fir_id]);


const appealDetails = await queryAsync(`SELECT * FROM appeal_details WHERE fir_id = ?`, [fir_id]);
const appealDetailsOne = await queryAsync(`SELECT * FROM appeal_details_one WHERE fir_id = ?`, [fir_id]);
const caseAppealDetailsTwo = await queryAsync(`SELECT * FROM case_appeal_details_two WHERE fir_id = ?`, [fir_id]);


const hearingDetailsOne = await queryAsync(`SELECT * FROM hearing_details_one WHERE fir_id = ?`, [fir_id]);
const hearingDetailsTwo = await queryAsync(`SELECT * FROM hearing_details_two WHERE fir_id = ?`, [fir_id]);
const hearingDetailsThree = await queryAsync(`SELECT * FROM hearing_details_three WHERE fir_id = ?`, [fir_id]);

  db.query(query1, [fir_id], (err1, results1) => {
    if (err1) {
      return res.status(500).json({ message: 'Database error in query1', error: err1 });
    }

    if (results1.length === 0) {
      return res.status(404).json({ message: 'No FIR found for query1' });
    }

    db.query(query2, [fir_id], (err, results2) => {
      if (err) {
        return res.status(500).json({ message: 'Database error in query2', error: err });
      }
    
      if (results2.length === 0) {
        return res.status(404).json({ message: 'No data found for the given FIR in query2' });
      }

      db.query(query3, [fir_id], (err, results3) => {
        if (err) {
          return res.status(500).json({ message: 'Database error in query3', error: err });
        }
      
        if (results3.length === 0) {
          return res.status(404).json({ message: 'No data found for the given FIR in query3' });
        }

        // console.log(query4,fir_id)

        db.query(query4, [fir_id], (err, results4) => {
          if (err) {
            return res.status(500).json({ message: 'Database error in query4', error: err });
          }
        
          if (results4.length === 0) {
            return res.status(404).json({ message: 'No data found for the given FIR in query4' });
          }

        db.query(query5, [fir_id], (err, results5) => {
          if (err) {
            return res.status(500).json({ message: 'Database error in query5', error: err });
          }
        
          if (results5.length === 0) {
            return res.status(404).json({ message: 'No data found for the given FIR in query5' });
          }

        db.query(query6, [fir_id], (err, results6) => {
          if (err) {
            return res.status(500).json({ message: 'Database error in query6', error: err });
          }
          
          if (results6.length === 0) {
            return res.status(404).json({ message: 'No data found for the given FIR in query6' });
          }

          db.query(query7, [fir_id], (err, results7) => {
            if (err) {
              return res.status(500).json({ message: 'Database error in query7', error: err });
            }
            
            if (results7.length === 0) {
              return res.status(404).json({ message: 'No data found for the given FIR in query7' });
            }

            db.query(query8, [fir_id], (err, results8) => {
              if (err) {
                return res.status(500).json({ message: 'Database error in query8', error: err });
              }
              
              if (results8.length === 0) {
                return res.status(404).json({ message: 'No data found for the given FIR in query8' });
              }

              db.query(query9, [fir_id], (err, results9) => {
                if (err) {
                  return res.status(500).json({ message: 'Database error in query9', error: err });
                }
                
                if (results9.length === 0) {
                  return res.status(404).json({ message: 'No data found for the given FIR in query9' });
                }

                db.query(query10, [fir_id], (err, results10) => {
                  if (err) {
                    return res.status(500).json({ message: 'Database error in query10', error: err });
                  }
                  
                  if (results10.length === 0) {
                    return res.status(404).json({ message: 'No data found for the given FIR in query10' });
                  }

                  db.query(query11, [fir_id], (err, results11) => {
                    if (err) {
                      return res.status(500).json({ message: 'Database error in query11', error: err });
                    }
                    
                    if (results11.length === 0) {
                      return res.status(404).json({ message: 'No data found for the given FIR in query11' });
                    }

                    db.query(query12, [fir_id], (err, results12) => {
                      if (err) {
                        return res.status(500).json({ message: 'Database error in query12', error: err });
                      }
                      
                      if (results12.length === 0) {
                        return res.status(404).json({ message: 'No data found for the given FIR in query12' });
                      }

                      db.query(query13, [fir_id], (err, results13) => {
                        if (err) {
                          return res.status(500).json({ message: 'Database error in query13', error: err });
                        }
                        
                        if (results13.length === 0) {
                          return res.status(404).json({ message: 'No data found for the given FIR in query13' });
                        }

                        db.query(query14, [fir_id], (err, results14) => {
                          if (err) {
                            return res.status(500).json({ message: 'Database error in query14', error: err });
                          }
                          
                          if (results14.length === 0) {
                            return res.status(404).json({ message: 'No data found for the given FIR in query14' });
                          }

                          db.query(query15, [fir_id], (err, results15) => {
                            if (err) {
                              return res.status(500).json({ message: 'Database error in query15', error: err });
                            }
                            
                            if (results15.length === 0) {
                              return res.status(404).json({ message: 'No data found for the given FIR in query15' });
                            }


                            db.query(query16, [fir_id], (err, results16) => {
                              if (err) {
                                return res.status(500).json({ message: 'Database error in query16', error: err });
                              }
                              
                              if (results15.length === 0) {
                                return res.status(404).json({ message: 'No data found for the given FIR in query16' });
                              }


                              db.query(query17, [fir_id], (err, results17) => {
                                if (err) {
                                  return res.status(500).json({ message: 'Database error in query17', error: err });
                                }
                                
                                if (results17.length === 0) {
                                  return res.status(404).json({ message: 'No data found for the given FIR in query17' });
                                }


                                db.query(query18, [fir_id], (err, results18) => {
                                  if (err) {
                                    return res.status(500).json({ message: 'Database error in query18', error: err });
                                  }
                                  
                                  if (results18.length === 0) {
                                    return res.status(404).json({ message: 'No data found for the given FIR in query18' });
                                  }

                                  db.query(query19, [fir_id], (err, results19) => {
                                    if (err) {
                                      return res.status(500).json({ message: 'Database error in query19', error: err });
                                    }
                                    
                                    if (results19.length === 0) {
                                      return res.status(404).json({ message: 'No data found for the given FIR in query19' });
                                    }
      
    
  

    

    db.query(query, [fir_id], (err2, result) => {
      if (err2) {
        return res.status(500).json({ message: 'Database error in query', error: err2 });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: 'No FIR found for query' });
      }

      // Send both results separately
      res.status(200).json({
        queryResults1: results1,
        queryResults2: results2,
        queryResults3: results3,
        queryResults4: results4,
        queryResults5: results5,
        queryResults6: results6,
        queryResults7: results7,
        queryResults8: results8,
        queryResults9: results9,
        queryResults10: results10,
        queryResults11: results11,
        queryResults12: results12,
        queryResults13: results13,
        queryResults14: results14,
        queryResults15: results15,
        queryResults16: results16,
        queryResults17: results17,
        queryResults18: results18,
        queryResults19: results19,
        queryResults: result,
        caseDetails: caseDetails[0] || {},
        courtDetails: {
          caseCourtDetailOne: caseCourtDetailOne[0] || {},
          caseCourtDetailsTwo: caseCourtDetailsTwo[0] || {},
        },
        firDetails: firDetails[0] || {},
        trialDetails: trialDetails[0] || {},
        appealDetails: {
          appealDetails: appealDetails[0] || {},
          appealDetailsOne: appealDetailsOne[0] || {},
          caseAppealDetailsTwo: caseAppealDetailsTwo[0] || {},
        },
        hearingDetails: {
          hearingDetailsOne: hearingDetailsOne || [],
          hearingDetailsTwo: hearingDetailsTwo || [],
          hearingDetailsThree: hearingDetailsThree || [],
        },

        compensation_details :compensation_details,
        compensation_details_1 :compensation_details_1,
        compensation_details_2 :compensation_details_2
      });
    });
    });
    });
    });
    });
    });
  });
  });
  });
  });
  });
  });
});
});
});
});
});
});
});
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

  // Controller to delete a FIR by ID
  exports.deleteFir = (req, res) => {
    const firId = req.params.id;
    const query = `DELETE FROM fir_add WHERE fir_id = ?`;
  
    db.query(query, [firId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete FIR', error: err });
      }
      res.status(200).json({ message: 'FIR deleted successfully' });
    });
  };
  
  // Controller to update FIR status
  exports.updateFirStatus = (req, res) => {
    const firId = req.params.id;
    const { status } = req.body;
    const query = `UPDATE fir_add SET status = ?, updated_at = NOW() WHERE fir_id = ?`;
  
    db.query(query, [status, firId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to update FIR status', error: err });
      }
      res.status(200).json({ message: 'FIR status updated successfully' });
    });
  };