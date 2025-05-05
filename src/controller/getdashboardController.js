const db = require('../db'); // Your database connection


exports.getFilterOptionData = (req, res) => {
    
    const districtQuery = "SELECT district_name FROM district";
    const casteQuery = "SELECT DISTINCT community_name FROM caste_community";
    const subcasteQuery = "SELECT DISTINCT caste_name FROM caste_community";
    const natureQuery = "SELECT offence_name FROM offence";
  
    
    const results = {};
    
    db.query(districtQuery, (err, districtResults) => {
      if (err) {
        return res.status(500).send({ error: "Database query failed for district" });
      }
      results.district = districtResults.map((row) => row.district_name);
  
      db.query(casteQuery, (err, casteResults) => {
        if (err) {
          return res.status(500).send({ error: "Database query failed for caste" });
        }
        results.caste = casteResults.map((row) => row.community_name);
  
        db.query(subcasteQuery, (err, subcasteResults) => {
          if (err) {
            return res.status(500).send({ error: "Database query failed for subcaste" });
          }
          results.subcaste = subcasteResults.map((row) => row.caste_name);
  
          db.query(natureQuery, (err, natureResults) => {
            if (err) {
              return res.status(500).send({ error: "Database query failed for nature" });
            }
            results.nature = natureResults.map((row) => row.offence_name);
  
            // Send the final combined result
            res.json(results);
          });
        });
      });
    });
};
  
exports.applyfilterData = (req, res, next) => {
  const filters = req.body;

  const whereClause = buildWhereClause(filters);

  req.whereClause = whereClause;

  next();
};

const filterMappings = {
  status: { table: 'fir_add', column: 'status' },
  gender: { table: 'victims', column: 'victim_gender' },
  district: { table: 'fir_add', column: 'revenue_district' },
  caste: { table: 'victims', column: 'community' },
  subcaste: { table: 'victims', column: 'caste' },
  fromDate: { table: 'fir_add', column: 'date_of_registration' },
  toDate: { table: 'fir_add', column: 'date_of_registration' }, 
};
const statusValueMapping = {
  UI: "5",
  PT: "6",
};

