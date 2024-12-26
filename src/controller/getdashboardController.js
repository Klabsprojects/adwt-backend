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
                            res.json({
                                totalCases: totalCasesResult[0].totalCases,
                                pendingTrials: pendingTrialsResult[0].pendingTrials,
                                minorCases: minorCasesResult[0].minorCases,
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