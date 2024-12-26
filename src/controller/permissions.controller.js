const db = require('../db'); // Your database connection
const express = require('express');
const router = express.Router();


// Define a route to get permissions by role ID
router.get('/api/permissions_role_nav/:roleId', async (req, res) => {
  const roleId = req.params.roleId;

  try {
    // Query to get permissions based on role ID
    const [permissions] = await db.execute(
      `SELECT p.permission_name, p.permission_id
       FROM rolepermissions rp
       JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE rp.role_id = ? AND rp.has_permission = 1`,
      [roleId]
    );

    // Send permissions as the response
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).send('Error fetching permissions');
  }
});

module.exports = router;
