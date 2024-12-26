const db = require('../db'); // Your database connection

  
// exports.applyfilterData = (req, res, next) => {
//   const filters = req.body;

//   const whereClause = buildWhereClause(filters);

//   req.whereClause = whereClause;

//   next();
// };

// const filterMappings = {
//   status: { table: 'fir_add', column: 'status' },
//   gender: { table: 'victims', column: 'victim_gender' },
//   district: { table: 'fir_add', column: 'revenue_district' },
//   caste: { table: 'victims', column: 'community' },
//   subcaste: { table: 'victims', column: 'caste' },
//   fromDate: { table: 'fir_add', column: 'date_of_registration' },
//   toDate: { table: 'fir_add', column: 'date_of_registration' }, 
// };
// const statusValueMapping = {
//   UI: "5",
//   PT: "6",
// };

// function buildWhereClause(filters) {
//   const conditions = [];

//   for (const [filterKey, filterValue] of Object.entries(filters)) {
//       if (!filterValue) continue;

//       const mapping = filterMappings[filterKey];
//       if (!mapping) continue; 

//       const { table, column } = mapping;

//       if (filterKey === 'status') {
//           const mappedValue = statusValueMapping[filterValue] || filterValue;
//           conditions.push(`${table}.${column} = '${mappedValue}'`);
//       } else if (filterKey === 'fromDate' && filters.toDate) {

//           conditions.push(`${table}.${column} BETWEEN '${filters.fromDate}' AND '${filters.toDate}'`);
//       } else if (filterKey !== 'toDate') {
        
//           conditions.push(`${table}.${column} = '${filterValue}'`);
//       }
//   }

//   return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
// }


  

exports.getDashboardData = (req, res) => {

  const totalCasesQuery = `SELECT COUNT(*) AS totalCases FROM fir_add`;
  const casesBefore2016Query = `
    SELECT COUNT(*) AS casesBefore2016
    FROM fir_add
    WHERE date_of_registration < '2016-04-14'
  `;
  const casesAfter2016Query = `
    SELECT COUNT(*) AS casesAfter2016
    FROM fir_add
    WHERE date_of_registration >= '2016-04-14'
  `;

  const today = new Date();
  const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7)).toISOString().slice(0, 10);
  const sixtyDaysAgo = new Date(today.setDate(today.getDate() - 53)).toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(today.setDate(today.getDate() - 30)).toISOString().slice(0, 10);

  const moreThan7DaysQuery = `
    SELECT COUNT(*) AS moreThan7Days
    FROM fir_add
    WHERE relief_status != '3' AND date_of_registration <= '${sevenDaysAgo}'
  `;

  const moreThan60DaysQuery = `
    SELECT COUNT(*) AS moreThan60Days
    FROM fir_add
    WHERE relief_status != '3' AND date_of_registration <= '${sixtyDaysAgo}'
  `;

  const moreThan90DaysQuery = `
    SELECT COUNT(*) AS moreThan90Days
    FROM fir_add
    WHERE relief_status != '3' AND date_of_registration <= '${ninetyDaysAgo}'
  `;

  const additionalreliefcaseQuery = `SELECT
      SUM(CASE WHEN employment_status = 'yes' THEN 1 ELSE 0 END) AS job_given_count,
      SUM(CASE WHEN employment_status != 'yes' THEN 1 ELSE 0 END) AS job_pending_count,
      ROUND((SUM(CASE WHEN employment_status = 'yes' THEN 1 ELSE 0 END) / COUNT(*)) * 100) AS job_given_percentage,
      ROUND((SUM(CASE WHEN employment_status != 'yes' THEN 1 ELSE 0 END) / COUNT(*)) * 100) AS job_pending_percentage,
      SUM(CASE WHEN pension_status = 'yes' THEN 1 ELSE 0 END) AS pension_given_count,
      SUM(CASE WHEN pension_status != 'yes' THEN 1 ELSE 0 END) AS pension_pending_count,
      ROUND((SUM(CASE WHEN pension_status = 'yes' THEN 1 ELSE 0 END) / COUNT(*)) * 100) AS pension_given_percentage,
      ROUND((SUM(CASE WHEN pension_status != 'yes' THEN 1 ELSE 0 END) / COUNT(*)) * 100) AS pension_pending_percentage,
      SUM(CASE WHEN house_site_patta_status = 'yes' THEN 1 ELSE 0 END) AS patta_given_count,
      SUM(CASE WHEN house_site_patta_status != 'yes' THEN 1 ELSE 0 END) AS patta_pending_count,
      ROUND((SUM(CASE WHEN house_site_patta_status = 'yes' THEN 1 ELSE 0 END) / COUNT(*)) * 100) AS patta_given_percentage,
      ROUND((SUM(CASE WHEN house_site_patta_status != 'yes' THEN 1 ELSE 0 END) / COUNT(*)) * 100) AS patta_pending_percentage,
      SUM(CASE WHEN education_concession_status = 'yes' THEN 1 ELSE 0 END) AS education_given_count,
      SUM(CASE WHEN education_concession_status != 'yes' THEN 1 ELSE 0 END) AS education_pending_count,
      ROUND((SUM(CASE WHEN education_concession_status = 'yes' THEN 1 ELSE 0 END) / COUNT(*)) * 100) AS education_given_percentage,
      ROUND((SUM(CASE WHEN education_concession_status != 'yes' THEN 1 ELSE 0 END) / COUNT(*)) * 100) AS education_pending_percentage
  FROM additional_relief_details`;

  const reliefcaseQuery =`SELECT
      ROUND((SUM(CASE WHEN status >= 7 AND relief_status = 3 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 0) AS given_percentage,
      ROUND((SUM(CASE WHEN NOT (status >= 7 AND relief_status = 3) THEN 1 ELSE 0 END) / COUNT(*)) * 100, 0) AS pending_percentage
  FROM fir_add`;

  

  // const reliefpendingQuery = `SELECT d.district_name AS district_name, COUNT(f.id) AS count FROM district d 
  //   LEFT JOIN fir_add f ON d.district_name = f.revenue_district AND f.status < '7' AND f.relief_status != '3' 
  //   GROUP BY d.district_name ORDER BY count DESC`;

  db.query(totalCasesQuery, (error, totalCasesResult) => {
    const totalCases = totalCasesResult[0]?.totalCases || 0;

    db.query(casesBefore2016Query, (error, casesBefore2016Result) => {
      const casesBefore2016 = casesBefore2016Result[0]?.casesBefore2016 || 0;

      db.query(casesAfter2016Query, (error, casesAfter2016Result) => {
        const casesAfter2016 = casesAfter2016Result[0]?.casesAfter2016 || 0;

        db.query(moreThan7DaysQuery, (err1, result1) => {
          const moreThan7Days = result1[0]?.moreThan7Days || 0;

          db.query(moreThan60DaysQuery, (err2, result2) => {
            const moreThan60Days = result2[0]?.moreThan60Days || 0;

            db.query(moreThan90DaysQuery, (err3, result3) => {
              const moreThan90Days = result3[0]?.moreThan90Days || 0;

              db.query(additionalreliefcaseQuery, (err4, reliefcaseResult) => {
                const reliefData = reliefcaseResult[0] || {};

                db.query(reliefcaseQuery, (err5, reliefcaseResult) => {
                  const reliefCaseData = reliefcaseResult[0] || {};

                  

                  //   db.query(reliefpendingQuery, (err7, reliefPendingResult) => {
                  //     const districtReliefPendingData = reliefPendingResult || [];
                    
                      // Send the response
                      res.status(200).json({
                        totalCases,
                        casesBefore2016,
                        casesAfter2016,
                        moreThan7Days,
                        moreThan60Days,
                        moreThan90Days,
                        reliefData,
                        reliefCaseData,
                        // districtReliefPendingData,
                      });
                  //   });
                  
                });
              });
            });
          });
        });
      });
    });
  });
};


