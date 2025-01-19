const db = require('../db'); // DB connection

exports.getadditionalreportdetail = async (req, res) => {

   let query = ' select fa.police_city as revenue_district , fa.police_station , fa.fir_number , vm.victim_name, vm.victim_age, vm.victim_gender, vm.offence_committed, vm.scst_sections from fir_add fa '+
  ' left join victims vm on vm.fir_id = fa.fir_id '
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
    // console.log('Query results:', results);
    res.status(200).json({ Data: results });
  });
  } catch (error) {
    console.error("Error in getadditionalreportdetail:", error);
    res.status(500).json({ error: "Failed to get report data." });
  }
};










