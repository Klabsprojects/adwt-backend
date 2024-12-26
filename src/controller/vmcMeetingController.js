const db = require('../db'); // DB connection

// Get districts and their corresponding subdivisions
exports.getDistricts = (req, res) => {
  const query = `
    SELECT DISTINCT district, sub_division 
    FROM sub_division
    WHERE status = '1'
  `;

  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Organize the results into a structured map
    const districtMap = {};
    results.forEach((row) => {
      const { district, sub_division } = row;
      if (!districtMap[district]) {
        districtMap[district] = [];
      }
      districtMap[district].push(sub_division);
    });

    // Send the structured data as the response
    res.status(200).json(districtMap);
  });
};


exports.getAttendeesByLocation = (req, res) => {
  const { district, subdivision, committee, year } = req.query;

  // console.log('Committee:', committee);
  // console.log('Year:', year);

  // Validate year format
  const [startYear, endYear] = year.split('-').map(Number);
  if (isNaN(startYear) || isNaN(endYear) || endYear !== startYear + 1) {
    return res.status(400).json({ error: 'Invalid fiscal year format. Expected format: YYYY-YYYY.' });
  }

  const tableMapping = {
    DLVMC: 'dlvmc',
    SDLVMC: 'sdlvmc',
    SLVMC: 'slvmc',
  };

  const tableName = tableMapping[committee.toUpperCase()];
  if (!tableName) {
    return res.status(400).json({ error: 'Invalid committee name.' });
  }

  // Define months for each meeting
  const meetingMonths = {
    DLVMC: {
      '1st Meeting': [4, 5, 6],
      '2nd Meeting': [7, 8, 9],
      '3rd Meeting': [10, 11, 12],
      '4th Meeting': [1, 2, 3],
    },
    SDLVMC: {
      '1st Meeting': [4, 5, 6],
      '2nd Meeting': [7, 8, 9],
      '3rd Meeting': [10, 11, 12],
      '4th Meeting': [1, 2, 3],
    },
    SLVMC: {
      '1st Meeting': [4, 5, 6],
      '2nd Meeting': [10, 11, 12],
    },
  };

  const meetings = meetingMonths[committee.toUpperCase()];
  const result = {};

  // Prepare queries for each meeting
  const promises = Object.entries(meetings).map(([meeting, months]) => {
    let query = `SELECT *,d.meeting_date AS dmeetingDate FROM ${tableName} d 
    LEFT JOIN vmc_members v ON d.district = v.district 
    WHERE MONTH(d.meeting_date) IN (${months.join(','
    )}) AND YEAR(d.meeting_date) = ?`;
    const params = [startYear];

    // Add filters for district and subdivision
    if (committee === 'DLVMC') {
      query += ` AND d.district = ? AND v.level_of_member = ?`;
      params.push(district, tableName);
    } else if (committee === 'SDLVMC') {
      query += ` AND d.district = ? AND d.subdivision = ? AND v.level_of_member = ?`;
      params.push(district, subdivision, tableName);
    }

    // console.log('Executing query:', query, params);

    // Execute query and process the result
    return new Promise((resolve, reject) => {
      db.execute(query, params, (error, rows) => {
        if (error) {
          console.error(`Error executing query for ${meeting}:`, error.message);
          return reject(error);
        }
        resolve({ meeting, data: rows }); // Return raw rows
      });
    });
  });

  // Wait for all queries to resolve
  Promise.all(promises)
    .then((results) => {
      // Combine all results into a single object
      const combinedResults = results.reduce((acc, { meeting, data }) => {
        acc[meeting] = data; // Raw query result for each meeting
        return acc;
      }, {});

      res.status(200).json(combinedResults);
    })
    .catch((error) => {
      console.error('Error fetching meeting data:', error.message);
      res.status(500).json({ error: 'Failed to fetch meeting data.' });
    });
};




// exports.getAttendeesByLocation = async (req, res) => {
//   const { district, subdivision, committee, year } = req.query;

//   console.log('Committee:', committee);
//   console.log('Year:', year);

//   // Validate year format
//   const [startYear, endYear] = year.split('-').map(Number);
//   if (isNaN(startYear) || isNaN(endYear) || endYear !== startYear + 1) {
//     return res.status(400).json({ error: 'Invalid fiscal year format. Expected format: YYYY-YYYY.' });
//   }

//   const tableMapping = {
//     DLVMC: 'dlvmc',
//     SDLVMC: 'sdlvmc',
//     SLVMC: 'slvmc',
//   };

//   const tableName = tableMapping[committee.toUpperCase()];
//   if (!tableName) {
//     return res.status(400).json({ error: 'Invalid committee name.' });
//   }

