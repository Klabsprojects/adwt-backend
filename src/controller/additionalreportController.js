const db = require("../db"); // DB connection

exports.getadditionalreportdetail = async (req, res) => {
  let query = `SELECT 
    fa.fir_id, 
    fa.police_city AS revenue_district,
    fa.police_station,
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
          .json({ message: "Failed to retrieve data", error: err });
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