exports.applybarchartgivenDataFilters = (req, res) => {
  const filters = req.body;

  let columnName = '';
  switch (filters.selectedFilter) {
    case 'Job':
      columnName = 'employment_status';
      break;
    case 'Pension':
      columnName = 'pension_status';
      break;
    case 'Patta':
      columnName = 'house_site_patta_status';
      break;
    case 'Education':
      columnName = 'education_concession_status';
      break;
    default:
      return res.status(400).json({ error: 'Invalid filter selected' });
  }

  const reliefgivenQuery = `
    SELECT 
      d.district_name AS district_name,
      SUM(CASE WHEN ad.${columnName} = 'yes' THEN 1 ELSE 0 END) AS given_count
    FROM district d
    LEFT JOIN fir_add f ON d.district_name = f.revenue_district
    LEFT JOIN additional_relief a ON f.fir_id = a.fir_id
    LEFT JOIN additional_relief_details ad ON a.id = ad.additional_relief_id
    GROUP BY d.district_name
    ORDER BY given_count DESC;
  `;

  db.query(reliefgivenQuery, (err6, reliefGivenResult) => {
    if (err6) {
      return res.status(500).json({ error: 'Database query failed' });
    }

    const districtReliefData = reliefGivenResult || [];
    res.status(200).json({
      districtReliefData,
    });
  });
};




exports.applybarchartpendingDataFilters = (req, res) => {
  const filters = req.body;

  let columnName = '';
  switch (filters.selectedFilter) {
    case 'Job':
      columnName = 'employment_status';
      break;
    case 'Pension':
      columnName = 'pension_status';
      break;
    case 'Patta':
      columnName = 'house_site_patta_status';
      break;
    case 'Education':
      columnName = 'education_concession_status';
      break;
    default:
      return res.status(400).json({ error: 'Invalid filter selected' });
  }

  const reliefpendingQuery = `
    SELECT 
      d.district_name AS district_name,
      SUM(CASE WHEN ad.${columnName} != 'yes' THEN 1 ELSE 0 END) AS pending_count
    FROM district d
    LEFT JOIN fir_add f ON d.district_name = f.revenue_district
    LEFT JOIN additional_relief a ON f.fir_id = a.fir_id
    LEFT JOIN additional_relief_details ad ON a.id = ad.additional_relief_id
    GROUP BY d.district_name
    ORDER BY pending_count DESC;
  `;

  db.query(reliefpendingQuery, (err7, reliefPendingResult) => {
    if (err7) {
      return res.status(500).json({ error: 'Database query failed' });
    }

    const districtReliefPendingData = reliefPendingResult || [];
    res.status(200).json({
      districtReliefPendingData,
    });
  });
};