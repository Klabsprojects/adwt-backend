const db = require("../db"); // DB connection

// Fetches monthly report details from the database, including FIR information, victim details, chargesheet details, and report reasons for the current and previous month.
exports.getmonthlyreportdetail = async (req, res) => {
  let query = `
  SELECT 
    fa.police_city, 
    fa.police_station, 
    fa.fir_number, 
    fa.number_of_victim, 
    fa.status, 
    DATE_FORMAT(fa.date_of_registration, '%Y-%m-%d') AS date_of_registration,
    DATE_FORMAT(rr.report_month, '%Y-%m-%d') AS report_month, -- Include report_month

    -- Aggregate victim details to avoid duplicate rows
    GROUP_CONCAT(DISTINCT 
      REPLACE(REPLACE(v.offence_committed, '[', ''), ']', '') 
      ORDER BY v.offence_committed SEPARATOR ', ') AS offence_committed, 

    GROUP_CONCAT(DISTINCT 
      REPLACE(REPLACE(v.scst_sections, '[', ''), ']', '') 
      ORDER BY v.scst_sections SEPARATOR ', ') AS scst_sections,

    -- Aggregate chargesheet details
    GROUP_CONCAT(DISTINCT cd.court_district ORDER BY cd.court_district SEPARATOR ', ') AS court_district, 
    GROUP_CONCAT(DISTINCT cd.court_name ORDER BY cd.court_name SEPARATOR ', ') AS court_name, 
    GROUP_CONCAT(DISTINCT cd.case_number ORDER BY cd.case_number SEPARATOR ', ') AS case_number,

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
     LIMIT 1) AS previous_month_reason_for_status,

    -- Calculate pending trial case days when status is 6 or greater
    CASE 
      WHEN fa.status >= 6 THEN DATEDIFF(CURDATE(), fa.date_of_registration)
      ELSE NULL 
    END AS pending_trial_case_days,

    -- Calculate under investigation case days when status is 5 or less
    CASE 
      WHEN fa.status <= 5 THEN DATEDIFF(CURDATE(), fa.date_of_registration)
      ELSE NULL 
    END AS under_investigation_case_days

  FROM fir_add fa
  LEFT JOIN victims v ON fa.fir_id = v.fir_id
  LEFT JOIN chargesheet_details cd ON fa.fir_id = cd.fir_id
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
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};
