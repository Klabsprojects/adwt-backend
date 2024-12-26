const nrlmShgMemberSchema = require("../schemas/nrlmShgMember.Schema");
const nrlmShgSchema = require("../schemas/nrlmShg.schema")

const mongo = require("../utils/mongo");
const trimData = require('../utils/trimData');
const { query } = require("express");

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shg'
  };
  
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
const handleInvalidQuery = (res, message = "") => {
    return res.status(201).send({ message: `no data found` });
};

/* GET SHG */
const getShgs = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", nrlmShgSchema, "nrlmSHG");
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = {};
        district ? (query.district_name = { $regex: new RegExp(district, "i") }) : null;
        block ? (query.block_name = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (query.grampanchayat_name = { $regex: new RegExp(panchayat, "i") }) : null;
        habitation ? (query.village_name = { $regex: new RegExp(habitation, "i") }) : null;
        const data = await model
            .find({ ...query })
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
        const shgList = [];
        res.set("SHG-Total-Count", count);
        res.send(data);

    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

/* GET SHG MEMBER */
const getShgMembers = async (req, res) => {
    try {
        const shg_code = Number(req.query.shgcode);
        const model = mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember");

        const data = await model.find({ shg_code });
        const count = await model.countDocuments({ shg_code });
        if (data.length <= 0) {
            return handleInvalidQuery(
                res,
                "No SHGs found in village, create shg first"
            );
        }
        res.set("SHG-Total-Count", count);

        res.send(data);



    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
}

/* GET SPECIFIC MEMBER DETAILS*/
const getShgMember = async (req, res) => {
    try {
        const shg_member_code = Number(req.params.membercode);
        const model = mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember");

        const data = await model.find({ shg_member_code });
        if (data.length <= 0) {
            return handleInvalidQuery(
                res,
                "No SHGs found in village, create shg first"
            );
        }

        res.send(data);



    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
}

/* UPDATE SHG MEMBER */
const updateShgMember = async (req, res) => {
    try {
       const {shg_member_code, mobile_number,aadhar,smart_card_no,updatedBy,shg_code} = {...req.body}
        const model = mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember");
        const shgModel = mongo.conn.model("SHG", nrlmShgSchema, "nrlmSHG");
        const data = await model.findOneAndUpdate({ shg_member_code },{$set:{mobile_number:mobile_number,aadhar:aadhar,smart_card_no:smart_card_no,updatedBy,updatedAt:new Date(),member_update_status:1}});
        const shgUpdate = await model.find({shg_code,member_update_status:0});
        if(shgUpdate.length<1){
             await shgModel.findOneAndUpdate({shg_code},{$set:{member_update_status:1,updatedBy,updatedAt:new Date()}},{new:true});

        }     
        res.send(data);



    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
}


/* DUPLICATE */
const aadharValidate = async (req, res) => {
    try {
        const aadhar = req.params.aadhar;
        const model = mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember");

        const existingMember = await model.find({ aadhar });

        if (
            (existingMember.length > 0 && existingMember != null)) {
            if (existingMember.length > 0) {
                return res
                    .status(409)
                    .json({
                        status: "error",
                        error: "Already Registered user",
                        data: existingMember,
                    });
            } else {
                return res
                    .status(409)
                    .json({
                        status: "error",
                        error: "Already Registered user",
                        data: existingPendingMember,
                    });
            }
        } else {
            return res.status(200).json({ status: "success", message: "New User" });
        }
    } catch (err) {
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
};

const smartCardValidate = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const smart_card_no = req.params.smartCard;
        var query_string = `select * from shg_members where smart_card=${smart_card_no}`;
        const [rows] = await connection.query(query_string); 
        const model = mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember");

        const existingMember = await model.find({ smart_card_no });
        if (rows.length > 0) {
                return res
                    .status(409)
                    .json({
                        status: "error",
                        error: "Already Registered user",
                        data: existingMember,
                    });
        } else {
            return res.status(200).json({ status: "success", message: "New User" });
        }
        
    } catch (err) {
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
};
const contactValidate = async (req, res) => {
    try {
        const mobile_number = Number(req.params.contact);
        const model = mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember");

        const existingMember = await model.find({ mobile_number });

        if (
            (existingMember.length > 0 && existingMember != null)) {
            if (existingMember.length > 0) {
                return res
                    .status(409)
                    .json({
                        status: "error",
                        error: "Already Registered user",
                        data: existingMember,
                    });
            }
        } else {
            return res.status(200).json({ status: "success", message: "New User" });
        }
    } catch (err) {
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
};

/* REPORTS */
const reportCount =async (req,res)=>{
    try{

        const model = mongo.conn.model("SHG", nrlmShgSchema, "nrlmSHG");
        const memberModel = mongo.conn.model("SHGMember", nrlmShgMemberSchema,"nrlmShgMember" )
            var { district, block, panchayat, habitation,startDate,endDate } = req.query;
            
            var query = {};
            let updatedAt;
            district ? (query.district_name = { $regex: new RegExp(district, "i") }) : null;
            block ? (query.block_name = { $regex: new RegExp(block, "i") }) : null;
            panchayat ? (query.grampanchayat_name = { $regex: new RegExp(panchayat, "i") }) : null;
            habitation ? (query.village_name = { $regex: new RegExp(habitation, "i") }) : null;
            startDate ? updatedAt= {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
              }:null
            // console.log(query)
            // console.log(updatedAt)
            /* SHG */
            const shg_t_count = await model.countDocuments({...query});//TOTAL
            const shg_p_count = await model.countDocuments({...query,member_update_status:0});//PENDING
            let shg_c_count;
            if(startDate){
                shg_c_count = await model.countDocuments({...query,member_update_status:1,updatedAt});//COMPLETED

            }else{
                shg_c_count = await model.countDocuments({...query,member_update_status:1});//COMPLETED

            }


            /* MEMBER */
            // console.log(shg_t_count);
            const member_t_count = await memberModel.countDocuments({...query});//TOTAL
            const member_p_count = await memberModel.countDocuments({...query,member_update_status:0});//PENDING
            let member_c_count;
            if(startDate){
                member_c_count = await memberModel.countDocuments({...query,member_update_status:1,updatedAt});//COMPLETED

            }else{
                member_c_count = await memberModel.countDocuments({...query,member_update_status:1});//COMPLETED

            }
            res.json({status:true, 
                shg:{
                    SHGTotalCount:shg_t_count,
                    SHGPendingCount:shg_p_count,
                    SHGCompletedCount:shg_c_count,
                },
                member:{
                    memberTotalCount:member_t_count,
                    memberPendingCount:member_p_count,
                    memberCompletedCount:member_c_count
                }
            });
    }catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }

}

const reportsList = async(req, res)=>{
    const model = mongo.conn.model("SHG", nrlmShgSchema, "nrlmSHG");
    const memberModel = mongo.conn.model("SHGMember", nrlmShgMemberSchema,"nrlmShgMember" )
            var { district, block, panchayat, habitation,startDate,endDate } = req.query;
            
            var query = {};
            let updatedAt;
            district ? (query.district_name = { $regex: new RegExp(district, "i") }) : null;
            block ? (query.block_name = { $regex: new RegExp(block, "i") }) : null;
            panchayat ? (query.grampanchayat_name = { $regex: new RegExp(panchayat, "i") }) : null;
            habitation ? (query.village_name = { $regex: new RegExp(habitation, "i") }) : null;
            startDate ? updatedAt= {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
              }:null;
            //   console.log(query)
            if(district&&block &&!panchayat&&!habitation){
               const dataCount=await getPanchaytReport(query,startDate,endDate);
               return res.send(dataCount)
            }if(district && block && panchayat && !habitation){
                const dataCount = await getHabitationReport(query,startDate,endDate);
                return res.send(dataCount);
            }if(district && block && panchayat && habitation){
                const dataCount = await getReport(query,startDate,endDate);
                return res.send(dataCount);

            }


}




module.exports = {
    getShgs,
    getShgMember,
    getShgMembers,
    aadharValidate,
    smartCardValidate,
    contactValidate,
    updateShgMember,
    reportCount,
    reportsList
}


const getPanchaytReport =async (query,startDate,endDate )=>{
    const locationModel = mongo.conn.model("locationData", {}, "locationData");


    const data = await locationModel.find(
        { district:query.district_name,block:query.block_name },
        { district: 1, block: 1, panchayat: 1, villagecode: 1, _id: 0 }
    );
    const panchayatList = await trimData.uniqueData(data);
    // console.log(panchayatList);
   const countData = await getshgsCount(query, panchayatList,startDate,endDate)
    return countData
}
const getHabitationReport =async (query, startDate,endDate)=>{
    // console.log('sdfds',query)
    const locationModel = mongo.conn.model("locationData", {}, "locationData");


    const data = await locationModel.find(
        { district:query.district_name,block:query.block_name,panchayat:query.grampanchayat_name },
        { district: 1, block: 1, panchayat: 1,habitation: 1, _id: 0, villagecode: 1,habitation_id:1 }
    );
    const habitationList = await trimData.uniqueData(data);
    // console.log(habitationList);
   const countData = await getshgsHCount(query, habitationList,startDate,endDate)
    return countData
}

// const getCounts = async (model, query, status, panchayat, startDate) => {
//     const baseQuery = { ...query, grampanchayat_name: { $regex: new RegExp(panchayat, "i") } };

//     const total_count = await model.find(baseQuery).lean().count();
//     const pending_count = await model.find({ ...baseQuery, member_update_status: 0 }).lean().count();

//     let completed_count;
//     if (startDate) {
//         completed_count = await model.find({ ...baseQuery, member_update_status: 1, updatedAt }).lean().count();
//     } else {
//         completed_count = await model.find({ ...baseQuery, member_update_status: 1 }).lean().count();
//     }

//     return {
//         total_count,
//         pending_count,
//         completed_count
//     };
// };

const getshgsCount = async (query, panchayatList,startDate,endDate) => {
    const list = await Promise.all(panchayatList.map(async (data) => {
        const panchayat ={ $regex: new RegExp(data.panchayat, "i")};
        const payload ={
            district_name: query.district_name,
            block_name: query.block_name,
            grampanchayat_name: panchayat,
        }
        if(startDate){
            payload.updatedAt= {
            $gte: new Date(startDate),
            $lt: new Date(endDate)
          }
        }
        const shgAggregation = [
            {
                $match: {
                    ...payload
                },
            },
            {
                $group: {
                    _id: null,
                    shg: { $sum: 1 },
                    shg_pen: {
                        $sum: { $cond: [{ $eq: ["$member_update_status", 0] }, 1, 0] },
                    },
                    shg_com: {
                        $sum: { $cond: [{ $eq: ["$member_update_status", 1] }, 1, 0] },
                    },
                },
            },
        ];

        const memberAggregation = [
            {
                $match: {
                    ...payload

                },
            },
            {
                $group: {
                    _id: null,
                    member: { $sum: 1 },
                    member_pen: {
                        $sum: { $cond: [{ $eq: ["$member_update_status", 0] }, 1, 0] },
                    },
                    member_com: {
                        $sum: { $cond: [{ $eq: ["$member_update_status", 1] }, 1, 0] },
                    },
                },
            },
        ];

        const [shgCount, memberCount] = await Promise.all([
            mongo.conn.model("SHG", nrlmShgSchema, "nrlmSHG").aggregate(shgAggregation).exec(),
            mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember").aggregate(memberAggregation).exec(),
        ]);

        return {
            district: data.district,
            block: data.block,
            panchayat: data.panchayat,
            shg: shgCount[0] ? shgCount[0].shg : 0,
            shg_pen: shgCount[0] ? shgCount[0].shg_pen : 0,
            shg_com: shgCount[0] ? shgCount[0].shg_com : 0,
            member: memberCount[0] ? memberCount[0].member : 0,
            member_pen: memberCount[0] ? memberCount[0].member_pen : 0,
            member_com: memberCount[0] ? memberCount[0].member_com : 0,
        };
    }));

    // console.log("list", list);
    return list;
};

const getshgsHCount = async (query, habitationList,startDate,endDate) => {
    const list = await Promise.all(habitationList.map(async (data) => {
        const habitation =await { $regex: new RegExp(data.habitation, "i")};
        // console.log("habitation ",habitation )
        const payload ={
            district_name: query.district_name,
            block_name: query.block_name,
            grampanchayat_name: query?.grampanchayat_name,
            village_name:habitation 
            
        }
        // console.log("query",payload)
        if(startDate){
            payload.updatedAt= {
            $gte: new Date(startDate),
            $lt: new Date(endDate)
          }
        }
        const shgAggregation = [
            {
                $match: {
                    ...payload
                },
            },
            {
                $group: {
                    _id: null,
                    shg: { $sum: 1 },
                    shg_pen: {
                        $sum: { $cond: [{ $eq: ["$member_update_status", 0] }, 1, 0] },
                    },
                    shg_com: {
                        $sum: { $cond: [{ $eq: ["$member_update_status", 1] }, 1, 0] },
                    },
                },
            },
        ];

        const memberAggregation = [
            {
                $match: {
                    ...payload

                },
            },
            {
                $group: {
                    _id: null,
                    member: { $sum: 1 },
                    member_pen: {
                        $sum: { $cond: [{ $eq: ["$member_update_status", 0] }, 1, 0] },
                    },
                    member_com: {
                        $sum: { $cond: [{ $eq: ["$member_update_status", 1] }, 1, 0] },
                    },
                },
            },
        ];

        const [shgCount, memberCount] = await Promise.all([
            mongo.conn.model("SHG", nrlmShgSchema, "nrlmSHG").aggregate(shgAggregation).exec(),
            mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember").aggregate(memberAggregation).exec(),
        ]);

        return {
            district: data.district,
            block: data.block,
            panchayat: data.panchayat,
            habitation:data.habitation,
            shg: shgCount[0] ? shgCount[0].shg : 0,
            shg_pen: shgCount[0] ? shgCount[0].shg_pen : 0,
            shg_com: shgCount[0] ? shgCount[0].shg_com : 0,
            member: memberCount[0] ? memberCount[0].member : 0,
            member_pen: memberCount[0] ? memberCount[0].member_pen : 0,
            member_com: memberCount[0] ? memberCount[0].member_com : 0,
        };
    }));

    // console.log("list", list);
    return list;
};

const getReport = async (query,startDate,endDate)=>{
    const payload ={
        district_name: query.district_name,
        block_name: query.block_name,
        grampanchayat_name: query?.grampanchayat_name,
        village_name:query?.village_name 
        
    }
    // console.log("query",payload)
    if(startDate){
        payload.updatedAt= {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      }
    }
    const shgAggregation = [
        {
            $match: {
                ...payload
            },
        },
        {
            $group: {
                _id: null,
                shg: { $sum: 1 },
                shg_pen: {
                    $sum: { $cond: [{ $eq: ["$member_update_status", 0] }, 1, 0] },
                },
                shg_com: {
                    $sum: { $cond: [{ $eq: ["$member_update_status", 1] }, 1, 0] },
                },
            },
        },
    ];

    const memberAggregation = [
        {
            $match: {
                ...payload

            },
        },
        {
            $group: {
                _id: null,
                member: { $sum: 1 },
                member_pen: {
                    $sum: { $cond: [{ $eq: ["$member_update_status", 0] }, 1, 0] },
                },
                member_com: {
                    $sum: { $cond: [{ $eq: ["$member_update_status", 1] }, 1, 0] },
                },
            },
        },
    ];

    const [shgCount, memberCount] = await Promise.all([
        mongo.conn.model("SHG", nrlmShgSchema, "nrlmSHG").aggregate(shgAggregation).exec(),
        mongo.conn.model("SHGMember", nrlmShgMemberSchema, "nrlmShgMember").aggregate(memberAggregation).exec(),
    ]);

    return {
       
        district: query.district_name,
        block: query.block_name,
        panchayat: query?.grampanchayat_name,
        habitation:query?.village_name,
        shg: shgCount[0] ? shgCount[0].shg : 0,
        shg_pen: shgCount[0] ? shgCount[0].shg_pen : 0,
        shg_com: shgCount[0] ? shgCount[0].shg_com : 0,
        member: memberCount[0] ? memberCount[0].member : 0,
        member_pen: memberCount[0] ? memberCount[0].member_pen : 0,
        member_com: memberCount[0] ? memberCount[0].member_com : 0,
    };

}

