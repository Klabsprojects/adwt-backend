const shgSchema = require("../schemas/shg.schema");
const updateShgSchema = require("../schemas/shg.updateschema");
const shgMemberSchema = require("../schemas/shgMember.schema");
const updateShgMemberSchema = require("../schemas/updateshgMember.schema");
const shgSchemaInComplete = require("../schemas/inComplete.schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shg'
  };
//   const dbConfig = {
//     host: '74.208.92.52',
//     user: 'ims1',
//     password: 'Pass@2023',
//     database: 'womensdev'
// };
  
  const mysql = require('mysql2/promise'); 
  const pool = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    namedPlaceholders: true, // Enable named placeholders,
    waitForConnections: true,
    connectionLimit: 1000,
    queueLimit: 0
  }); 
const mongo = require("../utils/mongo");
const handleInvalidQuery = (res, message = "") => {
    return res.status(201).send({ message: `no data found` });
};

// get shg in active list
const getinActiveList = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { is_active: 0, is_ActiveApproved: 1, approved: 1, is_ActiveReject: 0 };
        district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
        block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (query.panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
        habitation ? (query.habitation = { $regex: new RegExp(habitation, "i") }) : null;
        const data = await model
            .find(query, { _id: 0, __v: 0 })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .skip(skip);
        const count = await model.countDocuments(query);
        const totalCount = await model.countDocuments();
        if (data.length <= 0) {
            return handleInvalidQuery(
                res,
                "No SHGs found in village, create shg first"
            );
        }
        res.set("SHG-Total-Count", count);
        return res.send(data);
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const InActiveShg = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const modelMapTest = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const modelmember = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const SHGId = Number(req.body.SHGId);
        const is_ActiveSummary = req.body.is_ActiveSummary;
        const approvedBY = req.body.approvedBY;
        const updatedBy = req.body.updatedBy;
        const shgMembersActive = await modelmember.find({
            SHGId,
            is_active: 1,
            reject:0
        });
        if (shgMembersActive.length > 0) {
            res.status(400).json({
                message: 'Fist in active all members.',
            });
            return;
        }
        await modelMapTest.updateOne({ SHGId },
            { $set: { is_ActiveApproved: 0, approved: 0, is_active: 1, is_ActiveReject: 0, approvedBY: approvedBY, approvedAt: new Date(), updatedAt: new Date(), updatedBy: updatedBy, is_ActiveSummary: is_ActiveSummary } });
        const newPendingDocument = new shgPendingModel({
            SHGId,  is_ActiveApproved: 0, is_ActiveSummary: is_ActiveSummary, approvedBY: approvedBY, approvedAt: new Date(), approved: 0,is_active: 0,
        });
       
        const updatedMapTestData = await modelMapTest.find({ SHGId });
        const updatedPendingData = await newPendingDocument.save();
        res.status(200).json({
            status: true,
            message: `SHG with ID ${SHGId} has been made inactive.`,
            shgMapTest: updatedMapTestData,
            shgPending: updatedPendingData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'An error occurred while processing the request.',
        });
    }
};

// APPROVED SHGMEMBER
const ApprovedInActiveMember = async (req, res) => {
    try {
        try {
            var update_count_data = `update shg_members SET approved=1,is_active=1,reject=0,approved_by= '${req.body.approvedBY}' where id=${req.body.MemberId}`;
           const [updates_count] = await pool.execute(update_count_data);
           return res.status(200).json({ status: true, data: updates_count });
       } catch (error) {
           console.error("Error rejecting SHG from the active list:", error);
           return res.status(500).json({
               status: false,
               error: `Internal server error: ${error.message}`,
           });
       }
    } catch (error) {
        console.error("Error approving SHG member:", error);
        res.status(500).json({
            status: false,
            error: `Internal server error: ${error.message}`,
        });
    }
};
// shgmember
const getinActiveListMember = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        var { district, block, panchayat, habitation, limit, skip, SHGId } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { is_active: 0, is_ActiveApproved: 1, approved: 1, is_ActiveReject: 0 };
        district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
        block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (query.panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
        habitation ? (query.habitation = { $regex: new RegExp(habitation, "i") }) : null;
        SHGId ? query.SHGId = SHGId : null;

        const data = await model
            .find(query, { _id: 0, __v: 0 })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .skip(skip);
        const count = await model.countDocuments(query);
        const totalCount = await model.countDocuments();
        if (data.length <= 0) {
            return handleInvalidQuery(
                res,
                "No SHGs found in village, create shg first"
            );
        }
        res.set("SHG-Total-Count", count);
        return res.send(data);
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};
//Member inactive Reject
const InActiveMember = async (req, res) => {
    try {
         var update_count_data = `update shg_members SET reject=1,reason='${req.body.is_ActiveRejectSummary}',rejected_by= '${req.body.approvedBY}' where id=${req.body.MemberId}`;
        const [updates_count] = await pool.execute(update_count_data);
        return res.status(200).json({ status: true, data: updates_count });
    } catch (error) {
        console.error("Error rejecting SHG from the active list:", error);
        return res.status(500).json({
            status: false,
            error: `Internal server error: ${error.message}`,
        });
    }
};
// SHGMAPTEST APPROVED
const ApprovedInActiveshg = async (req, res) => {
    try {
        var update_count_data = `update shg SET reject=0,approved=1,is_active=1 where id=${req.body.SHGId}`;
       const [updates_count] = await pool.execute(update_count_data);
       return res.status(200).json({ status: true, data: updates_count });
   } catch (error) {
       console.error("Error rejecting SHG from the active list:", error);
       return res.status(500).json({
           status: false,
           error: `Internal server error: ${error.message}`,
       });
   }
};