function buildWhereClause(filters) {
  const conditions = [];

  for (const [filterKey, filterValue] of Object.entries(filters)) {
      if (!filterValue) continue;

      const mapping = filterMappings[filterKey];
      if (!mapping) continue; 

      const { table, column } = mapping;

      if (filterKey === 'status') {
          const mappedValue = statusValueMapping[filterValue] || filterValue;
          conditions.push(`${table}.${column} = '${mappedValue}'`);
      } else if (filterKey === 'fromDate' && filters.toDate) {

          conditions.push(`${table}.${column} BETWEEN '${filters.fromDate}' AND '${filters.toDate}'`);
      } else if (filterKey !== 'toDate') {
        
          conditions.push(`${table}.${column} = '${filterValue}'`);
      }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}


// function buildWhereClause(filters) {
//     const conditions = [];
    
//     if (filters.status) {
//       let statusValue;
  
//       if (filters.status === 'UI') {
//           statusValue = "5";
//       } else if (filters.status === 'PT') {
//           statusValue = "6";
//       }

//       conditions.push(`status = '${statusValue}'`);
//     }
//     if (filters.gender) {
//       conditions.push(`victim_gender = '${filters.gender}'`);
//     }
//     if (filters.district) {
//       conditions.push(`revenue_district = '${filters.district}'`);
//     }
//     if (filters.caste) {
//       conditions.push(`caste = '${filters.caste}'`);
//     }
//     if (filters.subcaste) {
//       conditions.push(`subcaste = '${filters.subcaste}'`);
//     }
//     if (filters.fromDate && filters.toDate) {
//       conditions.push(`date_of_registration BETWEEN '${filters.fromDate}' AND '${filters.toDate}'`);
//     }
  
//     // Combine all conditions with AND
//     return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
//   }
  

exports.getDashboardData = (req, res) => {

  const now = new Date();
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0'); 
      return `${year}-${month}-${day}`;
    };
    const currentDate = formatDate(now);

  const whereClause = req.whereClause;
  console.log('whereClause => ', whereClause); 

  let joinQuery = "";
  let acquitted = "";
  let convicted = "";
  let ptcount = "";
  let linewhere ="";
  let distritmap ="";
  let distritmap1 ="";


  if (whereClause) {
    joinQuery = "INNER JOIN victims ON fir_add.fir_id = victims.fir_id";

    acquitted = "AND nature_of_judgement = 'acquitted'";
    convicted = "AND nature_of_judgement = 'convicted'";

    ptcount = "AND fir_add.status = '6'";
    linewhere = "AND YEAR(fir_add.date_of_registration) BETWEEN YEAR(CURDATE()) - 10 AND YEAR(CURDATE())  GROUP BY YEAR(fir_add.date_of_registration) ORDER BY YEAR(fir_add.date_of_registration)";
  }else{
    acquitted = "WHERE nature_of_judgement = 'acquitted'";
    convicted = "WHERE nature_of_judgement = 'convicted'";

    ptcount = "WHERE status = '6'";

    linewhere = "WHERE YEAR(date_of_registration) BETWEEN YEAR(CURDATE()) - 10 AND YEAR(CURDATE()) GROUP BY YEAR(date_of_registration) ORDER BY YEAR(date_of_registration)";
  }

  let joinQuery1 = "";
  if (whereClause) {
    joinQuery1 = "INNER JOIN fir_add ON fir_add.fir_id = victims.fir_id";
  }


  const totalCasesQuery = `SELECT COUNT(*) AS totalCases FROM fir_add ${joinQuery} ${whereClause}`;
  const pendingTrialsQuery = `SELECT COUNT(*) AS pendingTrials FROM fir_add ${joinQuery} ${whereClause} ${ptcount}`;
  const minorCasesQuery = 'SELECT COUNT(*) AS minorCases FROM fir_add a JOIN victims b ON a.fir_id = b.fir_id WHERE b.victim_age < 18';
  const acquittedQuery = `SELECT COUNT(*) AS acquittedCases FROM fir_add ${joinQuery} ${whereClause} ${acquitted}`;
  const convictedQuery = `SELECT COUNT(*) AS convictedCases FROM fir_add ${joinQuery} ${whereClause} ${convicted}`;

  const query = `
    SELECT
      SUM(CASE WHEN DATEDIFF(?, date_of_registration) < 365 THEN 1 ELSE 0 END) AS less_than_1_year,
      SUM(CASE WHEN DATEDIFF(?, date_of_registration) BETWEEN 365 AND 1825 THEN 1 ELSE 0 END) AS one_to_five_years,
      SUM(CASE WHEN DATEDIFF(?, date_of_registration) BETWEEN 1826 AND 3650 THEN 1 ELSE 0 END) AS six_to_ten_years,
      SUM(CASE WHEN DATEDIFF(?, date_of_registration) BETWEEN 3651 AND 7300 THEN 1 ELSE 0 END) AS eleven_to_twenty_years,
      SUM(CASE WHEN DATEDIFF(?, date_of_registration) > 7300 THEN 1 ELSE 0 END) AS greater_than_twenty_years
    FROM fir_add ${joinQuery} ${whereClause}
  `;


  const query1 = `
    SELECT
      SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) < 2 THEN 1 ELSE 0 END) AS less_than_2_months,
      SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) BETWEEN 2 AND 4 THEN 1 ELSE 0 END) AS two_to_four_months,
      SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) BETWEEN 4 AND 6 THEN 1 ELSE 0 END) AS four_to_six_months,
      SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) BETWEEN 6 AND 12 THEN 1 ELSE 0 END) AS six_to_twelve_months,
      SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) > 12 THEN 1 ELSE 0 END) AS greater_than_one_year
    FROM fir_add ${joinQuery} ${whereClause}
  `;


  const query2 = `
    SELECT 
      COUNT(CASE WHEN status = '5' THEN 1 END) AS fir_count,
      COUNT(CASE WHEN status = '6' THEN 1 END) AS chargesheet_count,
      COUNT(CASE WHEN status = '7' THEN 1 END) AS trial_count
    FROM fir_add ${joinQuery} ${whereClause}
  `;

  const query3 = `
    SELECT 
        SUM(CASE WHEN offence_committed LIKE '%Murder%' OR offence_committed LIKE '%Death%' THEN 1 ELSE 0 END) AS death_count,
        SUM(CASE WHEN offence_committed LIKE '%Gang rape%' OR offence_committed LIKE '%Rape%' OR offence_committed LIKE '%unnatural Offences%' THEN 1 ELSE 0 END) AS rape_count,
        SUM(CASE WHEN offence_committed NOT LIKE '%Murder%' AND offence_committed NOT LIKE '%Death%' AND offence_committed NOT LIKE '%Gang rape%' AND offence_committed NOT LIKE '%Rape%' AND offence_committed NOT LIKE '%unnatural Offences%' THEN 1 ELSE 0 END) AS other_count
    FROM victims ${joinQuery1} ${whereClause}
  `;

  const query4 = `
    SELECT
      SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) <= 365 THEN 1 ELSE 0 END) AS ui_less_than_1_year,
      SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) > 365 AND DATEDIFF(CURDATE(), date_of_registration) <= 1825 THEN 1 ELSE 0 END) AS ui_1_to_5_years,
      SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) > 1825 AND DATEDIFF(CURDATE(), date_of_registration) <= 3650 THEN 1 ELSE 0 END) AS ui_6_to_10_years,
      SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) > 3650 AND DATEDIFF(CURDATE(), date_of_registration) <= 7300 THEN 1 ELSE 0 END) AS ui_11_to_20_years,
      SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) > 7300 THEN 1 ELSE 0 END) AS ui_greater_than_20_years,
      
      SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) <= 365 THEN 1 ELSE 0 END) AS pt_less_than_1_year,
      SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 365 AND DATEDIFF(CURDATE(), date_of_registration) <= 1825 THEN 1 ELSE 0 END) AS pt_1_to_5_years,
      SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 1825 AND DATEDIFF(CURDATE(), date_of_registration) <= 3650 THEN 1 ELSE 0 END) AS pt_6_to_10_years,
      SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 3650 AND DATEDIFF(CURDATE(), date_of_registration) <= 7300 THEN 1 ELSE 0 END) AS pt_11_to_20_years,
      SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 7300 THEN 1 ELSE 0 END) AS pt_greater_than_20_years
    FROM fir_add ${joinQuery} ${whereClause}
  `;

  const query5 = `
    SELECT YEAR(date_of_registration) AS year, COUNT(*) AS pendingTrials
    FROM fir_add
    ${joinQuery} ${whereClause} ${linewhere}
  `;

  if(whereClause){
    distritmap = `SELECT 
      district.district_name AS district_name, 
      COUNT(fir_add.id) AS count
      FROM 
          district
      LEFT JOIN 
          fir_add
      ON 
          district.district_name = fir_add.revenue_district
          ${joinQuery} ${whereClause}
      GROUP BY 
          district.district_name
      ORDER BY 
          count DESC`;
  }else{
    distritmap = `SELECT 
      d.district_name AS district_name, 
      COUNT(f.id) AS count
      FROM 
          district d
      LEFT JOIN 
          fir_add f 
      ON 
          d.district_name = f.revenue_district
          AND f.status >= 6
      GROUP BY 
          d.district_name
      ORDER BY 
          count DESC`;
  }

  const query6 = `
      ${distritmap}
  `;


  if(whereClause){
    distritmap1 = `SELECT 
      district.district_name AS district_name, 
      COUNT(fir_add.id) AS count
      FROM 
          district
      LEFT JOIN 
          fir_add
      ON 
          district.district_name = fir_add.revenue_district
          ${joinQuery} ${whereClause}
      GROUP BY 
          district.district_name
      ORDER BY 
          count DESC`;
  }else{
    distritmap1 = `SELECT 
      d.district_name AS district_name, 
      COUNT(f.id) AS count
      FROM 
          district d
      LEFT JOIN 
          fir_add f 
      ON 
          d.district_name = f.revenue_district
          AND f.status <= 5
      GROUP BY 
          d.district_name
      ORDER BY 
          count DESC`;
  }

  const query7 = `
      ${distritmap1}
  `;


  db.query(query7, (err, results7) => {
    db.query(query6, (err, results6) => {
      db.query(query5, (err, results5) => {
        db.query(query4, (err, results4) => {
          db.execute(query1, (err, results1) => {
            db.execute(query2, (err, results2) => {
              db.execute(query3, (err, results3) => {
                db.execute(query, [currentDate, currentDate, currentDate, currentDate, currentDate], (err, results) => {
                  db.query(totalCasesQuery, (err, totalCasesResult) => {
                    db.query(pendingTrialsQuery, (err, pendingTrialsResult) => {
                      db.query(minorCasesQuery, (err, minorCasesResult) => {
                        db.query(acquittedQuery, (err, acquittedResult) => {
                          db.query(convictedQuery, (err, convictedResult) => {
                            const uiBar = [
                              results4[0].ui_less_than_1_year,
                              results4[0].ui_1_to_5_years,
                              results4[0].ui_6_to_10_years,
                              results4[0].ui_11_to_20_years,
                              results4[0].ui_greater_than_20_years,
                            ];
                            const ptBar = [
                              results4[0].pt_less_than_1_year,
                              results4[0].pt_1_to_5_years,
                              results4[0].pt_6_to_10_years,
                              results4[0].pt_11_to_20_years,
                              results4[0].pt_greater_than_20_years,
                            ];
                            const currentYear = new Date().getFullYear();
                            const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i); 
                            const dataMap = Object.fromEntries(results5.map(row => [row.year, row.pendingTrials]));
                            const labels = years.map(year => year.toString());
                            const data = years.map(year => dataMap[year] || 0);
                            let response = {
                                filteredTotalCases: totalCasesResult[0].totalCases,
                                filteredPendingTrials: pendingTrialsResult[0].pendingTrials,
                                filteredMinorCases: minorCasesResult[0].minorCases,
                                acquittedCases: acquittedResult[0].acquittedCases,
                                convictedCases: convictedResult[0].convictedCases,
                                cases: {
                                  '<1Year': results[0].less_than_1_year,
                                  '1-5Years': results[0].one_to_five_years,
                                  '6-10Years': results[0].six_to_ten_years,
                                  '11-20Years': results[0].eleven_to_twenty_years,
                                  '>20Years': results[0].greater_than_twenty_years
                                },
                                uicases: {
                                  '<2Mos': results1[0].less_than_2_months,
                                  '2-4Mos': results1[0].two_to_four_months,
                                  '4-6Mos': results1[0].four_to_six_months,
                                  '6-12Mos': results1[0].six_to_twelve_months,
                                  '>1Years': results1[0].greater_than_one_year,
                                },
                                piechart1cases: {
                                  'fir': results2[0].fir_count,
                                  'chargesheet': results2[0].chargesheet_count,
                                  'trial': results2[0].trial_count
                                },
                                piechart2cases: {
                                  'death': results3[0].death_count,
                                  'rape': results3[0].rape_count,
                                  'others': results3[0].other_count
                                },
                                uiBar, ptBar,
                                linechartcases: {
                                  'labels': labels,
                                  'datasets': [
                                    {
                                      label: 'Pending Cases',
                                      data: data,
                                    },
                                  ],
                                },
                                map1 : results6,
                                map2 : results7,
                          };
                          
                          if (whereClause === undefined) {
                              // Add these fields if `whereClause` is undefined
                              response.totalCases= totalCasesResult[0].totalCases;
                              response.pendingTrials= pendingTrialsResult[0].pendingTrials;
                              response.minorCases= minorCasesResult[0].minorCases;

                              response.filteredTotalCases = null;
                              response.filteredPendingTrials = null;
                              response.filteredMinorCases = null;
                          }
                          else {
                              response.filteredTotalCases = totalCasesResult[0].totalCases;
                              response.filteredPendingTrials = pendingTrialsResult[0].pendingTrials;
                              response.filteredMinorCases = minorCasesResult[0].minorCases;
                          }
                          
                          res.json(response);
                           
                            // res.json({
                            //     totalCases: totalCasesResult[0].totalCases,
                            //     pendingTrials: pendingTrialsResult[0].pendingTrials,
                            //     minorCases: minorCasesResult[0].minorCases,
                            //     filteredTotalCases: totalCasesResult[0].totalCases,
                            //     filteredPendingTrials: pendingTrialsResult[0].pendingTrials,
                            //     filteredMinorCases: minorCasesResult[0].minorCases,
                            //     acquittedCases: acquittedResult[0].acquittedCases,
                            //     convictedCases: convictedResult[0].convictedCases,
                            //     cases: {
                            //       '<1Year': results[0].less_than_1_year,
                            //       '1-5Years': results[0].one_to_five_years,
                            //       '6-10Years': results[0].six_to_ten_years,
                            //       '11-20Years': results[0].eleven_to_twenty_years,
                            //       '>20Years': results[0].greater_than_twenty_years
                            //     },
                            //     uicases: {
                            //       '<2Mos': results1[0].less_than_2_months,
                            //       '2-4Mos': results1[0].two_to_four_months,
                            //       '4-6Mos': results1[0].four_to_six_months,
                            //       '6-12Mos': results1[0].six_to_twelve_months,
                            //       '>1Years': results1[0].greater_than_one_year,
                            //     },
                            //     piechart1cases: {
                            //       'fir': results2[0].fir_count,
                            //       'chargesheet': results2[0].chargesheet_count,
                            //       'trial': results2[0].trial_count
                            //     },
                            //     piechart2cases: {
                            //       'death': results3[0].death_count,
                            //       'rape': results3[0].rape_count,
                            //       'others': results3[0].other_count
                            //     },
                            //     uiBar, ptBar,
                            //     linechartcases: {
                            //       'labels': labels,
                            //       'datasets': [
                            //         {
                            //           label: 'Pending Cases',
                            //           data: data,
                            //         },
                            //       ],
                            //     },
                            //     map1 : results6,
                            //     map2 : results7,
                            // });
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

// exports.getDashboardYearData = (req, res) => {
//     const now = new Date();
//     const formatDate = (date) => {
//       const year = date.getFullYear();
//       const month = (date.getMonth() + 1).toString().padStart(2, '0');
//       const day = date.getDate().toString().padStart(2, '0'); 
//       return `${year}-${month}-${day}`;
//     };
//     const currentDate = formatDate(now);

//       const whereClause = req.whereClause || "";

//       let joinQuery = "";
//       if (whereClause) {
//         joinQuery = "INNER JOIN victims ON fir_add.fir_id = victims.fir_id";
//       }

//     const query = `
//       SELECT
//         SUM(CASE WHEN DATEDIFF(?, date_of_registration) < 365 THEN 1 ELSE 0 END) AS less_than_1_year,
//         SUM(CASE WHEN DATEDIFF(?, date_of_registration) BETWEEN 365 AND 1825 THEN 1 ELSE 0 END) AS one_to_five_years,
//         SUM(CASE WHEN DATEDIFF(?, date_of_registration) BETWEEN 1826 AND 3650 THEN 1 ELSE 0 END) AS six_to_ten_years,
//         SUM(CASE WHEN DATEDIFF(?, date_of_registration) BETWEEN 3651 AND 7300 THEN 1 ELSE 0 END) AS eleven_to_twenty_years,
//         SUM(CASE WHEN DATEDIFF(?, date_of_registration) > 7300 THEN 1 ELSE 0 END) AS greater_than_twenty_years
//       FROM fir_add ${joinQuery} ${whereClause}
//     `;

//     db.execute(query, [currentDate, currentDate, currentDate, currentDate, currentDate], (err, results) => {
//       if (err) {
//         res.status(500).send({ error: 'Database query failed' });
//       } else {
//         res.json({
//           cases: {
//             '<1Year': results[0].less_than_1_year,
//             '1-5Years': results[0].one_to_five_years,
//             '6-10Years': results[0].six_to_ten_years,
//             '11-20Years': results[0].eleven_to_twenty_years,
//             '>20Years': results[0].greater_than_twenty_years
//           }
//         });
//       }
//     });
// };


// exports.getDashboardMonData = (req, res) => {

//   const whereClause = req.whereClause || "";

//       let joinQuery = "";
//       if (whereClause) {
//         joinQuery = "INNER JOIN victims ON fir_add.fir_id = victims.fir_id";
//       }


//     const query = `
//     SELECT
//       SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) < 2 THEN 1 ELSE 0 END) AS less_than_2_months,
//       SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) BETWEEN 2 AND 4 THEN 1 ELSE 0 END) AS two_to_four_months,
//       SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) BETWEEN 4 AND 6 THEN 1 ELSE 0 END) AS four_to_six_months,
//       SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) BETWEEN 6 AND 12 THEN 1 ELSE 0 END) AS six_to_twelve_months,
//       SUM(CASE WHEN TIMESTAMPDIFF(MONTH, date_of_registration, NOW()) > 12 THEN 1 ELSE 0 END) AS greater_than_one_year
//     FROM fir_add ${joinQuery} ${whereClause}
//   `;

  
//   db.execute(query, (err, results) => {
//     if (err) {
//       return res.status(500).send({ error: 'Database query failed' });
//     }
//     res.json({
//       uicases: {
//         '<2Mos': results[0].less_than_2_months,
//         '2-4Mos': results[0].two_to_four_months,
//         '4-6Mos': results[0].four_to_six_months,
//         '6-12Mos': results[0].six_to_twelve_months,
//         '>1Years': results[0].greater_than_one_year,
//       }
//     });
//   });
// };


// exports.getCaseStatusCounts = (req, res) => {

//   const whereClause = req.whereClause || "";

//   let joinQuery = "";
//   if (whereClause) {
//     joinQuery = "INNER JOIN victims ON fir_add.fir_id = victims.fir_id";
//   }

  
//     const query = `
//       SELECT 
//         COUNT(CASE WHEN status = '5' THEN 1 END) AS fir_count,
//         COUNT(CASE WHEN status = '6' THEN 1 END) AS chargesheet_count,
//         COUNT(CASE WHEN status = '7' THEN 1 END) AS trial_count
//       FROM fir_add ${joinQuery} ${whereClause}
//     `;
//     db.execute(query, (err, results) => {
//       if (err) {
//         return res.status(500).send({ error: 'Database query failed' });
//       }
//       res.json({
//         piechart1cases: {
//           'fir': results[0].fir_count,
//           'chargesheet': results[0].chargesheet_count,
//           'trial': results[0].trial_count
//         }
//       });
//     });
// };


// exports.getCaseStatus1Counts = (req, res) => {

//   const whereClause = req.whereClause || "";

//   let joinQuery = "";
//   if (whereClause) {
//     joinQuery = "INNER JOIN fir_add ON fir_add.fir_id = victims.fir_id";
//   }

//     const query = `
//     SELECT 
//         SUM(CASE WHEN offence_committed LIKE '%Murder%' OR offence_committed LIKE '%Death%' THEN 1 ELSE 0 END) AS death_count,
//         SUM(CASE WHEN offence_committed LIKE '%Gang rape%' OR offence_committed LIKE '%Rape%' OR offence_committed LIKE '%unnatural Offences%' THEN 1 ELSE 0 END) AS rape_count,
//         SUM(CASE WHEN offence_committed NOT LIKE '%Murder%' AND offence_committed NOT LIKE '%Death%' AND offence_committed NOT LIKE '%Gang rape%' AND offence_committed NOT LIKE '%Rape%' AND offence_committed NOT LIKE '%unnatural Offences%' THEN 1 ELSE 0 END) AS other_count
//     FROM victims ${joinQuery} ${whereClause}`;
//     db.execute(query, (err, results) => {
//       if (err) {
//         return res.status(500).send({ error: 'Database query failed' });
//       }
//       res.json({
//         piechart2cases: {
//           'death': results[0].death_count,
//           'rape': results[0].rape_count,
//           'others': results[0].other_count
//         }
//       });
//     });
// };



// exports.getBarChartCounts = (req, res) => {
   
//     const query = `
//     SELECT
//       SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) <= 365 THEN 1 ELSE 0 END) AS ui_less_than_1_year,
//       SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) > 365 AND DATEDIFF(CURDATE(), date_of_registration) <= 1825 THEN 1 ELSE 0 END) AS ui_1_to_5_years,
//       SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) > 1825 AND DATEDIFF(CURDATE(), date_of_registration) <= 3650 THEN 1 ELSE 0 END) AS ui_6_to_10_years,
//       SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) > 3650 AND DATEDIFF(CURDATE(), date_of_registration) <= 7300 THEN 1 ELSE 0 END) AS ui_11_to_20_years,
//       SUM(CASE WHEN status <= 5 AND DATEDIFF(CURDATE(), date_of_registration) > 7300 THEN 1 ELSE 0 END) AS ui_greater_than_20_years,
      
//       SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) <= 365 THEN 1 ELSE 0 END) AS pt_less_than_1_year,
//       SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 365 AND DATEDIFF(CURDATE(), date_of_registration) <= 1825 THEN 1 ELSE 0 END) AS pt_1_to_5_years,
//       SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 1825 AND DATEDIFF(CURDATE(), date_of_registration) <= 3650 THEN 1 ELSE 0 END) AS pt_6_to_10_years,
//       SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 3650 AND DATEDIFF(CURDATE(), date_of_registration) <= 7300 THEN 1 ELSE 0 END) AS pt_11_to_20_years,
//       SUM(CASE WHEN status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 7300 THEN 1 ELSE 0 END) AS pt_greater_than_20_years
//     FROM fir_add;
//   `;


//     db.query(query, (err, results) => {
//         if (err) {
//         console.error('Error executing query:', err);
//         res.status(500).json({ error: 'Database query failed' });
//         return;
//         }
//         const uiBar = [
//         results[0].ui_less_than_1_year,
//         results[0].ui_1_to_5_years,
//         results[0].ui_6_to_10_years,
//         results[0].ui_11_to_20_years,
//         results[0].ui_greater_than_20_years,
//         ];
//         const ptBar = [
//         results[0].pt_less_than_1_year,
//         results[0].pt_1_to_5_years,
//         results[0].pt_6_to_10_years,
//         results[0].pt_11_to_20_years,
//         results[0].pt_greater_than_20_years,
//         ];
//         res.json({ uiBar, ptBar });
//     });

// };

// exports.getLineChartCounts = (req, res) => {
   
//     const query = `
//         SELECT YEAR(date_of_registration) AS year, COUNT(*) AS pendingTrials
//         FROM fir_add
//         WHERE YEAR(date_of_registration) BETWEEN YEAR(CURDATE()) - 10 AND YEAR(CURDATE())
//         GROUP BY YEAR(date_of_registration)
//         ORDER BY YEAR(date_of_registration);
//     `;

//     db.query(query, (err, results) => {
//         if (err) {
//           console.error(err);
//           res.status(500).send('Server error');
//           return;
//         }
//         const currentYear = new Date().getFullYear();
//         const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i); 
//         const dataMap = Object.fromEntries(results.map(row => [row.year, row.pendingTrials]));
    
//         const labels = years.map(year => year.toString());
//         const data = years.map(year => dataMap[year] || 0); 
    
//         res.json({
//           labels: labels,
//           datasets: [
//             {
//               label: 'Pending Cases',
//               data: data,
//             },
//           ],
//         });
//     });

// };


// exports.getDistrictMap = (req, res) => {
//   const query = `
//       SELECT 
//       d.district_name AS district_name, 
//       COUNT(f.id) AS count
//       FROM 
//           district d
//       LEFT JOIN 
//           fir_add f 
//       ON 
//           d.district_name = f.revenue_district
//           AND f.status >= 6
//       GROUP BY 
//           d.district_name
//       ORDER BY 
//           count DESC;
//   `;

//   db.execute(query, (err, results) => {
//       if (err) {
//           return res.status(500).json({ error: err.message });
//       }

//       res.json(results);
//   });
// };


// exports.getDistrictMap1 = (req, res) => {
//   const query = `
//       SELECT 
//       d.district_name AS district_name, 
//       COUNT(f.id) AS count
//       FROM 
//           district d
//       LEFT JOIN 
//           fir_add f 
//       ON 
//           d.district_name = f.revenue_district
//           AND f.status <= 5
//       GROUP BY 
//           d.district_name
//       ORDER BY 
//           count DESC;
//   `;

//   db.execute(query, (err, results) => {
//       if (err) {
//           return res.status(500).json({ error: err.message });
//       }

//       res.json(results);
//   });
// };

// case dashboard


exports.Police_City_filtet_data = (req, res) => {
  
  const params = [];

    const query = `
    SELECT 
      police_city 
    FROM 
      fir_add 
    GROUP BY 
      police_city 
    ORDER BY 
      police_city;`;
    
    const queryParams = [...params];

    // console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};


exports.Zone_Filter_Data = (req, res) => {
  
  const params = [];

    const query = `
    select 
      police_zone
    from 
      fir_add
    group by police_zone`;
    
    const queryParams = [...params];

    // console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};


exports.GetCaseDashboardCardStaticValue = (req, res) => {
  
  // Build WHERE clause based on provided filters
  const whereConditions = [];
  const params = [];

  if (req.body.district) {
    whereConditions.push('fa.revenue_district = ?');
    params.push(req.body.district);
  }

  if (req.body.police_city) {
    whereConditions.push('fa.police_city = ?');
    params.push(req.body.police_city);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // SQL Query
  const query = `
    SELECT 
      COUNT(fa.fir_id) AS Static_Total_Reported_Cases,
      COUNT(CASE WHEN fa.status <= 5 THEN 1 END) AS Static_Total_UI_Cases,
      COUNT(CASE WHEN fa.status > 5 THEN 1 END) AS Static_Total_PT_Cases,
      COUNT(CASE WHEN fa.nature_of_judgement = 'acquitted' THEN 1 END) AS Static_Total_Acquitted,
      COUNT(CASE WHEN fa.nature_of_judgement = 'convicted' THEN 1 END) AS Static_Total_Convicted,
      COUNT(CASE WHEN YEAR(fa.date_of_registration) = YEAR(NOW()) THEN 1 END) AS Static_Total_FIR_currentyear,
      COUNT(CASE WHEN fa.status = 6 THEN 1 END) AS Static_Total_Chargesheeted_Cases,
      COUNT(CASE WHEN fa.status = 9 THEN 1 END) AS Static_Total_Reffered_Chargesheeted_Cases,
      COUNT(CASE WHEN fa.nature_of_judgement != '' AND fa.nature_of_judgement IS NOT NULL THEN 1 END) AS Static_Total_Judgements
    FROM 
      fir_add fa
    LEFT JOIN 
      victims vm ON vm.fir_id = fa.fir_id
    ${whereClause}
  `;

  const queryParams = [...params];

  // Execute Query
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching Nature of Offence Chart Value:', err);
      return res.status(500).json({ 
        message: 'Failed to retrieve Chart Data', 
        error: err 
      });
    }

    res.status(200).json({
      data: results,
    });
  });
};


exports.GetCaseDashboardCardDynamicValue = (req, res) => {
  
  // Build WHERE clause based on provided filters
  const whereConditions = [];
  const params = [];

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

  if (req.body.offence) {
    whereConditions.push('fa.Offence_group = ?');
    params.push(req.body.offence);
  }

  if (req.body.Filter_From_Date) {
    whereConditions.push('fa.date_of_registration >= ?');
    params.push(req.body.Filter_From_Date);
  }

  if (req.body.Filter_To_Date) {
    whereConditions.push('fa.date_of_registration <= ?');
    params.push(req.body.Filter_To_Date);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // SQL Query
  const query = `
    SELECT 
      COUNT(fa.fir_id) AS Total_Reported_Cases,
      COUNT(CASE WHEN fa.status <= 5 THEN 1 END) AS Total_UI_Cases,
      COUNT(CASE WHEN fa.status > 5 THEN 1 END) AS Total_PT_Cases,
      COUNT(CASE WHEN fa.nature_of_judgement = 'acquitted' THEN 1 END) AS Total_Acquitted,
      COUNT(CASE WHEN fa.nature_of_judgement = 'convicted' THEN 1 END) AS Total_Convicted,
      COUNT(CASE WHEN YEAR(fa.date_of_registration) = YEAR(NOW()) THEN 1 END) AS Total_FIR_currentyear,
      COUNT(CASE WHEN fa.status = 6 THEN 1 END) AS Total_Chargesheeted_Cases,
      COUNT(CASE WHEN fa.status = 9 THEN 1 END) AS Total_Reffered_Chargesheeted_Cases,
      COUNT(CASE WHEN fa.nature_of_judgement != '' AND fa.nature_of_judgement IS NOT NULL THEN 1 END) AS Total_Judgements
    FROM 
      fir_add fa
    LEFT JOIN 
      victims vm ON vm.fir_id = fa.fir_id
    ${whereClause}
  `;

  const queryParams = [...params];

  // Execute Query
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching Nature of Offence Chart Value:', err);
      return res.status(500).json({ 
        message: 'Failed to retrieve Chart Data', 
        error: err 
      });
    }

    res.status(200).json({
      data: results,
    });
  });
};



exports.GetPTPendencyCasesGroupedByYears = (req, res) => {
  const params = [];
  const whereConditions = [];

  // Optional filters
  if (req.body.district) {
    whereConditions.push('fa.revenue_district = ?');
    params.push(req.body.district);
  }

  if (req.body.police_city) {
    whereConditions.push('fa.police_city = ?');
    params.push(req.body.police_city);
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


  // Final WHERE clause
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Query
  const query = `
    SELECT
      SUM(CASE WHEN fa.status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) <= 365 THEN 1 ELSE 0 END) AS pt_less_than_1_year,
      SUM(CASE WHEN fa.status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 365 AND DATEDIFF(CURDATE(), date_of_registration) <= 1825 THEN 1 ELSE 0 END) AS pt_1_to_5_years,
      SUM(CASE WHEN fa.status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 1825 AND DATEDIFF(CURDATE(), date_of_registration) <= 3650 THEN 1 ELSE 0 END) AS pt_6_to_10_years,
      SUM(CASE WHEN fa.status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 3650 AND DATEDIFF(CURDATE(), date_of_registration) <= 7300 THEN 1 ELSE 0 END) AS pt_11_to_20_years,
      SUM(CASE WHEN fa.status >= 6 AND DATEDIFF(CURDATE(), date_of_registration) > 7300 THEN 1 ELSE 0 END) AS pt_greater_than_20_years
    FROM fir_add fa
    LEFT JOIN victims vm ON vm.fir_id = fa.fir_id
    ${whereClause}

  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching pendency cases:', err);
      return res.status(500).json({
        message: 'Failed to retrieve pendency case data',
        error: err
      });
    }

    res.status(200).json({
      data: results
    });
  });
};



exports.GetUIPendencyCasesGrouped = (req, res) => {
  const params = [];
  const whereConditions = [];

  // Optional filters
  if (req.body.district) {
    whereConditions.push('fa.revenue_district = ?');
    params.push(req.body.district);
  }

  if (req.body.police_city) {
    whereConditions.push('fa.police_city = ?');
    params.push(req.body.police_city);
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


  // Final WHERE clause
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Query
  const query = `
      SELECT
        SUM(CASE WHEN fa.status <= 5 AND DATEDIFF(CURDATE(), fa.date_of_registration) < 60 THEN 1 ELSE 0 END) AS ui_less_than_2_month,
        SUM(CASE WHEN fa.status <= 5 AND DATEDIFF(CURDATE(), fa.date_of_registration) BETWEEN 60 AND 119 THEN 1 ELSE 0 END) AS ui_2_to_4_month,
        SUM(CASE WHEN fa.status <= 5 AND DATEDIFF(CURDATE(), fa.date_of_registration) BETWEEN 120 AND 179 THEN 1 ELSE 0 END) AS ui_4_to_6_month,
        SUM(CASE WHEN fa.status <= 5 AND DATEDIFF(CURDATE(), fa.date_of_registration) BETWEEN 180 AND 364 THEN 1 ELSE 0 END) AS ui_6_to_12_month,
        SUM(CASE WHEN fa.status <= 5 AND DATEDIFF(CURDATE(), fa.date_of_registration) >= 365 THEN 1 ELSE 0 END) AS ui_greater_than_1_year
      FROM fir_add fa
      LEFT JOIN victims vm ON vm.fir_id = fa.fir_id
    ${whereClause}

  `;
  console.log(query);
  console.log(params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching pendency cases:', err);
      return res.status(500).json({
        message: 'Failed to retrieve pendency case data',
        error: err
      });
    }

    res.status(200).json({
      data: results
    });
  });
};



exports.GetUIDistrictWiseHeatMap = (req, res) => {
  const params = [];
  const whereConditions = [];

  // Optional filters
  if (req.body.district) {
    whereConditions.push('fa.revenue_district = ?');
    params.push(req.body.district);
  }

  if (req.body.police_city) {
    whereConditions.push('fa.police_city = ?');
    params.push(req.body.police_city);
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


  // Final WHERE clause
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Query
  const query = `
      SELECT
      fa.revenue_district as district,
      SUM(CASE WHEN fa.status <= 5 THEN 1 ELSE 0 END) AS UI_Count
      FROM fir_add fa
      LEFT JOIN victims vm ON vm.fir_id = fa.fir_id
    ${whereClause}

    GROUP BY fa.revenue_district

  `;
  console.log(query);
  console.log(params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching pendency cases:', err);
      return res.status(500).json({
        message: 'Failed to retrieve pendency case data',
        error: err
      });
    }

    res.status(200).json({
      data: results
    });
  });
};



exports.GetPTDistrictWiseHeatMap = (req, res) => {
  const params = [];
  const whereConditions = [];

  // Optional filters
  if (req.body.district) {
    whereConditions.push('fa.revenue_district = ?');
    params.push(req.body.district);
  }

  if (req.body.police_city) {
    whereConditions.push('fa.police_city = ?');
    params.push(req.body.police_city);
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


  // Final WHERE clause
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Query
  const query = `
      SELECT
      fa.revenue_district as district,
      SUM(CASE WHEN fa.status >= 6 THEN 1 ELSE 0 END) AS PT_Count
      FROM fir_add fa
      LEFT JOIN victims vm ON vm.fir_id = fa.fir_id
    ${whereClause}

    GROUP BY fa.revenue_district

  `;
  console.log(query);
  console.log(params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching pendency cases:', err);
      return res.status(500).json({
        message: 'Failed to retrieve pendency case data',
        error: err
      });
    }

    res.status(200).json({
      data: results
    });
  });
};


exports.GetNatureOfOffenceChartValue = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];


  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.police_city) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.police_city = ?';
    params.push(req.body.police_city);
  }

  if (req.body.Status_Of_Case) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
   
    if(req.body.Status_Of_Case == 'UI'){
      whereClause += 'fa.status <= 5';
    } else if(req.body.Status_Of_Case == 'PT'){
      whereClause += 'fa.status > 5';
    }
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.police_zone) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.police_zone = ?';
    params.push(req.body.police_zone);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.Filter_From_Date) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.date_of_registration >= ?';
    params.push(req.body.Filter_From_Date);
  }

  if (req.body.Filter_To_Date) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.date_of_registration <= ?';
    params.push(req.body.Filter_To_Date);
  }




    // Get paginated data query
    const query = `
    select count(fa.fir_id) as total , count(case when fa.Offence_group = 'Non GCR' then 1 end) as non_gcr , count(case when fa.Offence_group != 'Non GCR' then 1 end) as gcr from fir_add fa
    left join victims vm on vm.fir_id = fa.fir_id
    ${whereClause} `;
    
    const queryParams = [...params];

    // console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Chart Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};


exports.GetAnnualOverViewRegisterdCases = (req, res) => {
  const params = [];
  let whereConditions = [];

  // Optional filter for district
  if (req.body.district) {
    whereConditions.push('fa.revenue_district = ?');
    params.push(req.body.district);
  }

  
  if (req.body.police_city) {
    whereConditions.push('fa.police_city = ?');
    params.push(req.body.police_city);
  }

  if (req.body.Status_Of_Case) {
    if (req.body.Status_Of_Case == 'UI') {
      whereConditions.push('fa.status <= 5');
    } else if (req.body.Status_Of_Case == 'PT') {
      whereConditions.push('fa.status > 5');
    }
  }

  if (req.body.offence) {
    whereConditions.push('fa.Offence_group = ?');
    params.push(req.body.offence);
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


  // Always include date filter for last 5 years
  whereConditions.push("fa.date_of_registration >= DATE_FORMAT(NOW() - INTERVAL 4 YEAR, '%Y-01-01')");

  // Build the WHERE clause
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Query to ensure all 5 years are present
  
  const query = `
  SELECT y.year, IFNULL(f.total_cases, 0) AS total_cases
  FROM (
    SELECT YEAR(CURDATE()) AS year
    UNION ALL SELECT YEAR(CURDATE()) - 1
    UNION ALL SELECT YEAR(CURDATE()) - 2
    UNION ALL SELECT YEAR(CURDATE()) - 3
    UNION ALL SELECT YEAR(CURDATE()) - 4
  ) y
  LEFT JOIN (
    SELECT 
      YEAR(fa.date_of_registration) AS year,
      COUNT(fa.fir_id) AS total_cases
    FROM fir_add fa
    LEFT JOIN victims vm ON vm.fir_id = fa.fir_id
    ${whereClause}
    GROUP BY YEAR(fa.date_of_registration)
  ) f ON y.year = f.year
  ORDER BY y.year;
`;

console.log(query)
console.log(params)

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching registered cases:', err);
      return res.status(500).json({ 
        message: 'Failed to retrieve registered case data', 
        error: err 
      });
    }

    res.status(200).json({ data: results });
  });
};


exports.GetPendingCaseZoneWise = (req, res) => {
  const params = [];
  let whereClause = '';

  if (req.body.Status_Of_Case) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
   
    if(req.body.Status_Of_Case == 'UI'){
      whereClause += 'fa.status <= 5';
    } else if(req.body.Status_Of_Case == 'PT'){
      whereClause += 'fa.status > 5';
    }
  } else {
    whereClause = 'WHERE status <= 5';
  }


  // Add optional district filter
  if (req.body.district) {
    whereClause += ' AND fa.revenue_district = ?';
    params.push(req.body.district);
  }

  
  if (req.body.police_city) {
    whereConditions.push('fa.police_city = ?');
    params.push(req.body.police_city);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.police_zone) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.police_zone = ?';
    params.push(req.body.police_zone);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  const query = `
        WITH RECURSIVE years AS (
      SELECT 1993 AS year
      UNION ALL
      SELECT year + 1 FROM years WHERE year + 1 <= YEAR(CURDATE())
      ),
      zones AS (
      SELECT DISTINCT police_zone AS zone FROM fir_add
      ${req.body.district ? 'WHERE revenue_district = ?' : ''}
      ),
      raw_data AS (
      SELECT 
        YEAR(fa.date_of_registration) AS year,
        fa.police_zone AS zone,
        COUNT(fa.fir_id) AS total_cases
      FROM fir_add fa
      LEFT JOIN victims vm ON vm.fir_id = fa.fir_id
      ${whereClause}
      GROUP BY YEAR(fa.date_of_registration), fa.police_zone
      )
      SELECT 
      y.year, 
      z.zone, 
      IFNULL(r.total_cases, 0) AS total_cases
      FROM years y
      CROSS JOIN zones z
      LEFT JOIN raw_data r ON r.year = y.year AND r.zone = z.zone
      ORDER BY y.year, z.zone;
  `;

  // Include the district param again if needed (first time for zones)
  if (req.body.district) {
    params.unshift(req.body.district);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching zone-wise pending cases:', err);
      return res.status(500).json({
        message: 'Failed to retrieve pending zone-wise cases',
        error: err
      });
    }

    res.status(200).json({ data: results });
  });
};


exports.ReasonForPendingUICases = (req, res) => {
  const params = [];
  let whereConditions = [];

  // Optional filter for district
  if (req.body.district) {
    whereConditions.push('fa.revenue_district = ?');
    params.push(req.body.district);
  }

  
  if (req.body.police_city) {
    whereConditions.push('fa.police_city = ?');
    params.push(req.body.police_city);
  }

  if (req.body.Status_Of_Case) {
    if (req.body.Status_Of_Case == 'UI') {
      whereConditions.push('fa.status <= 5');
    } else if (req.body.Status_Of_Case == 'PT') {
      whereConditions.push('fa.status > 5');
    }
  }

  if (req.body.offence) {
    whereConditions.push('fa.Offence_group = ?');
    params.push(req.body.offence);
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

  // WHERE clause for FIRs only (NOT for JOIN)
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      COALESCE(rr.reason_for_status, 'Reason not updated yet') AS reason,
      COUNT(*) AS ui_total_cases
    FROM fir_add fa
    LEFT JOIN report_reasons rr ON rr.fir_id = fa.fir_id
    LEFT JOIN victims vm ON vm.fir_id = fa.fir_id
    ${whereClause}
    AND fa.status <= 5
    GROUP BY reason
    HAVING ui_total_cases > 0
    ORDER BY reason;
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching pending case reasons:', err);
      return res.status(500).json({
        message: 'Failed to retrieve reason-wise pending case data',
        error: err
      });
    }

    res.status(200).json({ data: results });
  });
};




// VMC Dashboard 



exports.GetVmcDashboardCardsValues = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.quarter) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
  
    switch (req.body.quarter) {
      case 'Q1':
        whereClause += "meeting_quarter = 'Jan-Mar'";
        break;
      case 'Q2':
        whereClause += "meeting_quarter = 'Apr-Jun'";
        break;
      case 'Q3':
        whereClause += "meeting_quarter = 'Jul-Sep'";
        break;
      case 'Q4':
        whereClause += "meeting_quarter = 'Oct-Dec'";
        break;
    }
  }



  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'district = ?';
    params.push(req.body.district);
  }

  if (req.body.subdivision) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'subdivision = ?';
    params.push(req.body.subdivision);
  }

  // count(case when meeting_type = 'DLVMC' and meeting_status = 'Completed' then 1 end) as Total_dlvmc_meeting_as_per_quarter ,
  // count(case when meeting_type = 'SDLVMC' and meeting_status = 'Completed' then 1 end) as Total_No_of_Sub_dividion_meeting ,
  
    const query = `
    select 
      '38' as Total_dlvmc_meeting_as_per_quarter ,
      count(case when meeting_type = 'DLVMC' and meeting_status = 'Completed' and meeting_quarter = 'Jan-Mar' then 1 end) as Total_dlvmc_meting_conducted_q1 ,
      count(case when meeting_type = 'DLVMC' and meeting_status = 'Completed' and meeting_quarter = 'Apr-Jun' then 1 end) as Total_dlvmc_meting_conducted_q2 ,
      count(case when meeting_type = 'DLVMC' and meeting_status = 'Completed' and meeting_quarter = 'Jul-Sep' then 1 end) as Total_dlvmc_meting_conducted_q3 ,
      count(case when meeting_type = 'DLVMC' and meeting_status = 'Completed' and meeting_quarter = 'Oct-Dec' then 1 end) as Total_dlvmc_meting_conducted_q4 ,

      '94' as Total_No_of_Sub_dividion_meeting ,
      count(case when meeting_type = 'SDLVMC' and meeting_status = 'Completed' and meeting_quarter = 'Jan-Mar' then 1 end) as Total_sdlvmc_meting_conducted_q1 ,
      count(case when meeting_type = 'SDLVMC' and meeting_status = 'Completed' and meeting_quarter = 'Apr-Jun' then 1 end) as Total_sdlvmc_meting_conducted_q2 ,
      count(case when meeting_type = 'SDLVMC' and meeting_status = 'Completed' and meeting_quarter = 'Jul-Sep' then 1 end) as Total_sdlvmc_meting_conducted_q3 ,
      count(case when meeting_type = 'SDLVMC' and meeting_status = 'Completed' and meeting_quarter = 'Oct-Dec' then 1 end) as Total_sdlvmc_meting_conducted_q4 
    
    from 
      vmc_meeting${whereClause} 
    `;
    
    const queryParams = [...params];

    // console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Chart Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};


exports.GetVmcQuarterlyMeetingStats = (req, res) => {
  const params = [];
  let whereConditions = [];

  // Always enforce district and subdivision rules
  whereConditions.push("(district IS NOT NULL AND district != '')");
  whereConditions.push("(subdivision IS NULL OR subdivision = '')");

  // Optional filters


  if (req.body.quarter) {
  
    switch (req.body.quarter) {
      case 'Q1':
        whereConditions.push("meeting_quarter = 'Jan-Mar'");
        break;
      case 'Q2':
        whereConditions.push("meeting_quarter = 'Apr-Jun'");
        break;
      case 'Q3':
        whereConditions.push("meeting_quarter = 'Jul-Sep'");
        break;
      case 'Q4':
        whereConditions.push("meeting_quarter = 'Oct-Dec'");
        break;
    }
  }


  if (req.body.district) {
    whereConditions.push("district = ?");
    params.push(req.body.district);
  }

  if (req.body.subdivision) {
    whereConditions.push("subdivision = ?");
    params.push(req.body.subdivision);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      district,
      meeting_quarter,
      meeting_status,
      COUNT(*) AS count
    FROM 
      vmc_meeting
    ${whereClause}
    GROUP BY 
      district, meeting_quarter, meeting_status
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching VMC data:', err);
      return res.status(500).json({ message: 'Failed to retrieve data', error: err });
    }

    const data = {};

    results.forEach(row => {
      const district = row.district;
      const quarter = getQuarterKey(row.meeting_quarter); // e.g., 'q1'
      const status = row.meeting_status?.toLowerCase(); // 'completed' or 'pending'
      const count = row.count;

      if (!data[district]) {
        data[district] = {
          q1: { completed: "0", pending: "0" },
          q2: { completed: "0", pending: "0" },
          q3: { completed: "0", pending: "0" },
          q4: { completed: "0", pending: "0" },
          total: { total_completed: 0 }
        };
      }

      if (quarter && (status === 'completed' || status === 'pending')) {
        data[district][quarter][status] = count.toString();

        if (status === 'completed') {
          data[district].total.total_completed += count;
        }
      }
    });

    res.status(200).json({ data });
  });
};

// Helper to map meeting_quarter values to q1-q4
function getQuarterKey(quarterStr) {
  switch (quarterStr) {
    case 'Jan-Mar': return 'q1';
    case 'Apr-Jun': return 'q2';
    case 'Jul-Sep': return 'q3';
    case 'Oct-Dec': return 'q4';
    default: return null;
  }
}



exports.GetVmcSubdivisionMeetingStats = (req, res) => {
  const params = [];
  let whereConditions = [];

  // Basic conditions
  whereConditions.push("(district IS NOT NULL AND district != '')");
  whereConditions.push("(subdivision IS NOT NULL AND subdivision != '')");

  // Optional filter

  if (req.body.quarter) {
  
    switch (req.body.quarter) {
      case 'Q1':
        whereConditions.push("meeting_quarter = 'Jan-Mar'");
        break;
      case 'Q2':
        whereConditions.push("meeting_quarter = 'Apr-Jun'");
        break;
      case 'Q3':
        whereConditions.push("meeting_quarter = 'Jul-Sep'");
        break;
      case 'Q4':
        whereConditions.push("meeting_quarter = 'Oct-Dec'");
        break;
    }
  }

  if (req.body.district) {
    whereConditions.push("district = ?");
    params.push(req.body.district);
  }

  if (req.body.subdivision) {
    whereConditions.push("subdivision = ?");
    params.push(req.body.subdivision);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      subdivision,
      meeting_quarter,
      COUNT(*) AS count
    FROM 
      vmc_meeting
    ${whereClause}
    GROUP BY 
      subdivision, meeting_quarter
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching VMC subdivision data:', err);
      return res.status(500).json({ message: 'Failed to retrieve data', error: err });
    }

    const data = {};

    results.forEach(row => {
      const subdivision = row.subdivision;
      const quarter = getQuarterKey(row.meeting_quarter);
      const count = row.count;

      if (!data[subdivision]) {
        data[subdivision] = {
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          total: 0
        };
      }

      if (quarter) {
        data[subdivision][quarter] += count;
        data[subdivision].total += count;
      }
    });

    res.status(200).json({ data });
  });
};

// Helper function
function getQuarterKey(quarterStr) {
  switch (quarterStr) {
    case 'Jan-Mar': return 'q1';
    case 'Apr-Jun': return 'q2';
    case 'Jul-Sep': return 'q3';
    case 'Oct-Dec': return 'q4';
    default: return null;
  }
}

exports.GetQuarterWiseMeetingStatus = (req, res) => {
  const params = [];
  let whereConditions = [`meeting_type = 'SDLVMC'`];

  // Add district filter if present

  if (req.body.quarter) {
  
    switch (req.body.quarter) {
      case 'Q1':
        whereConditions.push("meeting_quarter = 'Jan-Mar'");
        break;
      case 'Q2':
        whereConditions.push("meeting_quarter = 'Apr-Jun'");
        break;
      case 'Q3':
        whereConditions.push("meeting_quarter = 'Jul-Sep'");
        break;
      case 'Q4':
        whereConditions.push("meeting_quarter = 'Oct-Dec'");
        break;
    }
  }

  if (req.body.district) {
    whereConditions.push('district = ?');
    params.push(req.body.district);
  } else {
    // Common condition
    whereConditions.push("(district IS NOT NULL AND district != '')");
  }

  // Add subdivision filter if present
  if (req.body.subdivision) {
    whereConditions.push('subdivision = ?');
    params.push(req.body.subdivision);
  } else {
    // Common condition
    whereConditions.push("(subdivision IS NOT NULL OR subdivision != '')");
  }

  const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      meeting_quarter AS quarter,
      meeting_status,
      COUNT(*) AS count
    FROM 
      vmc_meeting
    ${whereClause}
    GROUP BY 
      meeting_quarter, meeting_status
    ORDER BY 
      FIELD(meeting_quarter, 'Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec')
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching quarter-wise data:', err);
      return res.status(500).json({ 
        message: 'Failed to retrieve data', 
        error: err 
      });
    }

    // Structure output
    const formatted = {
      Q1: { completed: 0, pending: 0 },
      Q2: { completed: 0, pending: 0 },
      Q3: { completed: 0, pending: 0 },
      Q4: { completed: 0, pending: 0 }
    };

    results.forEach(row => {
      let key = '';
      switch (row.quarter) {
        case 'Jan-Mar': key = 'Q1'; break;
        case 'Apr-Jun': key = 'Q2'; break;
        case 'Jul-Sep': key = 'Q3'; break;
        case 'Oct-Dec': key = 'Q4'; break;
      }

      if (key) {
        const status = row.meeting_status.toLowerCase();
        if (status === 'completed' || status === 'pending') {
          formatted[key][status] = row.count;
        }
      }
    });

    res.status(200).json({ data: formatted });
  });
};


// relief Dashbboard




exports.GetOffence = (req, res) => {
  
  let offenceGroupsList = [
    "Non GCR",
    "Murder",
    "Rape",
    "POCSO",
    "Other POCSO",
    "Gang Rape",
    "Rape by Cheating",
    "Arson",
    "Death",
    "GCR",
    "Attempt Murder",
    "Rape POCSO"
  ];
      res.status(200).json({
        data: offenceGroupsList,
      });
};

exports.Relief_Status = (req, res) => {
  
  let Status = [
    "Fir Stage",
    "ChargeSheet Stage",
    "Conviction Stage"
  ];
    res.status(200).json({
      data: Status,
    });
};

exports.Get_Two_thousand_sixteen_Status = (req, res) => {
  
  let Status = [
    "Before 2016",
    "After 2016"
  ];
    res.status(200).json({
      data: Status,
    });
};


exports.ReliefDashboardStaticValues = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];


  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'revenue_district = ?';
    params.push(req.body.district);
  }

    const query = `
    select 
      count(*) as Total_Reported_Cases ,
      count(case when date_of_registration < '2016-04-14' then 1 end) as Case_Register_Before_14_04_2026 ,
      count(case when date_of_registration >= '2016-04-14' then 1 end) as Case_Register_after_14_04_2026 ,
      count(case when relief_status <= '1' then 1 end) as Fir_Stage ,
      count(case when relief_status = '2' then 1 end) as Chargesheet_Stage ,
      count(case when relief_status = '3' then 1 end) as Conviction_Stage 
    from 
      fir_add${whereClause} 
    `;
    
    const queryParams = [...params];

    // console.log(query)
    // console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};


exports.ReliefDashboardDynamicValues = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }
  

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `
    select 
      count(fa.fir_id) as Filtered_Total_Reported_Cases ,
      count(case when fa.date_of_registration < '2016-04-14' then 1 end) as Filtered_Case_Register_Before_14_04_2026 ,
      count(case when fa.date_of_registration >= '2016-04-14' then 1 end) as Filtered_Case_Register_after_14_04_2026 ,
      count(case when fa.relief_status <= '1' then 1 end) as Filtered_Fir_Stage ,
      count(case when fa.relief_status = '2' then 1 end) as Filtered_Chargesheet_Stage ,
      count(case when fa.relief_status = '3' then 1 end) as Filtered_Conviction_Stage 
    from 
      fir_add fa left join victims vm on vm.fir_id = fa.fir_id  ${whereClause} 
    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};




exports.ReliefDashboarTableData = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `
      SELECT 
        fa.fir_id,
        fa.revenue_district AS District,
        CASE 
          WHEN fa.relief_status = 0 THEN 'Pending 1st Relief'
          WHEN fa.relief_status = 1 THEN 'Pending 2nd Relief'
          WHEN fa.relief_status = 2 THEN 'Pending 3rd Relief'
          WHEN fa.relief_status = 3 THEN 'Completed 3rd Relief'
          ELSE 'Unknown'
        END AS Relief_Stage,
        DATEDIFF(CURDATE(), fa.date_of_registration) AS Pending_Days,
        'Critical' AS Priority,
        'Immediate' AS Next_Action_Due
      FROM 
        fir_add fa
      LEFT JOIN 
        victims vm ON vm.fir_id = fa.fir_id
      ${whereClause};
    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};



exports.JobStatus = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `

    SELECT 
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Employment%' AND ad.employment_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Given,
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Employment%' AND (ad.employment_status IS NULL OR ad.employment_status != 'yes') THEN 1 
              ELSE 0 
            END), 0) AS Pending
      FROM 
        fir_add fa
      LEFT JOIN 
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN 
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN 
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause};
    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};



exports.PensionStatus = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `

      SELECT 
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Pension%' AND ad.pension_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Given,
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Pension%' AND (ad.pension_status IS NULL OR ad.pension_status != 'yes') THEN 1 
              ELSE 0 
            END), 0) AS Pending
      FROM 
        fir_add fa
      LEFT JOIN 
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN 
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN 
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause};

    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};



exports.PattaStatus = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `

      SELECT 
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%House site Patta%' AND ad.house_site_patta_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Given,
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%House site Patta%' AND (ad.house_site_patta_status IS NULL OR ad.house_site_patta_status != 'yes') THEN 1 
              ELSE 0 
            END), 0) AS Pending
      FROM 
        fir_add fa
      LEFT JOIN 
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN 
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN 
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause};
    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};



exports.EducationConsissionStatus = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `

      SELECT 
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Education concession%' AND ad.education_concession_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Given,
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Education concession%' AND (ad.education_concession_status IS NULL OR ad.education_concession_status != 'yes') THEN 1 
              ELSE 0 
            END), 0) AS Pending
      FROM 
        fir_add fa
      LEFT JOIN 
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN 
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN 
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause};
      
    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};



exports.DistrictWiseGivenStatus = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `

      SELECT 
      fa.revenue_district,
        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Employment%' AND ad.employment_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS job_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Pension%' AND ad.pension_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Pension_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%House site Patta%' AND ad.house_site_patta_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Patta_Given,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Education concession%' AND ad.education_concession_status = 'yes' THEN 1 
              ELSE 0 
            END), 0) AS Education_Given

      FROM 
        fir_add fa
      LEFT JOIN 
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN 
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN 
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause} 
      GROUP BY 
        fa.revenue_district
      
    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};




exports.DistrictWisePedingStatus = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `

      SELECT 
      fa.revenue_district,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Employment%' AND (ad.employment_status IS NULL OR ad.employment_status != 'yes') THEN 1 
              ELSE 0 
            END), 0) AS Job_Pending,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Pension%' AND (ad.pension_status IS NULL OR ad.pension_status != 'yes') THEN 1 
              ELSE 0 
            END), 0) AS Pension_Pending,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%House site Patta%' AND (ad.house_site_patta_status IS NULL OR ad.house_site_patta_status != 'yes') THEN 1 
              ELSE 0 
            END), 0) AS Patta_Pending,

        COALESCE(SUM(CASE 
              WHEN a.section LIKE '%Education concession%' AND (ad.education_concession_status IS NULL OR ad.education_concession_status != 'yes') THEN 1 
              ELSE 0 
            END), 0) AS Education_Pending

      FROM 
        fir_add fa
      LEFT JOIN 
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN 
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN 
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause} 
      GROUP BY 
        fa.revenue_district
      
    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};




exports.ReliefStatus_donut_chart = (req, res) => {
  
  // Build WHERE clause based on provided filters
  let whereClause = '';
  const params = [];

  if (req.body.Two_thousand_sixteen) {
    if(req.body.Two_thousand_sixteen == 'Before 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration < '2016-04-14'";
    } else if(req.body.Two_thousand_sixteen == 'After 2016'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.date_of_registration >= '2016-04-14'";
    }
  }

  if (req.body.district) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.revenue_district = ?';
    params.push(req.body.district);
  }

  if (req.body.offence) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'fa.Offence_group = ?';
    params.push(req.body.offence);
  }

  if (req.body.community) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.community = ?';
    params.push(req.body.community);
  }

  if (req.body.caste) {
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'vm.caste = ?';
    params.push(req.body.caste);
  }

  if (req.body.relief_status) {
    if(req.body.relief_status == 'Fir Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '1'";
    } else if(req.body.relief_status == 'ChargeSheet Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '2'";
    } else if(req.body.relief_status == 'Conviction Stage'){
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += "fa.relief_status = '3'";
    }
  }

    const query = `

      SELECT 
        COALESCE(SUM(CASE WHEN fa.relief_status = 0 THEN 1 ELSE 0 END), 0) AS Pending_1st_Relief,
        
        COALESCE(SUM(CASE WHEN fa.relief_status = 1 THEN 1 ELSE 0 END), 0) AS Pending_2nd_Relief,

        COALESCE(SUM(CASE WHEN fa.relief_status = 2 THEN 1 ELSE 0 END), 0) AS Pending_3rd_Relief

      FROM
        fir_add fa
      LEFT JOIN
        additional_relief a ON fa.fir_id = a.fir_id
      LEFT JOIN
        victims vm ON vm.victim_id = a.victim_id
      LEFT JOIN
        additional_relief_details ad ON a.id = ad.additional_relief_id
      ${whereClause} 
      
    `;
    
    const queryParams = [...params];

    console.log(query)
    console.log(queryParams)
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          message: 'Failed to retrieve Data', 
          error: err 
        });
      }
      
      res.status(200).json({
        data: results,
      });
    });
};
