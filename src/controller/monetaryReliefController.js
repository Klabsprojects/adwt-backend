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
