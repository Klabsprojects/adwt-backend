const shgSchema = require("../schemas/shg.schema");
const updateShgSchema = require("../schemas/shg.updateschema");
const shgMemberSchema = require("../schemas/shgMember.schema");
const updateShgMemberSchema = require("../schemas/updateshgMember.schema");
const inCompleteshgMemberSchema = require("../schemas/incompleteMember.Schema");
const shgSchemaInComplete = require("../schemas/inComplete.schema");
const bankLinkageRowsSchema = require("../schemas/bankLinkage.Schema");

const CSTDetailsSchema = require("../schemas/cst.Schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");
const mongo = require("../utils/mongo");


const updateStatus =require('../utils/shgUpdateStatus')

const idGenerator =require('../utils/idGenerator');
const trimData = require('../utils/trimData');

const handleInvalidQuery = (res, message = "") => {
    return res.status(201).send({ message: `no data found` });
};
const getMemberList=async(req,res)=>{
    try{

        const SHGId =Number(req.query.SHGId);
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
    
        const MemberList = await model.find({SHGId, isDeleted: false,reject:0,is_active: 1});
    
        if(MemberList.length>0){

            return res.status(200).send([...MemberList])
        }else{
            return handleInvalidQuery(res, "No SHG member found with given SHGId and MemberId")

        }
    }catch (e) {
        console.log(e)
        return res.status(400).send({ success: false, error: `Invalid Query err: ${e.message}` })
    }



}
const getshgmemberData = async (req, res) => {
    try {
        const modelMapTest = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const modelPending = mongo.conn.model("UpdateData", updateShgMemberSchema, "SHGMemberPending");
        const MemberId = Number(req.query.MemberId);
        const mapTestDataApproved0Update0 = await modelMapTest.find({
            MemberId: MemberId,
        });
        const mapTestDataApproved0UpdateGT0Pending = await modelPending.find({
            MemberId: MemberId,
        }.sort({createdAt:-1,updatedAt:-1}));
        const results = {
            MemberId: MemberId,
            updated: mapTestDataApproved0UpdateGT0Pending.updateCount > 0 ? true : false,
            data: mapTestDataApproved0Update0,
            newData: mapTestDataApproved0UpdateGT0Pending,
        };
        res.json({ status: true, data: results });
    } catch (error) {
        res.status(500).json({ status: false, error: "Internal server error" });
    }
};

const getInactiveList = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgSchema, "SHGMember");
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        const SHGId = Number(req.query.SHGId)
        var query = { isDeleted:false,SHGId,
            $or:[
                { approved: 0, is_active: 1, is_ActiveApproved: 0, is_ActiveReject: 0 },
                { approved: 1, is_active: 0, is_ActiveApproved: 1, is_ActiveReject: 0 },
                { approved: 1, is_active: 1, is_ActiveApproved: 1, is_ActiveReject: 1 }
            ]
        };
        
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

// const memberVerification = async (req, res) => {
//     try {
//         const {contact,AADHAR}={...req?.body}
//         // const contact = req?.body?.contact;
//         if(!contact || !AADHAR){
//             res.json({ status: false, error:"Provide Valid AADHAR and Contact" });

//         }
//         const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
//         const userData = await model.findOne({ AADHAR},
//             {district:1,
//                 block:1,
//                 panchayat:1,
//                 habitation:1,
//                 SHGId:1,
//                 memberName:1,
//                 contact:1,
//                 _id:0,
//                 SHGName:1,
//                 AADHAR:1
//             });

//         if (userData) {
            

//             res.json({ status: true, data: userData });
//         } else {
//             const userDataContact = await model.find({ contact},
//                 {district:1,
//                     block:1,
//                     panchayat:1,
//                     habitation:1,
//                     SHGId:1,
//                     memberName:1,
//                     contact:1,
//                     _id:0,
//                     SHGName:1,
//                     AADHAR:1
//                 });
//                 if(userDataContact){

//                     res.json({ status: true, data: userDataContact });
//                 }else{

//                     res.json({ status: true, data: "Not Found Member" });
//                 }

//         }
//     } catch (e) {
//         res.status(500).json({ status: false, error: e.message });
//     }
// };
const memberVerification = async (req, res) => {
    try {
        const { contact, aadhar } = req?.body || {};

        if (!contact || !aadhar) {
            return res.json({ status: false, error: "Provide Valid AADHAR and Contact" });
        }

        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const projection = {
            district: 1,
            block: 1,
            panchayat: 1,
            habitation: 1,
            SHGId: 1,
            memberName: 1,
            contact: 1,
            _id: 0,
            SHGName: 1,
            AADHAR: 1
        };

        const userData = await model.findOne({ AADHAR:aadhar }, projection);

        if (userData) {
            return res.json({ status: true, data: userData });
        }

        const userDataContact = await model.find({ contact }, projection);

        if (userDataContact.length>0) {
            return res.json({ status: true, data: userDataContact });
        }

        return res.json({ status: false, error: "Member Not Found" });
    } catch (e) {
        return res.status(500).json({ status: false, error: e.message });
    }
};



module.exports ={
    getMemberList,
    getshgmemberData,
    getInactiveList,
    memberVerification
}