//   // Define months for each meeting
//   const meetingMonths = {
//     DLVMC: {
//       '1st Meeting': [4, 5, 6],
//       '2nd Meeting': [7, 8, 9],
//       '3rd Meeting': [10, 11, 12],
//       '4th Meeting': [1, 2, 3],
//     },
//     SDLVMC: {
//       '1st Meeting': [4, 5, 6],
//       '2nd Meeting': [7, 8, 9],
//       '3rd Meeting': [10, 11, 12],
//       '4th Meeting': [1, 2, 3],
//     },
//     SLVMC: {
//       '1st Meeting': [4, 5, 6],
//       '2nd Meeting': [10, 11, 12],
//     },
//   };

//   // Prepare result object
//   const result = {};

//   // Check for required fields based on committee type
//   if (committee === 'DLVMC' || committee === 'SDLVMC') {
//     if (!district) {
//       return res.status(400).json({ error: 'District is required for DLVMC and SDLVMC.' });
//     }
//     if (committee === 'SDLVMC' && !subdivision) {
//       return res.status(400).json({ error: 'Subdivision is required for SDLVMC.' });
//     }
//   }

//   try {
//     // Check for each meeting based on the months
//     const meetings = meetingMonths[committee.toUpperCase()];
//     for (const [meeting, months] of Object.entries(meetings)) {
//       let query = `SELECT * FROM ${tableName} WHERE MONTH(meeting_date) IN (${months.join(
//         ','
//       )}) AND YEAR(meeting_date) = ?`;
//       const params = [committee === 'DLVMC' || committee === 'SDLVMC' ? startYear : year];

//       // Add filters for district and subdivision
//       if (committee === 'DLVMC') {
//         query += ` AND district = ?`;
//         params.push(district);
//       } else if (committee === 'SDLVMC') {
//         query += ` AND district = ? AND subdivision = ?`;
//         params.push(district, subdivision);
//       }

//       // Execute query
//       console.log('Executing query:', query, params);


//       const [rows] = await db.execute(query, params);

      
//     }

    
//   } catch (error) {
//     console.error('Error fetching meeting statuses:', error.message);
//     res.status(500).json({ error: 'Failed to fetch meeting statuses.' });
//   }
// };















//   let query = `SELECT * FROM vmc_members WHERE status = 1`; // Only active members

//   // Add year filter if provided
//   if (year) {
//     query += ` AND fiscal_year = ?`;
//   }

//   // For SLVMC, fetch state-level members (no district or subdivision filter)
//   if (committee === 'SLVMC') {
//     query += ` AND level_of_member = 'State Level'`;
//   } 
//   // For DLVMC, filter by district and level_of_member = 'District Level' (subdivision is not needed)
//   else if (committee === 'DLVMC') {
//     if (district) {
//       query += ` AND district = ? AND level_of_member = 'District Level'`; // DLVMC: Only district filter, no subdivision needed
//     } else {
//       return res.status(400).json({ error: 'District is required for DLVMC' });
//     }
//   } 
//   // For SDLVMC, filter by district and subdivision and set level_of_member to subdivision level
//   else if (committee === 'SDLVMC') {
//     if (district && subdivision) {
//       query += ` AND district = ? AND subdivision = ? AND level_of_member = 'Subdivision Level'`;
//     } else {
//       return res.status(400).json({ error: 'District and Subdivision are required for SDLVMC' });
//     }
//   }

//   // Log the query for debugging
//   console.log('Executing query:', query);

//   // Prepare parameters for the query
//   const params = [year, district, subdivision].filter(Boolean); // Include only non-null values

//   // Execute the query with parameters
//   db.query(query, params, (error, results) => {
//     if (error) {
//       console.error('Error fetching attendees:', error);
//       return res.status(500).json({ error: 'Failed to fetch attendees' });
//     }

//     // Log the results to check if any data is being returned
//     console.log('Query results:', results);
//     res.status(200).json(results); // Return the filtered attendees
//   });
// };





// exports.getMeetingStatuses = async (req, res) => {
//   const { committee, year } = req.query;

//   console.log('Received request with:', { committee, year });

//   if (!committee || !year) {
//     return res.status(400).json({ error: 'Committee and fiscal year are required.' });
//   }

//   const [startYear, endYear] = year.split('-').map(Number);
//   if (isNaN(startYear) || isNaN(endYear) || endYear !== startYear + 1) {
//     return res.status(400).json({ error: 'Invalid fiscal year format. Expected format: YYYY-YYYY.' });
//   }

//   const tableMapping = {
//     DLVMC: 'dlvmc',
//     SDLVMC: 'sdlvmc',
//     SLVMC: 'slvmc',
//   };