/* INACTIVE SHG REJECT */
const InActiveRejectShg = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const modelMapTest = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const SHGId = Number(req.body.SHGId);
        const approvedBY = req.body.approvedBY;
        const is_ActiveRejectSummary = req.body?.is_ActiveRejectSummary;
        
        if (shgMemberApprove.length > 0) {
            // Update SHGMapTest (assuming you want to set is_ActiveApproved and approvedBY):
            await modelMapTest.findOneAndUpdate({ SHGId }, {
                $set: { is_ActiveApproved: 1,is_ActiveReject:1, approvedBY: approvedBY, is_active: 0, approvedAt: new Date(), approved: 1,is_ActiveRejectSummary }
            });
            // Update Pending (assuming you want to set is_ActiveApproved and approvedBY):
            await shgPendingModel.findOneAndUpdate({ SHGId }, {
                $set: { is_ActiveApproved: 1,is_ActiveReject:1, approvedBY: approvedBY, approvedAt: new Date(), approved: 1,is_ActiveRejectSummary }
            });
            const updatedMapTestData = await modelMapTest.find({ SHGId });
            const updatedPendingData = await shgPendingModel.find({ SHGId });
            res.status(200).json({
                status: true,
                message: 'All SHG members are approved, SHG and pending data updated.',
                shgMapTest: updatedMapTestData,
                shgPending: updatedPendingData,
            });
        } else {
            res.status(400).json({
                message: 'No SHG with is_ActiveApproved: 01 found to approve SHG and pending data.',
            });
        }
    } catch (error) {
        // Handle any errors that might occur during the database queries or updates.
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'An error occurred while processing the request.',
        });
    }
};

