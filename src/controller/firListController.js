// firListController.js

// Import database connection (Assuming you're using a MySQL or other relational database)
const db = require('../db'); // Adjust the path to your actual DB config

// Controller to fetch all FIRs
exports.getFirList = (req, res) => {
  //console.log("Fetching FIR list"); // For debugging, this should log to your backend console
  const query = `SELECT * FROM fir_add ORDER BY created_at DESC`; // Fetch all FIRs sorted by created_at

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