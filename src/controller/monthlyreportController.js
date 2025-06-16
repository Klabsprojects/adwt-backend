const db = require("../db"); // DB connection

// Fetches monthly report details from the database, including FIR information, victim details, chargesheet details, and report reasons for the current and previous month.


exports.getmonthlyreportdetail = async (req, res) => {
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
      us.name AS created_by, 
      DATE_FORMAT(fa.created_at, '%Y-%m-%d') AS created_at,
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
    GROUP BY fa.fir_id
    ORDER BY fa.created_at DESC;
  `;

  const params = [];

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

      res.status(200).json({ data: results });
    });
  } catch (error) {
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};

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

exports.MonnthlyUpdate = async (req, res) => {
  let Reason = req.body.Reason;
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
          SET reason_for_status = ?, updated_at = NOW() 
          WHERE fir_id = ? 
            AND MONTH(report_month) = MONTH(CURDATE()) 
            AND YEAR(report_month) = YEAR(CURDATE())
        `;
        const updateParams = [Reason, fir_id];

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
          (fir_id, report_month, reason_for_status, created_at, updated_at)
          VALUES (?, CURDATE(), ?, NOW(), NOW())
        `;
        const insertParams = [fir_id, Reason];

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
