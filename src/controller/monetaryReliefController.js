const db = require("../db"); // DB connection

// Retrieves monetary relief details related to FIRs, including police station information, victim details, and the latest status update reasons for the current and previous month.
exports.getmonetaryReliefDetails = async (req, res) => {
  let query = `
  SELECT 
    fa.police_city, 
    fa.police_station, 
    fa.fir_number, 
    fa.status, 
    v.victim_name,
    DATE_FORMAT(rr.report_month, '%Y-%m-%d') AS report_month, -- Include report_month

    -- Aggregate victim details to avoid duplicate rows
    GROUP_CONCAT(DISTINCT 
      REPLACE(REPLACE(v.offence_committed, '[', ''), ']', '') 
      ORDER BY v.offence_committed SEPARATOR ', ') AS offence_committed, 

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
