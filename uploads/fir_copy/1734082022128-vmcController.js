const db = require('../db');

// Get all members
const getAllMembers = async (req, res) => {
  const query = `
    SELECT 
      vmc_id, 
      salutation, 
      member_type, 
      name, 
      level_of_member, 
      district,
      subdivision,
      designation, 
      other_designation, 
      meeting_date, 
      validity_end_date, 
      status, 
      created_at, 
      updated_at 
    FROM vmc_members
  `;

  db.query(query, (err, data) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(data);
  });
};

// Create a new member
const generateRandomId = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const createMember = async (req, res) => {
  const {
    salutation,
    member_type,
    name,
    level_of_member,
    district,
    subdivision,
    designation,
    other_designation,
    meeting_date,
    validity_end_date,
  } = req.body;

  const vmc_id = generateRandomId(6); // Generate a random `vmc_id`

  // Handle `other_designation`: Insert an empty string if no value is provided
  // const formattedOtherDesignation = other_designation?.trim() || null;

  const query = `
    INSERT INTO vmc_members (
      vmc_id, 
      salutation, 
      member_type, 
      name, 
      level_of_member, 
      district,
      subdivision,
      designation, 
      other_designation, 
      meeting_date, 
      validity_end_date, 
      status, 
      created_at, 
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '1', NOW(), NOW())
  `;

  db.query(
    query,
    [
      vmc_id,
      salutation,
      member_type,
      name,
      level_of_member,
      district,
      subdivision,
      designation,
      other_designation,
      meeting_date,
      validity_end_date,
    ],
    (err, result) => {
      if (err) {
        console.error('Database error on member insertion:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Member created successfully', id: result.insertId });
    }
  );
};



// Update an existing member
const updateMember = async (req, res) => {
  const vmcId = req.params.id; // Assuming `id` is `vmc_id` from the frontend
  const {
    salutation,
    member_type,
    name,
    level_of_member,
    district,
    subdivision,
    designation,
    other_designation,
    meeting_date,
    validity_end_date,
  } = req.body;

  // Validate `vmcId`
  if (!vmcId) {
    return res.status(400).send({ error: 'Member ID is required.' });
  }

  const query = `
    UPDATE vmc_members 
    SET salutation = ?, 
        member_type = ?, 
        name = ?, 
        level_of_member = ?, 
        district = ?, 
        subdivision = ?, 
        designation = ?, 
        other_designation = ?, 
        meeting_date = ?, 
        validity_end_date = ?, 
        updated_at = NOW()
    WHERE vmc_id = ?
  `;

  db.query(
    query,
    [
      salutation,
      member_type,
      name,
      level_of_member,
      district,
      subdivision,
      designation,
      other_designation,
      meeting_date,
      validity_end_date,
      vmcId,
    ],
    (err) => {
      if (err) {
        console.error('Database error on member update:', err);
        return res.status(500).send({ error: 'Database error' });
      }
      res.send({ message: 'Member updated successfully' });
    }
  );
};



// Delete a member
const deleteMember = async (req, res) => {
  const vmcId = req.params.id; // Assuming `id` is `vmc_id` from the frontend

  if (!vmcId) {
    return res.status(400).send({ error: 'Member ID is required.' });
  }

  const query = `DELETE FROM vmc_members WHERE vmc_id = ?`;

  db.query(query, [vmcId], (err, result) => {
    if (err) {
      console.error('Database error on member deletion:', err);
      return res.status(500).send({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ error: 'Member not found.' });
    }

    res.send({ message: 'Member deleted successfully.' });
  });
};



// Get all unique districts
const getAllDistricts = (req, res) => {
  const query = `SELECT DISTINCT district FROM sub_division WHERE status = 1 ORDER BY district`;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(results);
  });
};

// Get subdivisions based on district
const getSubdivisionsByDistrict = (req, res) => {
  const { district } = req.query;
  const query = `SELECT sub_division FROM sub_division WHERE district = ? AND status = 1 ORDER BY sub_division`;
  db.query(query, [district], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send(results);
  });
};


// Toggle member status
const toggleMemberStatus = async (req, res) => {
  const memberId = req.params.id;
  const { status } = req.body;

  const query = `
    UPDATE vmc_members 
    SET status = ?, 
        updated_at = NOW()
    WHERE id = ?
  `;

  db.query(query, [status, memberId], (err) => {
    if (err) {
      console.error('Database error on status toggle:', err);
      return res.status(500).send({ error: 'Database error' });
    }
    res.send({ message: `Member status changed to ${status === '1' ? 'Active' : 'Inactive'}` });
  });
};

module.exports = {
  getAllMembers,
  createMember,
  updateMember,
  deleteMember,
  toggleMemberStatus,
  getSubdivisionsByDistrict,
  getAllDistricts
};
