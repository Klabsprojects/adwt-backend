// firListController.js

// Import database connection (Assuming you're using a MySQL or other relational database)
const { on } = require('nodemailer/lib/xoauth2');
const db = require('../db'); // Adjust the path to your actual DB config

// Controller to fetch all FIRs
exports.getFirList = (req, res) => {
  //console.log("Fetching FIR list"); // For debugging, this should log to your backend console
  const query = `SELECT id, fir_id, police_city, police_station, fir_number, created_by, created_at, status, relief_status FROM fir_add ORDER BY created_at DESC`; // Fetch all FIRs sorted by created_at

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

  const query10 =`SELECT * FROM fir_add f 
  LEFT JOIN case_court_detail_one cdo ON f.fir_id = cdo.fir_id 
  WHERE f.fir_id = ?`;

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

        console.log(query4,fir_id)

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