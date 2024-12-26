const db = require('../db'); // Import the database connection

exports.getRolePermissions = (req, res) => {
    console.log(`Received request for role permissions: ${req.params.roleId}`); // Log request
    const roleId = req.params.roleId;

    const query = `
      SELECT p.permission_name, rp.has_permission
      FROM rolepermissions rp
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE rp.role_id = ? AND p.status = 1
    `;

    db.query(query, [roleId], (error, results) => {
      if (error) {
        console.error('Error fetching permissions:', error);
        return res.status(500).send('An error occurred while fetching permissions');
      }

      // Convert the results into an object with permission names and their status
      const permissions = {};
      results.forEach(row => {
        permissions[row.permission_name] = row.has_permission;
      });

      // Return permissions as JSON
      res.json({ permissions });
    });
};

