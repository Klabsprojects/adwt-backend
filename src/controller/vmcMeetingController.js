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


exports.getUserBasedDistrict = (req, res) => {
  const { userId } = req.query;
  const query = ` select district from users where id = ?`;
  const param = [userId];
  db.query(query,param, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json(results);
  });
};


exports.getAttendeesByLocation = (req, res) => {
  const { district, subdivision, committee, year } = req.query;

  console.log('api called')

  const tableMapping = {
    DLVMC: 'dlvmc',
    SDLVMC: 'sdlvmc',
    SLVMC: 'slvmc',
  };

  // Define months for each meeting
  const meetingMonths = {
    DLVMC: {
      '1st Meeting': [1, 2, 3],
      '2nd Meeting': [4, 5, 6],
      '3rd Meeting': [7, 8, 9],
      '4th Meeting': [10, 11, 12],
    
    },
    SDLVMC: {
      '1st Meeting': [1, 2, 3],
      '2nd Meeting': [4, 5, 6],
      '3rd Meeting': [7, 8, 9],
      '4th Meeting': [10, 11, 12],
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
    
    let query = `SELECT * FROM vmc_meeting d 
    LEFT JOIN vmc_meeting_attendees vma ON vma.vmc_meeting_id = d.id
    LEFT JOIN vmc_members v ON v.id = vma.attendee_id
    WHERE MONTH(d.meeting_date) IN (${months.join(','
    )}) AND YEAR(d.meeting_date) = ?`;
    const params = [year];

    // Add filters for district and subdivision
    if (committee === 'DLVMC') {
      query += ` AND d.district = ?`;
      params.push(district);
    } else if (committee === 'SDLVMC') {
      query += ` AND d.district = ? AND d.subdivision = ?`;
      params.push(district, subdivision);
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

exports.submitMeeting = async (req, res) => {
  console.log('checking if changes affect');
  const {
    committee,
    meeting,
    district,
    subdivision,
    meetingDate,
    meetingTime,
    attendees,
    Year,
    uploaded_minutes,
  } = req.body;

  console.log("Form data received:", req.body);

  // Validate required fields
  if (!committee || !meeting || !meetingDate || !meetingTime) {
    return res.status(400).json({ error: "All required fields must be provided." });
  }

  // Build query to check if meeting already exists
  let checkQuery = '';
  let checkParams = [];

  if (committee === 'DLVMC') {
    checkQuery = `SELECT * FROM vmc_meeting WHERE year = ? AND district = ? AND meeting_quarter = ? AND meeting_type = ?`;
    checkParams = [Year, district, meeting, committee];
  } else if (committee === 'SDLVMC') {
    checkQuery = `SELECT * FROM vmc_meeting WHERE year = ? AND district = ? AND meeting_quarter = ? AND subdivision = ? AND meeting_type = ?`;
    checkParams = [Year, district, meeting, subdivision, committee];
  } else if (committee === 'SLVMC') {
    checkQuery = `SELECT * FROM vmc_meeting WHERE year = ? AND meeting_quarter = ? AND meeting_type = ?`;
    checkParams = [Year, meeting, committee];
  }

  db.query(checkQuery, checkParams, async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Backend Error', error: err });
    }

    if (results.length > 0) {
      return res.status(200).json({ message: "Meeting already exists!" });
    }

    if (!district && committee !== 'SLVMC') {
      return res.status(400).json({ error: "District is required for this committee type." });
    }

    // Insert meeting record
    const insertMeetingQuery = `
      INSERT INTO vmc_meeting (
        year, meeting_type, meeting_quarter, meeting_date, meeting_time,
        district, subdivision, uploaded_minutes, meeting_status, uploaded_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const insertMeetingParams = [
      Year,
      committee,
      meeting,
      meetingDate,
      meetingTime,
      district || null,
      subdivision || null,
      uploaded_minutes,
      'Completed'
    ];

    try {
      await new Promise((resolve, reject) => {
        db.query(insertMeetingQuery, insertMeetingParams, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      // Get last inserted meeting ID
      const meetingId = await new Promise((resolve, reject) => {
        db.query('SELECT id FROM vmc_meeting ORDER BY id DESC LIMIT 1', (err, result) => {
          if (err || result.length === 0) return reject(err || new Error("No meeting found"));
          resolve(result[0].id);
        });
      });

      // Parse and validate attendees
      let attendeesData = [];
      try {
        if (typeof attendees === 'string') {
          attendeesData = JSON.parse(attendees);
        } else if (Array.isArray(attendees)) {
          attendeesData = attendees;
        }
      } catch (err) {
        console.error('Error parsing attendees:', err);
        return res.status(400).json({ error: "Invalid attendees format" });
      }

      // Insert attendees if any
      if (attendeesData.length > 0) {
        const insertAttendeeQuery = `
          INSERT INTO vmc_meeting_attendees (vmc_meeting_id, attendee_id, Attendance)
          VALUES (?, ?, ?)
        `;

        const insertPromises = attendeesData.map((attendee) => {
          return new Promise((resolve, reject) => {
            db.query(
              insertAttendeeQuery,
              [meetingId, attendee.id, attendee.attended],
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
          });
        });

        await Promise.all(insertPromises);
      }

      return res.status(200).json({
        message: "Meeting submitted successfully.",
        meetingId,
        filePath: uploaded_minutes,
      });

    } catch (error) {
      console.error("Submission Error:", error);
      return res.status(500).json({ error: "Failed to submit meeting data." });
    }
  });
};


exports.updateMeeting = async (req, res) => {
  const {
    meetingId,
    committee,
    meeting,
    district,
    subdivision,
    meetingDate,
    meetingTime,
    attendees,
    Year,
    uploaded_minutes,
  } = req.body;

  if (!meetingId || !committee || !meeting || !meetingDate || !meetingTime) {
    return res.status(400).json({ error: "Required fields missing." });
  }

  const updateMeetingQuery = `
    UPDATE vmc_meeting
    SET
      year = ?,
      meeting_type = ?,
      meeting_quarter = ?,
      meeting_date = ?,
      meeting_time = ?,
      district = ?,
      subdivision = ?,
      uploaded_minutes = ?,
      meeting_status = 'Completed',
      uploaded_date = NOW()
    WHERE id = ?
  `;

  const updateMeetingParams = [
    Year,
    committee,
    meeting,
    meetingDate,
    meetingTime,
    district || null,
    subdivision || null,
    uploaded_minutes,
    meetingId,
  ];

  try {
    // 1. Update meeting
    await new Promise((resolve, reject) => {
      db.query(updateMeetingQuery, updateMeetingParams, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // 2. Delete old attendees
    await new Promise((resolve, reject) => {
      db.query(
        'DELETE FROM vmc_meeting_attendees WHERE vmc_meeting_id = ?',
        [meetingId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // 3. Parse and insert new attendees
    let attendeesData = [];
    try {
      if (typeof attendees === 'string') {
        attendeesData = JSON.parse(attendees);
      } else if (Array.isArray(attendees)) {
        attendeesData = attendees;
      }
    } catch (err) {
      return res.status(400).json({ error: "Invalid attendees format." });
    }

    if (attendeesData.length > 0) {
      const insertAttendeeQuery = `
        INSERT INTO vmc_meeting_attendees (vmc_meeting_id, attendee_id, Attendance)
        VALUES (?, ?, ?)
      `;

      const insertPromises = attendeesData.map((attendee) =>
        new Promise((resolve, reject) => {
          db.query(
            insertAttendeeQuery,
            [meetingId, attendee.id, attendee.attended],
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
        })
      );

      await Promise.all(insertPromises);
    }

    return res.status(200).json({
      message: "Meeting updated successfully.",
      meetingId,
    });

  } catch (error) {
    console.error("Error updating meeting:", error);
    return res.status(500).json({ error: "Failed to update meeting." });
  }
};

// Delete a meeting
 exports.DeleteMeeting = async (req, res) => {
  const MeetingId = req.params.id; // Assuming `id` is `vmc_id` from the frontend

  if (!MeetingId) {
    return res.status(400).send({ error: 'Meeting ID is required.' });
  }

  const query = `DELETE FROM vmc_meeting WHERE id = ?`;

  db.query(query, [MeetingId], (err, result) => {
    if (err) {
      console.error('Database error on Meeting deletion:', err);
      return res.status(500).send({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ error: 'Meeting not found.' });
    }

    res.send({ message: 'Meeting deleted successfully.' });
  });
};



exports.getAttendeesByDistrictbysk = async (req, res) => {
  // console.log('testbysk');
  const { committee, district, subdivision } = req.body;

  console.log("Form data received:", req.body);

  let query = 'SELECT * FROM vmc_members';
  const params = [];

  query += ' WHERE status = "1"';

  try {
    if (committee === 'SLVMC') {
      query += ' AND level_of_member = ?';
      params.push('State Level');
    } else if (committee === 'SDLVMC') {
      query += ' AND level_of_member = ? AND district = ?';
      params.push('Subdivision', district);
      if (subdivision) {
        query += ' AND subdivision = ?';
        params.push(subdivision);
      }
    } else if (committee === 'DLVMC') {
      query += ' AND level_of_member = ? AND district = ?';
      params.push('District Level', district);
    }

    
    
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to retrieve data', error: err });
    }
    if (results.length === 0) {
      console.log('No records found');
      return res.status(200).json({ message: 'No records found' });
    }
    console.log('Query results:', results);
    res.status(200).json({ Data: results });
  });
  } catch (error) {
    console.error("Error in getAttendeesByDistrictbysk:", error);
    res.status(500).json({ error: "Failed to get vmc member data." });
  }
};


exports.getAllMeeting = async (req, res) => {

  try {
    
    const query = `select * from vmc_meeting where year = '2025'`

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to retrieve data', error: err });
    }
    if (results.length === 0) {
      console.log('No records found');
      return res.status(200).json({ message: 'No records found' });
    }
    // console.log('Query results:', results);
    res.status(200).json({ Data: results });
  });
  } catch (error) {
    res.status(500).json({ error: "Failed to get vmc Meeting data." });
  }
};

function getTotalMembers(district) {
  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(id) AS total FROM vmc_members WHERE district = ? and subdivision = ?`;
    db.query(query, [district,''], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return reject(err);
      }
      const total = results[0]?.total || 0;
      resolve(total);
    });
  });
}