//   const tableName = tableMapping[committee.toUpperCase()];
//   if (!tableName) {
//     return res.status(400).json({ error: 'Invalid committee name.' });
//   }

//   const meetingPeriods = {
//     '1st Quarter': { start: `${startYear}-04-01`, end: `${startYear}-06-30` },
//     '2nd Quarter': { start: `${startYear}-07-01`, end: `${startYear}-09-30` },
//     '3rd Quarter': { start: `${startYear}-10-01`, end: `${startYear}-12-31` },
//     '4th Quarter': { start: `${endYear}-01-01`, end: `${endYear}-03-31` },
//   };

//   const query = `
//     SELECT meeting_quarter AS period, meeting_date, meeting_status
//     FROM ${tableName}
//     WHERE meeting_date BETWEEN ? AND ?;
//   `;
//   const params = [
//     meetingPeriods['1st Quarter'].start,
//     meetingPeriods['4th Quarter'].end,
//   ];

//   try {
//     console.log('Executing query with params:', params);

//     let queryResult = await db.execute(query, params);
//     let rows;

//     // Handle unexpected query result format
//     if (Array.isArray(queryResult)) {
//       [rows] = queryResult; // Normal case
//     } else if (queryResult._rows) {
//       rows = queryResult._rows; // Fallback for mysql2 Execute object
//     } else if (queryResult._result) {
//       rows = queryResult._result;
//     } else {
//       console.error('Unexpected query result format:', queryResult);
//       return res.status(500).json({ error: 'Unexpected query result format.' });
//     }

//     console.log('Fetched rows:', rows);

//     // Map rows to statuses
//     const statuses = Object.keys(meetingPeriods).reduce((acc, period) => {
//       acc[period] = 'Pending';
//       return acc;
//     }, {});

//     rows.forEach((row) => {
//       if (row.meeting_status === 'Completed') {
//         statuses[row.period] = 'Completed';
//       }
//     });

//     res.status(200).json(statuses);
//   } catch (error) {
//     console.error('Error fetching meeting statuses:', error.message);
//     res.status(500).json({ error: 'Failed to fetch meeting statuses.' });
//   }
// };


// exports.submitMeeting = async (req, res, uploadedFilePath) => {
//   const { committee, meeting, district, subdivision, meetingDate, meetingTime, attendees } = req.body;

//   console.log("Form data received:", req.body);

//   // Validate required fields
//   if (!committee || !meeting || !district || !meetingDate || !meetingTime || !attendees) {
//     return res.status(400).json({ error: "All fields are required." });
//   }

//   const tableMapping = {
//     DLVMC: "dlvmc",
//     SDLVMC: "sdlvmc",
//     SLVMC: "slvmc",
//   };

//   const tableName = tableMapping[committee.toUpperCase()];
//   if (!tableName) {
//     return res.status(400).json({ error: "Invalid committee name." });
//   }

//   // Insert the meeting into the database
//   const meetingQuery =
//     committee.toUpperCase() === "SLVMC"
//       ? `
//           INSERT INTO slvmc (meeting_type, meeting_date, meeting_time, uploaded_minutes, meeting_status)
//           VALUES (?, ?, ?, ?, 'Pending');
//         `
//       : `
//           INSERT INTO ${tableName} (meeting_quarter, meeting_date, meeting_time, district, subdivision, uploaded_minutes, meeting_status)
//           VALUES (?, ?, ?, ?, ?, ?, 'Pending');
//         `;

//   const meetingParams =
//     committee.toUpperCase() === "SLVMC"
//       ? [meeting, meetingDate, meetingTime, uploadedFilePath]
//       : [meeting, meetingDate, meetingTime, district, subdivision || null, uploadedFilePath];

//   try {
//     console.log("Executing meeting insert query...");
//     const [meetingResult] = await db.execute(meetingQuery, meetingParams);
//     const meetingId = meetingResult.insertId;

//     // Parse attendees JSON string
//     const attendeesData = JSON.parse(attendees);

//     // Insert attendees and their attendance statuses
//     const attendeeInsertQuery = `
//       INSERT INTO attendee_meeting_status (meeting_id, attendee_id, attendance_status)
//       VALUES (?, ?, ?);
//     `;

//     const attendeePromises = attendeesData.map((attendee) =>
//       db.execute(attendeeInsertQuery, [meetingId, attendee.id, attendee.attended])
//     );

//     await Promise.all(attendeePromises);

//     res.status(200).json({
//       message: "Meeting and attendee data submitted successfully.",
//       meetingId: meetingId,
//       filePath: uploadedFilePath,
//     });
//   } catch (error) {
//     console.error("Error during meeting submission:", error.message);
//     res.status(500).json({ error: "Failed to submit meeting data." });
//   }
// };