const getunApprovedListshg = async (req, res) => {
    try {
        var { district, block, panchayat, habitation, limit, skip, id } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var conditions = [];

        if (district) {
        conditions.push(`shg.district LIKE '%${district}%'`);
        }

        if (block) {
        conditions.push(`shg.block LIKE '%${block}%'`);
        }

        if (panchayat) {
        conditions.push(`shg.panchayat LIKE '%${panchayat}%'`);
        }

        if (habitation) {
        conditions.push(`shg.habitation LIKE '%${habitation}%'`);
        }

        // Join all conditions with ' AND '
        var whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        var queryString = `
        SELECT *
        FROM shg
         ${whereClause}
        AND is_active=0
        ORDER BY shg.created_at DESC, shg.id DESC
        LIMIT ${limit}
        OFFSET ${skip};
        `;
        console.log(queryString);
        const connection = await pool.getConnection();
        const [data] = await connection.query(queryString);
        connection.release();
        console.log(data);
        console.log("rows datadfhdshf  hsdbfhsdf hbsdfhsdnf hsbdfh snf hshdbfhsnd f");
        if (data.length <= 0) {
            return res.send({
                status: true,
                count: 0,
                data: [],
            });
        }
        res.set("SHG-Total-Count", data.length);
        return res.send({
            status: true,
            count: data.length,
            data: data,
        });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

// const getunApprovedListshg = async (req, res) => {
//     try {
//         const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
//         var { district, block, panchayat, habitation, limit, skip } = req.query;
//         limit = limit ? parseInt(limit) : 100;
//         skip = skip ? parseInt(skip) : 0;
//         var query = { isDeleted: false, is_active: 1, approved: 0, is_ActiveApproved: 0, is_ActiveReject: 0 };
//         district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
//         block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
//         panchayat ? (query.panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
//         habitation ? (query.habitation = { $regex: new RegExp(habitation, "i") }) : null;
//         const data = await model
//             .find(query, { _id: 0, __v: 0 })
//             .sort({ createdAt: -1, _id: -1 })
//             .limit(limit)
//             .skip(skip);
//         const count = await model.countDocuments(query);
//         const totalCount = await model.countDocuments();
//         if (data.length <= 0) {
//             return handleInvalidQuery(
//                 res,
//                 "No SHGs found in village, create shg first"
//             );
//         }
//         res.set("SHG-Total-Count", count);
//         return res.send(data);
//     } catch (e) {
//         return res
//             .status(400)
//             .send({ status: false, error: `Invalid Query err: ${e.message}` });
//     }
// };

const getunApprovedListmember = async (req, res) => {
    try {
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
         
        var conditions = [];

        if (district) {
        conditions.push(`shg.district LIKE '%${district}%'`);
        }

        if (block) {
        conditions.push(`shg.block LIKE '%${block}%'`);
        }

        if (panchayat) {
        conditions.push(`shg.panchayat LIKE '%${panchayat}%'`);
        }

        if (habitation) {
        conditions.push(`shg.habitation LIKE '%${habitation}%'`);
        }

        // Join all conditions with ' AND '
        var whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Construct the query string with the dynamic whereClause
        var queryString = `
        SELECT shg_members.*, shg.shg_name, shg.panchayat, shg.habitation, shg.block
        FROM shg_members
        INNER JOIN shg ON shg.id = shg_members.shg_id
        ${whereClause}
        AND (shg_members.is_active = 0 OR shg_members.reject=1)
        ORDER BY shg_members.created_at DESC
        LIMIT ${limit}
        OFFSET ${skip};
        `;

        // Now queryString will be correctly formatted regardless of which filters are applied

        const connection = await pool.getConnection();
        const [data] = await connection.query(queryString);
        connection.release();
        console.log(data);
        console.log("rows datadfhdshf  hsdbfhsdf hbsdfhsdnf hsbdfh snf hshdbfhsnd f");
        if (data.length <= 0) {
            return res.send({
                status: true,
                count: 0,
                data: [],
            });
        }
        res.set("SHG-Total-Count", data.length);
        return res.send({
            status: true,
            count: data.length,
            data: data,
        });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};
// inactive shg maker
const InActiveShgmaker = async (req, res) => {
    try { 
        // console.log(req.body);
        const SHGId = Number(req.body.SHGId);
        const MemberId = Number(req.body.MemberId);
        const is_ActiveSummary = req.body.is_ActiveSummary,
            memberName = req.body.memberName;
        const updatedBy = req.body.updatedBy; 
        const connection = await pool.getConnection();
        const update_count_data = `UPDATE shg_members SET is_active=?, updated_by=?, reason=? WHERE shg_id=? AND member_id=?`;
        const [updates_count] = await pool.execute(update_count_data, [0,updatedBy, is_ActiveSummary, SHGId, MemberId]);
        console.log(updates_count);
         res.status(200).json({ status: true, message: `Member with ID ${MemberId} has been inactive from the active list.` });
        
    } catch (error) {
        console.error("Error rejecting SHG from the active list:", error);
        res.status(500).json({
            status: false,
            error: `Internal server error: ${error.message}`,
        });
    }
};
// inactive shgmember maker

const InActiveMembermaker = async (req, res) => {
    try { 
        // console.log(req.body);
        const SHGId = Number(req.body.SHGId); 
        const is_ActiveSummary = req.body.is_ActiveSummary;
        const updatedBy = req.body.updatedBy; 
        const connection = await pool.getConnection();
        const update_count_data = `UPDATE shg SET is_active=?, updated_by=?, reason=? WHERE shg_id=?`;
        const [updates_count] = await pool.execute(update_count_data, [0,updatedBy, is_ActiveSummary, SHGId]);
        console.log(updates_count);
         res.status(200).json({ status: true, message: `Member with ID ${MemberId} has been inactive from the active list.` });
        
    } catch (error) {
        console.error("Error rejecting SHG from the active list:", error);
        res.status(500).json({
            status: false,
            error: `Internal server error: ${error.message}`,
        });
    }
};
module.exports = {
    getinActiveList,
    InActiveShg,
    getinActiveListMember,
    InActiveMember,
    ApprovedInActiveMember,
    ApprovedInActiveshg,
    getunApprovedListshg,
    getunApprovedListmember,
    InActiveShgmaker,
    InActiveMembermaker,
    InActiveRejectShg

}