exports.GetVmcMeetings = async (req, res) => {
  try {
    const filters = req.query;
    const whereConditions = [];
    const params = [];
    var totalMember;

    // Dynamically build WHERE conditions
    if (filters.year) {
      whereConditions.push(`vm.year = ?`);
      params.push(filters.year);
    }
    
    if (filters.meeting_type) {
      whereConditions.push(`vm.meeting_type = ?`);
      params.push(filters.meeting_type);
    }
    if (filters.meeting_status) {
      whereConditions.push(`vm.meeting_status = ?`);
      params.push(filters.meeting_status);
    }
    if (filters.meeting_quarter) {
      whereConditions.push(`vm.meeting_quarter = ?`);
      params.push(filters.meeting_quarter);
    }

    if (filters.district) {
      whereConditions.push(`vm.district = ?`);
      params.push(filters.district);
      totalMember = await getTotalMembers(filters.district);
    }

    // Build final query
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    // const query = `SELECT * FROM vmc_meeting ${whereClause}`;

    const query = `
    SELECT 
    vm.id,
    vm.year,
    vm.meeting_type,
    vm.meeting_quarter,
    vm.meeting_date,
    vm.meeting_time,
    vm.district,
    vm.subdivision,
    vm.uploaded_minutes,
    vm.meeting_status,
    vm.uploaded_date,
    COUNT(DISTINCT vmaa.attendee_id) AS total_member,
    COUNT(DISTINCT vma.attendee_id) AS present
    FROM vmc_meeting vm
    LEFT JOIN vmc_meeting_attendees vma ON vma.vmc_meeting_id = vm.id AND vma.Attendance = 'true'
    LEFT JOIN vmc_meeting_attendees vmaa ON vmaa.vmc_meeting_id = vm.id
    ${whereClause}
    GROUP BY vm.id
  `;

    console.log(query);
    console.log(params);
    // Execute query
    db.query(query, params, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Failed to retrieve VMC Meeting data', error: err });
      }

      if (!results || results.length === 0) {
        return res.status(200).json({ data: [], message: 'No records found' });
      }

      return res.status(200).json({
        data: results,
        total: results.length,
        filters: filters,
        total_members : totalMember // send back filters for reference
      });
    });
  } catch (error) {
    console.error('Error fetching VMC Meeting data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};





exports.GetMeetingAttendiesById = async (req, res) => {
  console.log('testbysk');


  let query = 'SELECT mem.id, mem.salutation, mem.member_type, mem.name, mem.designation, ma.Attendance as attended FROM vmc_members mem ';
  query += ' left join vmc_meeting_attendees ma on ma.attendee_id = mem.id ';
  query += ' left join vmc_meeting vm on vm.id = ma.vmc_meeting_id where vm.id = ?';
  const params = [req.query.id];

  try {
    
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to retrieve data', error: err });
    }
    if (results.length === 0) {
      console.log('No records found');
      return res.status(200).json({ message: 'No records found' });
    }
    console.log('Query results:', results);
    res.status(200).json({ Data: results });
  });
  } catch (error) {
    console.error("Error in getAttendeesByDistrictbysk:", error);
    res.status(500).json({ error: "Failed to get vmc member data." });
  }
};



