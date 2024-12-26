const shgMemberSchema = require("../schemas/shgMember.schema");
// const mongo = require("../utils/mongo");

const getAutoFill = async (req, res) => {
  try {
    const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
    const { district, block, panchayat } = req.query;
    const AADHAR = Number(req.query.AADHAR);
    if (!district || !block || !panchayat || !AADHAR) {
      return res.status(400).send({ success: false, error: "Missing required parameters" });
    }
    const regexDistrict = new RegExp(district, "i");
    const regexBlock = new RegExp(block, "i");
    const regexPanchayat = new RegExp(panchayat, "i");
    const query = {
      isDeleted: false,
      AADHAR,
    };
    const shg = await model.findOne(query, { _id: 0, __v: 0 });
    if (!shg) {
      return res.status(404).send({ success: false, error: "No matching SHG found" });
    }

    const {
      SHGName,
      SHGCode,
      formationDate,
      memberName,
      fatherName,
      contact,
      religion,
      community,
      DOB,
      gender,
      education,
      accountNumber,
      branchName,
      IFSC,
      
    } = shg;

    const response = {
      district,
      block,
      panchayat,
      SHGName,
      SHGCode,
      formationDate,
      memberName,
      fatherName,
      contact,
      religion,
      community,
      DOB,
      gender,
      education,
      accountNumber,
      branchName,
      IFSC,
      AADHAR
    };

    return res.status(200).send({ status: true, data: response });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, error: `Internal server error: ${e.message}` });
  }
};

module.exports = {
  getAutoFill
};
