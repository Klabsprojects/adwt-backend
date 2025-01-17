const db = require('../db'); // DB connection

exports.getmonthlyreportdetail = async (req, res) => {

  let query = 'select police_city , police_station , fir_number from fir_add;';
  const params = [];

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
    console.error("Error in getmonthlyreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};










