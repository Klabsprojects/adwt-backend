const path = require('path');
const xlsx = require('xlsx');
const shgSchema = require("../schemas/shg.schema");
const updateShgSchema = require("../schemas/shg.updateschema");
const shgMemberSchema = require("../schemas/shgMember.schema");
const updateShgMemberSchema = require("../schemas/updateshgMember.schema");
const inCompleteshgMemberSchema = require("../schemas/incompleteMember.Schema");
const shgSchemaInComplete = require("../schemas/inComplete.schema");
const bankLinkageRowsSchema = require("../schemas/bankLinkage.Schema");
// const dbConfig = {
//     host: '74.208.92.52',
//     user: 'ims1',
//     password: 'Pass@2023',
//     database: 'womensdev'
// };
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
// const mongo = require("../utils/mongo");
const CSTDetailsSchema = require("../schemas/cst.Schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");
const { json } = require("body-parser");

const SHGDataFun = require("../utils/shgData")

const handleInvalidQuery = (res, message = "") => {
    return res.status(201).send({ message: `no data found` });
};
const getBranch = async (req, res) => {

    try {
        var bank_id = req.query.bank_id;
        const queryString = `SELECT * FROM bank_details where id=${bank_id}`;
        try {
            const [results] = await pool.execute(queryString);
            // console.log(results.length);
            if (results.length > 0) {
                // console.log(results[0].bank_name);
                const queryString1 = `SELECT * FROM bank_details where bank_name='${results[0].bank_name}'`;
                // console.log("Sfsdfsdfsdfsfsd");
                // console.log(queryString1);
                const [results1] = await pool.execute(queryString1);
                // console.log("Sfsdfsdfsdfsfsd");
                const data = {
                    banks: results1,
                };
                // console.log(results1);
                res.send(data);
            }
            else {
                return res
                    .status(400)
                    .send({ status: false, error: `Invalid Query err No Data Found: ${e.message}` });
            }

        }
        catch (e) {
            return res
                .status(400)
                .send({ status: false, error: `Invalid Query err: ${e.message}` });
        }
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};
const getProjectsshg = async (req, res) => {

    try {
        const queryString = `SELECT * FROM shg_project`;
        const queryString1 = `SELECT * FROM shg_activities`;
        const queryString2 = `SELECT 
    MAX(bank_details.id) AS id,
    MAX(bank_details.bank_id) AS bank_id,
    MAX(bank_details.ifsc_code) AS ifsc_code,
    MAX(bank_details.branch_name) AS branch_name,
    bank_details.bank_name,
    COUNT(*) AS bank_count
FROM bank_details
GROUP BY bank_details.bank_name`;
        try {
            const [results, fields] = await pool.execute(queryString);
            const [results1] = await pool.execute(queryString1);
            const [results2] = await pool.execute(queryString2);
            const data = {
                shg_project: results,
                shg_activities: results1,
                banks: results2,
            };
            res.send(data);
        }
        catch (e) {
            console.log(e.message);
            console.log("xfgfdgfdgfdgf dfgdfgdfg dfhfdhddfhfd dfhgdhdfhfd fhdfhdfhd");
            return res
                .status(400)
                .send({ status: false, error: `Invalid Query err: ${e.message}` });
        }
    } catch (e) { 
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};
const getDistrictData = async (req, res) => {
    console.log(req.query);
    console.log("req.query");

    try {
        var { district, block, panchayat } = req.query;
        district ? (district = { $regex: new RegExp(district, "i") }) : null;
        block ? (block = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
        if (!district) {

            const queryString = `SELECT * FROM district where id = 1 `;
            try {
                const [results, fields] = await pool.execute(queryString);
                console.log(results);
                console.log("results datassssssssssssssss");
                const uniqueObjects = await uniqueData(results);
                return res.send(uniqueObjects);
            }
            catch (e) {
                return res
                    .status(400)
                    .send({ status: false, error: `Invalid Query err: ${e.message}` });
            }


        }
        else if (district && !block && !panchayat) {
            console.log("fdgdgddddddddddddddddddddddddddddddddddddddddddddsdfsdfdsfsd");
            const queryString = `SELECT * FROM district where districtname=${req.query.district}`;
            try {
                const [results, fields] = await pool.execute(queryString);
                console.log(results);
                console.log("results datassssssssssssssss");
                const uniqueObjects = await uniqueData(data);
                return res.send(uniqueObjects);
            }
            catch (e) {
                return res
                    .status(400)
                    .send({ status: false, error: `Invalid Query err: ${e.message}` });
            }
        } else if (district && block && !panchayat) {
            console.log(req.query.district);
            const queryString4 = `SELECT district.*,blocks.* FROM district INNER JOIN blocks ON blocks.districtcode = district.districtcode where district.districtname='${req.query.district}' AND blocks.blockname='${req.query.block}'`;
            console.log(queryString4);
            try {
                const [results2, fields] = await pool.execute(queryString4);
                const uniqueObjects = await uniqueData(results2);
                return res.send(uniqueObjects);
            }
            catch (e) {
                console.log("dsgsdggggvxcccccccccccc");
                console.log('Error executing SQL query:', e);
                return res.status(500).send('Internal Server Error');
            }

        }
        else if (district && block && panchayat) {
            const queryString = `SELECT habitation.* FROM district INNER JOIN blocks ON blocks.districtcode = district.districtcode INNER JOIN villages ON villages.blockcode = blocks.blockcode INNER JOIN habitation ON habitation.panchayat = villages.villagename where habitation.district='${req.query.district}' AND habitation.block='${req.query.block}' AND habitation.panchayat='${req.query.panchayat}'`;
            try {
                const [results, fields] = await pool.execute(queryString);
                try {
                    // var get_panyathu_data = await pool.execute(`Select * from villages where blockname='${req.query.block}'`);
                    const uniqueObjects = await uniqueData(results);
                    return res.send(uniqueObjects);
                }
                catch (e) {
                    console.log("dsgsdggggvxcccccccccccc");
                    console.log('Error executing SQL query:', e);
                    return res.status(500).send('Internal Server Error');
                }
            }
            catch (e) {
                console.log("dsgsdggggvxcccccccccccc");
                console.log('Error executing SQL query:', e);
                return res
                    .status(400)
                    .send({ status: false, error: `Invalid Query err: ${e.message}` });
            }
        }
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};
const getPanjayat = async (req, res) => {
    // console.log(req.query);
    const queryString5 = `SELECT * FROM villages where districtname= '${req.query.district}' AND blockname= '${req.query.block}'`;
    try {
        const [results, fields] = await pool.execute(queryString5);
        console.log(results);
        console.log("results datassssssssssssssss");
        const uniqueObjects = await uniqueData(results);
        return res.send(uniqueObjects);
    }
    catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const getShgData = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        var { district, block, panchayat, habitation } = req.query;
        district = district ? district.toUpperCase() : district;
        block = block ? block.toUpperCase() : block;
        if (!district && !block && !panchayat && !habitation) {
            return handleInvalidQuery(res);
        }
        var data = await model.find(
            { district, block, panchayat, habitation, isDeleted: false },
            { SHGId: 1, SHGName: 1, formationDate: 1, SHGCode: 1, totalMembers: 1 }
        );
        return res.send(data);
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const getShgs = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, is_active: 1, approved: 1, reject: 0 };
        district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
        block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (query.panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
        habitation ? (query.habitation = { $regex: new RegExp(habitation, "i") }) : null;
        const startDate = new Date('2023-11-01');
        const data = await model
            .find({ ...query, approvedAt: { $lte: startDate } }, { _id: 0, __v: 0 })
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
        const shgList = [];
        res.set("SHG-Total-Count", count);
        res.send(data);

    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

// pending
const getBankdetail = async (req, res) => {
    try {
        var { shg_id } = req.query;
        var bank_linkage_dat = `SELECT * FROM shg_bank_details WHERE shg_id='${shg_id}' and account_type !='Savings'`;
        const [bank_linkage_dats] = await pool.execute(bank_linkage_dat);
        var queryoptions = `
        SELECT *
        FROM shg_bank_details
        WHERE shg_id = ${shg_id}`;
        var queryoptions1 = `
        SELECT shg_linkage.*,bank_details.*
        FROM shg_linkage 
        INNER JOIN bank_details ON bank_details.id = shg_linkage.bank_id
        WHERE shg_linkage.shg_id = ${shg_id}`;
        
        console.log(queryoptions1);
        const connection = await pool.getConnection();
        // Get last inserted ID
        const [data] = await connection.query(queryoptions);
        const [data1] = await connection.query(queryoptions1);
        connection.release();  
        response_data = {
            bank_data: data,
            bank_linkage: data1,
            bank_linkage_dats: bank_linkage_dats,
        }
        

        return res.status(200).json({ status: true, response: response_data });
        res.send(data);
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

// pending
const getShgsPending = async (req, res) => {
    let connection;
    try {
        var { district, block, panchayat, habitation, limit, skip } = req.query;


        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, approved: 0, is_ActiveApproved: 1, is_active: 1, reject: 0 };
        var queryoptions = `
        SELECT *
        FROM shg
        WHERE approved = 0 AND is_completed = 1 
          AND reject = 0 
          ${district ? `AND district LIKE '%${district}%'` : ''}
          ${block ? `AND block LIKE '%${block}%'` : ''}
          ${panchayat ? `AND panchayat LIKE '%${panchayat}%'` : ''} 
          ${habitation ? `AND habitation LIKE '%${habitation}%'` : ''} 
        ORDER BY created_at DESC, id DESC
        LIMIT ${limit}
        OFFSET ${skip};
    `;
        connection = await pool.getConnection();
        // Get last inserted ID
        const [data] = await connection.query(queryoptions);
        if (data.length <= 0) {
            return handleInvalidQuery(
                res,
                "No SHGs found in village, create shg first"
            );
        }
        connection.release();  
        res.set("SHG-Total-Count", data.length);
        res.send(data);
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
    finally {
        // Ensure the connection is released back to the pool
        if (connection) connection.release();
    }

};

const getShgMembers = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        var { district, block, panchayat, habitation, limit, skip, SHGId } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, is_active: 1, approved: 1, is_ActiveApproved: 1, reject: 0 };
        district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
        block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (query.panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
        habitation ? (query.habitation = { $regex: new RegExp(habitation, "i") }) : null;
        SHGId ? query.SHGId = SHGId : null;
        const startDate = new Date('2023-11-01');
        const data = await model
            .find({ ...query, approvedAt: { $lte: startDate } }, { _id: 0, __v: 0 })
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

const getShgMembersPending = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        var { district, block, panchayat, habitation, limit, skip, SHGId } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, approved: 0, is_ActiveApproved: 1, is_active: 1, reject: 0 };
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

const getShg = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
        const model1 = mongo.conn.model("shg", shgSchema, "shgPending");

        const { SHGId } = req.params;
        if (!SHGId) {
            return handleInvalidQuery(res, "SHGId is required");
        }
        const shgData = await model.find({ SHGId, isDeleted: false });
        const shgDataPending = await model1.find({ SHGId, isDeleted: false, approved: 0 });

        if (shgData.length <= 0) {
            return handleInvalidQuery(res, "No SHG found with the given SHGId");
        }
        const bankDetailData = await bankDetailsModel.find(
            { SHGId },
            { IFSC: 1, bankName: 1, accountNumber: 1, branchName: 1, accountType: 1, accountStatus: 1, _id: 0, bankId: 1 }
        );

        const pendingUser = await SHGDataFun.fetchSHGuser(shgData[0]);
        delete shgData[0].animatorDetails;
        delete shgData[0].representativeOne;
        delete shgData[0].representativeTwo;
        const { animatorDetails, representativeOne, representativeTwo } = { ...pendingUser };

        const bankLinkagedata = await bankLinkageRowsModel.find({ SHGId }, {
            loanType: 1, dosage: 1, amount: 1, IFSC: 1, bankName: 1,
            loanAcNumber: 1, roi: 1, tenure: 1, balance: 1, branchName: 1, date: 1, closingDate: 1, LinkageId: 1
        });
        if (bankDetailData) {
            const combinedData = {
                ...shgData[0]._doc,
                animatorDetails: animatorDetails,
                representativeOne: representativeOne,
                representativeTwo: representativeTwo,
                bankDetails: bankDetailData[0],
                bankDetails1: bankDetailData[1],
                bankDetails2: bankDetailData[2],
                bankLinkageRows: bankLinkagedata[0],
                bankLinkageRows1: bankLinkagedata[1],
                bankLinkageRows2: bankLinkagedata[2],
            };
            return res.send({
                combinedData,
                shgDataPending
            }
            );
        } else {
            return res.send({ shg: shgData[0] });
        }
    }
    catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const getShgMember = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const pendingModel = mongo.conn.model("SHGMember", updateShgMemberSchema, "SHGMemberPending");

        const { MemberId } = req.params;
        if (!MemberId) {
            return handleInvalidQuery(res, "MemberId is required");
        }
        const data = await model.find({ MemberId, isDeleted: false });
        const data1 = await pendingModel.find({ MemberId, isDeleted: false, approved: 0 });

        if (data.length <= 0) {
            return handleInvalidQuery(res, "No SHG member found with given MemberId");
        }
        return res.send({ data, data1 });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

// add shg bank details save bankDetailshgs collections
const addShg = async (req, res) => {
    try {
        const model = mongo.conn.model("shg", shgSchema, "shgMapTest");
        const model1 = mongo.conn.model("shg", shgSchema, "shgPending");
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const model2 = mongo.conn.model("incompleted", shgSchemaInComplete, "IncompleteShg");
        const model3 = mongo.conn.model("incompletedMember", inCompleteshgMemberSchema, "IncompletedMember");
        const model4 = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const shgmemberPendingModel = mongo.conn.model("UpdateData", updateShgMemberSchema, "SHGMemberPending");
        const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
        const data = req.body;
        const createdBy = req.body.createdBy;

        data.SHGId = await getSHGID(data.villagecode);
        data.district = data.district.toUpperCase();
        data.block = data.block.toUpperCase();
        data.panchayat = data.panchayat.toUpperCase();
        data.habitation = data.habitation.toUpperCase();
        data.createdAt = new Date();
        data.createdBy = createdBy;
        data.approved = 0;
        data.CST = Number(data.CST.MemberId) || 0;
        const animator = data.animatorDetails;
        const rep1 = data.representativeOne;
        const rep2 = data.representativeTwo;
        data.animatorDetails = 0;
        data.representativeOne = 0;
        data.representativeTwo = 0;
        const updateStatus = {
            "basicDetails": "",
            // "projectsInSHGArea": "",
            "bankLinkageRows": "",
            "bankDetails": "",
            "animatorDetails": "",
            "representativeOne": "",
            "representativeTwo": "",
            "PLF": "",
            "SHGSavings": "",
            "grading": "",
            "economicAssistance": "",
            "rf": "",
            "cif": "",
            "asf": "",
            "cap": "",
            "bulkLoan": ""
        }
        // Check if 'Id' 
        if (data.Id) {
            const incompletedData = await model2.findOneAndUpdate({ Id: data.Id }, { Status: 1 }, { SHGId: data.SHGId }, { _id: 0, __v: 0 });
            if (incompletedData) {
                const shgMapTestData = { ...data, updateStatus };
                delete shgMapTestData._id;
                delete shgMapTestData.__v;
                const bankDetailInstances = [];
                const bankLinkageRowsInstances = [];
                if (data.bankDetails && !isEmptyBankDetails(data.bankDetails)) {
                    const bankId = data.SHGId * 100 + 1;
                    const bankDetailsInstance = new bankDetailsModel({
                        SHGId: data.SHGId,
                        bankId: bankId,
                        IFSC: data.bankDetails.IFSC,
                        bankName: data.bankDetails.bankName,
                        accountNumber: data.bankDetails.accountNumber,
                        branchName: data.bankDetails.branchName,
                        accountType: data.bankDetails.accountType,
                        accountStatus: data.bankDetails.accountStatus,
                    });
                    bankDetailInstances.push(bankDetailsInstance);
                }
                if (data.bankDetails1 && !isEmptyBankDetails(data.bankDetails1)) {
                    const bankId1 = data.SHGId * 100 + 2;
                    const bankDetails1Instance = new bankDetailsModel({
                        SHGId: data.SHGId,
                        bankId: bankId1,
                        IFSC: data.bankDetails1.IFSC,
                        bankName: data.bankDetails1.bankName,
                        accountNumber: data.bankDetails1.accountNumber,
                        branchName: data.bankDetails1.branchName,
                        accountType: data.bankDetails1.accountType,
                        accountStatus: data.bankDetails1.accountStatus,
                    });
                    bankDetailInstances.push(bankDetails1Instance);
                }
                if (data.bankDetails2 && !isEmptyBankDetails(data.bankDetails2)) {
                    const bankId2 = data.SHGId * 100 + 3;
                    const bankDetails2Instance = new bankDetailsModel({
                        SHGId: data.SHGId,
                        bankId: bankId2,
                        IFSC: data.bankDetails2.IFSC,
                        bankName: data.bankDetails2.bankName,
                        accountNumber: data.bankDetails2.accountNumber,
                        branchName: data.bankDetails2.branchName,
                        accountType: data.bankDetails2.accountType,
                        accountStatus: data.bankDetails2.accountStatus,
                    });
                    bankDetailInstances.push(bankDetails2Instance);
                }
                if (data.bankLinkageRows && !isEmptyBankLinkageRows(data.bankLinkageRows)) {
                    const LinkageId = data.SHGId * 100 + 1;
                    const bankLinkageRowsInstance = new bankLinkageRowsModel({
                        SHGId: data.SHGId,
                        LinkageId: LinkageId,
                        loanType: data.bankLinkageRows.loanType,
                        dosage: data.bankLinkageRows.dosage,
                        amount: data.bankLinkageRows.amount,
                        bankName: data.bankLinkageRows.bankName,
                        loanAcNumber: data.bankLinkageRows.loanAcNumber,
                        roi: data.bankLinkageRows.roi,
                        tenure: data.bankLinkageRows.tenure,
                        balance: data.bankLinkageRows.balance,
                        date: data.bankLinkageRows.date,
                        closingDate: data.bankLinkageRows.closingDate,
                        IFSC: data.bankLinkageRows.IFSC,
                        branchName: data.bankLinkageRows.branchName,
                    });
                    bankLinkageRowsInstances.push(bankLinkageRowsInstance);
                }
                if (data.bankLinkageRows1 && !isEmptyBankLinkageRows(data.bankLinkageRows1)) {
                    const LinkageId1 = data.SHGId * 100 + 2;
                    const bankLinkageRowsInstance1 = new bankLinkageRowsModel({
                        SHGId: data.SHGId,
                        LinkageId: LinkageId1,
                        loanType: data.bankLinkageRows1.loanType,
                        dosage: data.bankLinkageRows1.dosage,
                        amount: data.bankLinkageRows1.amount,
                        bankName: data.bankLinkageRows1.bankName,
                        loanAcNumber: data.bankLinkageRows1.loanAcNumber,
                        roi: data.bankLinkageRows1.roi,
                        tenure: data.bankLinkageRows1.tenure,
                        balance: data.bankLinkageRows1.balance,
                        date: data.bankLinkageRows1.date,
                        closingDate: data.bankLinkageRows1.closingDate,
                        IFSC: data.bankLinkageRows1.IFSC,
                        branchName: data.bankLinkageRows1.branchName,
                    });
                    bankLinkageRowsInstances.push(bankLinkageRowsInstance1);
                }
                if (data.bankLinkageRows2 && !isEmptyBankLinkageRows(data.bankLinkageRows2)) {
                    const LinkageId2 = data.SHGId * 100 + 3;
                    const bankLinkageRowsInstance2 = new bankLinkageRowsModel({
                        SHGId: data.SHGId,
                        LinkageId: LinkageId2,
                        loanType: data.bankLinkageRows2.loanType,
                        dosage: data.bankLinkageRows2.dosage,
                        amount: data.bankLinkageRows2.amount,
                        bankName: data.bankLinkageRows2.bankName,
                        loanAcNumber: data.bankLinkageRows2.loanAcNumber,
                        roi: data.bankLinkageRows2.roi,
                        tenure: data.bankLinkageRows2.tenure,
                        balance: data.bankLinkageRows2.balance,
                        date: data.bankLinkageRows2.date,
                        closingDate: data.bankLinkageRows2.closingDate,
                        IFSC: data.bankLinkageRows2.IFSC,
                        branchName: data.bankLinkageRows2.branchName,
                    });
                    bankLinkageRowsInstances.push(bankLinkageRowsInstance2);
                }
                const pendingList = { ...data, updateStatus };
                const shgPending = new model1(pendingList);
                const data11 = await shgPending.save();
                const shgMapTest = new model(shgMapTestData);
                const data111 = await shgMapTest.save();
                const bankId = data.SHGId * 100 + 1;
                const bankDetailsInstance = new bankDetailsModel({
                    SHGId: data.SHGId,
                    bankId: bankId,
                    IFSC: data.bankDetails.IFSC,
                    bankName: data.bankDetails.bankName,
                    accountNumber: data.bankDetails.accountNumber,
                    branchName: data.bankDetails.branchName,
                    accountType: data.bankDetails.accountType,
                    accountStatus: data.bankDetails.accountStatus,
                });
                // save bankLinkageRows
                const LinkageId = data.SHGId * 100 + 1;
                const bankLinkageRowsInstance = new bankLinkageRowsModel({
                    SHGId: data.SHGId,
                    LinkageId: LinkageId,
                    loanType: data.bankLinkageRows.loanType,
                    dosage: data.bankLinkageRows.dosage,
                    amount: data.bankLinkageRows.amount,
                    bankName: data.bankLinkageRows.bankName,
                    loanAcNumber: data.bankLinkageRows.loanAcNumber,
                    roi: data.bankLinkageRows.roi,
                    tenure: data.bankLinkageRows.tenure,
                    balance: data.bankLinkageRows.balance,
                    date: data.bankLinkageRows.date,
                    closingDate: data.bankLinkageRows.closingDate,
                    IFSC: data.bankLinkageRows.IFSC,
                    branchName: data.bankLinkageRows.branchName,
                });
                const incompletedMembers = await model3.find({ Id: data.Id }, { __v: 0 });
                if (incompletedMembers.length > 0) {
                    for (const incompletedMember of incompletedMembers) {
                        const incompleteMemberData = delete incompletedMember.MemberId
                        const member_id = await getMemberId(data.SHGId);
                        // Update the MemberId in model3
                        await model3.updateOne({ _id: incompleteMemberData._id }, { Status: 1, MemberId: member_id }, { new: true });
                        const model3Data = incompletedMember.toObject();
                        // Create a new instance in model4 and move data
                        const shgMemberInstance = new model4({ SHGId: data.SHGId, ...model3Data });
                        const Mdata = await shgMemberInstance.save();
                        // pending
                        const ApprovedStatus = {
                            memberDetail: "",
                            AADHAR: "",
                            smartCard: "",
                            contact: "",
                            socialCategory: "",
                            bankDetail: "",
                        };
                        // Save pending member details to shgmemberPendingModel
                        const pendingList = {
                            SHGId: data.SHGId, ...model3Data, ApprovedStatus
                        };
                        const pendingMember = new shgmemberPendingModel(pendingList);
                        const pendingResponse = await pendingMember.save()
                    }
                    const animatorData = await model4.findOne({ SHGId: data.SHGId, MemberName: animator.name, contact: Number(animator.contact) }, { MemberId: 1 })
                    const rep1Data = await model4.findOne({ SHGId: data.SHGId, MemberName: rep1.name, contact: rep1.contact }, { MemberId: 1 });
                    const rep2Data = await model4.findOne({ SHGId: data.SHGId, MemberName: rep1.name, contact: rep1.contact }, { MemberId: 1 });

                    await bankDetailsInstance.save();
                    await bankLinkageRowsInstance.save();
                    const bankDetailResponses = await Promise.all(bankDetailInstances.map(instance => instance.save()));
                    const bankLinkageRowsResponses = await Promise.all(bankLinkageRowsInstances.map(instance => instance.save()));

                    return res.status(200).send({ status: true, data11, data111, bankDetailResponses, bankLinkageRowsResponses });
                }
            }
        }
        else {
            const shgmap = { ...data, updateStatus };
            const shgMapTest = new model(shgmap);
            const bankDetailInstances = [];
            const bankLinkageRowsInstances = [];
            if (data.bankDetails && !isEmptyBankDetails(data.bankDetails)) {
                const bankId = data.SHGId * 100 + 1;
                const bankDetailsInstance = new bankDetailsModel({
                    SHGId: data.SHGId,
                    bankId: bankId,
                    IFSC: data.bankDetails.IFSC,
                    bankName: data.bankDetails.bankName,
                    accountNumber: data.bankDetails.accountNumber,
                    branchName: data.bankDetails.branchName,
                    accountType: data.bankDetails.accountType,
                    accountStatus: data.bankDetails.accountStatus,
                });
                bankDetailInstances.push(bankDetailsInstance);
            }
            if (data.bankDetails1 && !isEmptyBankDetails(data.bankDetails1)) {
                const bankId1 = data.SHGId * 100 + 2;
                const bankDetails1Instance = new bankDetailsModel({
                    SHGId: data.SHGId,
                    bankId: bankId1,
                    IFSC: data.bankDetails1.IFSC,
                    bankName: data.bankDetails1.bankName,
                    accountNumber: data.bankDetails1.accountNumber,
                    branchName: data.bankDetails1.branchName,
                    accountType: data.bankDetails1.accountType,
                    accountStatus: data.bankDetails1.accountStatus,
                });
                bankDetailInstances.push(bankDetails1Instance);
            }
            if (data.bankDetails2 && !isEmptyBankDetails(data.bankDetails2)) {
                const bankId2 = data.SHGId * 100 + 3;
                const bankDetails2Instance = new bankDetailsModel({
                    SHGId: data.SHGId,
                    bankId: bankId2,
                    IFSC: data.bankDetails2.IFSC,
                    bankName: data.bankDetails2.bankName,
                    accountNumber: data.bankDetails2.accountNumber,
                    branchName: data.bankDetails2.branchName,
                    accountType: data.bankDetails2.accountType,
                    accountStatus: data.bankDetails2.accountStatus,
                });
                bankDetailInstances.push(bankDetails2Instance);
            }
            if (data.bankLinkageRows && !isEmptyBankLinkageRows(data.bankLinkageRows)) {
                const LinkageId = data.SHGId * 100 + 1;
                const bankLinkageRowsInstance = new bankLinkageRowsModel({
                    SHGId: data.SHGId,
                    LinkageId: LinkageId,
                    loanType: data.bankLinkageRows.loanType,
                    dosage: data.bankLinkageRows.dosage,
                    amount: data.bankLinkageRows.amount,
                    bankName: data.bankLinkageRows.bankName,
                    loanAcNumber: data.bankLinkageRows.loanAcNumber,
                    roi: data.bankLinkageRows.roi,
                    tenure: data.bankLinkageRows.tenure,
                    balance: data.bankLinkageRows.balance,
                    date: data.bankLinkageRows.date,
                    closingDate: data.bankLinkageRows.closingDate,
                    IFSC: data.bankLinkageRows.IFSC,
                    branchName: data.bankLinkageRows.branchName,
                });
                bankLinkageRowsInstances.push(bankLinkageRowsInstance);
            }
            if (data.bankLinkageRows1 && !isEmptyBankLinkageRows(data.bankLinkageRows1)) {
                const LinkageId1 = data.SHGId * 100 + 2;
                const bankLinkageRowsInstance1 = new bankLinkageRowsModel({
                    SHGId: data.SHGId,
                    LinkageId: LinkageId1,
                    loanType: data.bankLinkageRows1.loanType,
                    dosage: data.bankLinkageRows1.dosage,
                    amount: data.bankLinkageRows1.amount,
                    bankName: data.bankLinkageRows1.bankName,
                    loanAcNumber: data.bankLinkageRows1.loanAcNumber,
                    roi: data.bankLinkageRows1.roi,
                    tenure: data.bankLinkageRows1.tenure,
                    balance: data.bankLinkageRows1.balance,
                    date: data.bankLinkageRows1.date,
                    closingDate: data.bankLinkageRows1.closingDate,
                    IFSC: data.bankLinkageRows1.IFSC,
                    branchName: data.bankLinkageRows1.branchName,
                });
                bankLinkageRowsInstances.push(bankLinkageRowsInstance1);
            }
            if (data.bankLinkageRows2 && !isEmptyBankLinkageRows(data.bankLinkageRows2)) {
                const LinkageId2 = data.SHGId * 100 + 3;
                const bankLinkageRowsInstance2 = new bankLinkageRowsModel({
                    SHGId: data.SHGId,
                    LinkageId: LinkageId2,
                    loanType: data.bankLinkageRows2.loanType,
                    dosage: data.bankLinkageRows2.dosage,
                    amount: data.bankLinkageRows2.amount,
                    bankName: data.bankLinkageRows2.bankName,
                    loanAcNumber: data.bankLinkageRows2.loanAcNumber,
                    roi: data.bankLinkageRows2.roi,
                    tenure: data.bankLinkageRows2.tenure,
                    balance: data.bankLinkageRows2.balance,
                    date: data.bankLinkageRows2.date,
                    closingDate: data.bankLinkageRows2.closingDate,
                    IFSC: data.bankLinkageRows2.IFSC,
                    branchName: data.bankLinkageRows2.branchName,
                });
                bankLinkageRowsInstances.push(bankLinkageRowsInstance2);
            }
            const pendingList = { ...data, updateStatus };
            const shgPending = new model1(pendingList);
            const response2 = await shgPending.save();
            // Save data to both collections
            const response1 = await shgMapTest.save();
            // Save all bank detail instances
            const bankDetailResponses = await Promise.all(bankDetailInstances.map(instance => instance.save()));
            const bankLinkageRowsResponses = await Promise.all(bankLinkageRowsInstances.map(instance => instance.save()));
            return res.status(200).send({
                status: true,
                response: { response1, response2, bankDetailResponses, bankLinkageRowsResponses },
            });
        }
    } catch (e) {
        return res.status(400).send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

// Helper function to check if bankDetails are empty
function isEmptyBankDetails(bankDetails) {
    return (
        !bankDetails.IFSC.trim() &&
        !bankDetails.bankName.trim() &&
        !bankDetails.accountNumber.trim() &&
        !bankDetails.branchName.trim() &&
        !bankDetails.accountType.trim() &&
        !bankDetails.accountStatus.trim()
    );
}
// 11-11
function isEmptyBankLinkageRows(bankLinkageRows) {
    return (
        !bankLinkageRows.loanType ||
        !bankLinkageRows.dosage ||
        !bankLinkageRows.amount ||
        !bankLinkageRows.bankName ||
        !bankLinkageRows.loanAcNumber ||
        !bankLinkageRows.roi ||
        !bankLinkageRows.tenure ||
        !bankLinkageRows.balance ||
        !bankLinkageRows.date ||
        !bankLinkageRows.closingDate ||
        !bankLinkageRows.IFSC ||
        !bankLinkageRows.branchName
    );
}
async function generateShgMemberCode() {
    const connection = await pool.getConnection();
    try {
        console.log("shgCode");
        // Get last inserted ID
        const [rows] = await connection.query('SELECT * FROM shg_members ORDER BY id DESC LIMIT 1');
        connection.release();
        const lastId = 0;
        if (rows.length > 0) {
            const lastId = rows[0].shg_code || 0;
        }
        // console.log(rows[0].shg_code);
        // console.log("shgCode");
        // console.log(lastId);
        // Generate SHG code based on last ID + 1 or current timestamp
        const shgCode = parseInt(lastId) > 0 ? (parseInt(lastId) + 1).toString().padStart(6, '0') : Math.floor(Date.now() / 1000).toString();
        return shgCode;
    } catch (error) {
        console.error('Error generating SHG code:', error);
        throw error;
    } finally {
        connection.release();
    }
}
// 6-11
const addShgMember = async (req, res) => {
    try {
        const data = req.body; 
        const request_data = {};
        // Filter out empty fields
        const filteredData = Object.keys(data).reduce((filtered, key) => {
            if (data[key] !== "") {
                filtered[key] = data[key];
            }
            return filtered;
        }, {}); 
        // Date fields
        request_data.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        request_data.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const shgmemberCode = await generateShgMemberCode();
        request_data.shg_id = filteredData.SHGId.value;
        request_data.member_name = filteredData.memberName;
        request_data.father_name = filteredData.fatherName;
        request_data.age = filteredData.memberAge;

        request_data.gender = filteredData.gender;
        request_data.community = filteredData.community;
        var isVulnerable = 0;
        var isVRFReceived = 0;
        var vrf_amount = 0;
        var VRFdate = null;
        var insurance_type = null;
        var last_expiry_date = null;
        var isInsuranceRegistered = 0;
        var islivelihood = 0;
        var isESharm = 0;
        var account_status = 0;
        var vulnerableCategory = 0;
        var isLocalBodyRepresentative = 0;
        var local_representative_position = null;
        var livelihood_activities = 0;
        if (filteredData.VRFAmount !== undefined) {
            vrf_amount = filteredData.VRFAmount;
        }
        if (filteredData.VRFdate !== undefined) {
            VRFdate = filteredData.VRFdate;
        }
        if (filteredData.insuranceType !== undefined) {
            insurance_type = filteredData.insuranceType;
        }
        if (filteredData.last_expiry_date !== undefined) {
            last_expiry_date = filteredData.last_expiry_date;
        }
        if (filteredData.isVulnerable == "yes" || filteredData.isVulnerable == 1) {
            isVulnerable = 1;
        }
        if (filteredData.isVRFReceived == "yes" || filteredData.isVRFReceived == 1) {
            isVRFReceived = 1;
        }
        if (filteredData.isInsuranceRegistered == "yes" || filteredData.isInsuranceRegistered == 1) {
            isInsuranceRegistered = 1;
        }
        if (filteredData.islivelihood == "yes" || filteredData.islivelihood == 1) {
            islivelihood = 1;
        }
        if (filteredData.isESharm == "yes" || filteredData.isESharm == 1) {
            isESharm = 1;
        }
        if (filteredData.account_status == "yes" || filteredData.account_status == 1) {
            account_status = 1;
        }
        if (filteredData.isLocalBodyRepresentative == "yes" || filteredData.isLocalBodyRepresentative == 1) {
            isLocalBodyRepresentative = 1;
        }
        var workerCode = null;
        var msme_reg_number = null;
        if (filteredData.worker_code !== undefined) {
            workerCode = filteredData.workerCode;
        }
        if (filteredData.MSMERegNumber !== undefined) {
            msme_reg_number = filteredData.MSMERegNumber;
        }
        if (filteredData.localBodyRepresentativePosition !== undefined) {
            local_representative_position = filteredData.localBodyRepresentativePosition;
        }
        if (filteredData.livelihoodActivities !== undefined) {
            livelihood_activities = filteredData.livelihoodActivities;
        }
        // console.log(filteredData);
        request_data.vulnerability = isVulnerable;
        request_data.vulnerability_categiryt = filteredData.vulnerableCategory;
        request_data.education = filteredData.education;
        request_data.occupation = filteredData.occupation;
        request_data.worker_code = workerCode;
        request_data.msme_reg_number = msme_reg_number;
        request_data.pan_number = filteredData.PAN;
        request_data.aadhar_number = filteredData.AADHAR;
        request_data.smart_card = filteredData.smartCard;
        request_data.contact = filteredData.contact;
        request_data.role = filteredData.role;
        request_data.monthly_savings = filteredData.monthlySavings;
        request_data.religion = filteredData.religion;
        request_data.is_vrf_received = isVRFReceived;
        request_data.vrf_amount = vrf_amount;
        request_data.vrf_date = VRFdate;
        request_data.is_insurance_registered = isInsuranceRegistered;
        request_data.insurance_type = insurance_type;
        request_data.last_expiry_date = last_expiry_date;
        request_data.islivelihood = islivelihood;
        request_data.livelihood_activities = livelihood_activities;
        request_data.is_esharm = isESharm;
        request_data.annual_Income = filteredData.annualIncome;
        request_data.pip_category = filteredData.PIPCategory;
        request_data.ifsc = filteredData.IFSC;
        request_data.account_type = "Savings";
        request_data.account_number = filteredData.accountNumber;
        request_data.branch_name = filteredData.branchName;
        request_data.bank_name = filteredData.bankName;
        request_data.account_status = account_status;
        request_data.family_member_count = filteredData.familyMemberCount;
        request_data.annual_income_family = filteredData.annualIncomeOfFamily;
        request_data.is_local_representative = 0;
        if(filteredData.isLocalBodyRepresentative == "yes")
        {
            request_data.is_local_representative = 1;
            request_data.local_representative_position = local_representative_position;
        }
        

        console.log("request_data request_data request_data request_data request_data request_data request_data request_data request_data request_datarequest_data request_data request_data request_data request_datarequest_data request_data request_data request_data request_datarequest_data request_data request_data request_data request_datarequest_data request_data request_data request_data request_datarequest_data request_data request_data request_data request_datarequest_data request_data request_data request_data request_datarequest_data request_data request_data request_data request_data");
        console.log(request_data);
        console.log("sdfsfsfsfsdfdsfsdf");
        if (filteredData.MemberId) {
            request_data.dob = convertDateFormat(filteredData.DOB);
            request_data.member_id = filteredData.MemberId;

            console.log("test data test data test data test data test data test data  test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data test data ")
            // Update existing member
            const query = `UPDATE shg_members SET
                member_name = ?, father_name = ?, age = ?, dob = ?, gender = ?, religion = ?, community = ?, 
                vulnerability = ?, vulnerability_categiryt = ?, education = ?, occupation = ?, worker_code = ?, 
                msme_reg_number = ?, pan_number = ?, aadhar_number = ?, smart_card = ?, contact = ?, role = ?, 
                monthly_savings = ?, is_vrf_received = ?, vrf_amount = ?,vrf_date = ?, is_insurance_registered = ?, 
                insurance_type = ?, last_expiry_date = ?, islivelihood = ?, livelihood_activities = ?, is_esharm = ?, 
                annual_Income = ?, pip_category = ?, ifsc = ?, account_type = ?, account_number = ?, 
                branch_name = ?, bank_name = ?, account_status = ?, family_member_count = ?, 
                annual_income_family = ?, is_local_representative = ?, local_representative_position = ?, 
                updated_at = ?
                WHERE member_id = ?`;

            const result = await pool.execute(query, [
                request_data.member_name,
                request_data.father_name,
                request_data.age,
                request_data.dob,
                request_data.gender,
                request_data.religion,
                request_data.community,
                request_data.vulnerability,
                request_data.vulnerability_categiryt || null,
                request_data.education,
                request_data.occupation,
                request_data.worker_code,
                request_data.msme_reg_number,
                request_data.pan_number,
                request_data.aadhar_number,
                request_data.smart_card,
                request_data.contact,
                request_data.role,
                request_data.monthly_savings,
                request_data.is_vrf_received,
                request_data.vrf_amount,
                request_data.vrf_date,
                request_data.is_insurance_registered,
                request_data.insurance_type,
                request_data.last_expiry_date,
                request_data.islivelihood,
                request_data.livelihood_activities,
                request_data.is_esharm,
                request_data.annual_Income,
                request_data.pip_category,
                request_data.ifsc,
                request_data.account_type,
                request_data.account_number,
                request_data.branch_name,
                request_data.bank_name,
                request_data.account_status,
                request_data.family_member_count,
                request_data.annual_income_family,
                request_data.is_local_representative,
                request_data.local_representative_position,
                request_data.updated_at,
                request_data.member_id
            ]);

            console.log("Member updated successfully:", result);
            return res.status(200).json({ status: true, response: "Operation successful" });
        } else {
            request_data.dob = filteredData.DOB;
            request_data.member_id = shgmemberCode;
            const connection = await pool.getConnection();
            const query = 'INSERT INTO shg_members (shg_id, member_id, member_name, father_name, age, dob, gender, religion,community, vulnerability, vulnerability_categiryt,education, occupation, worker_code, msme_reg_number,pan_number,aadhar_number,smart_card,contact,role,monthly_savings,is_vrf_received,vrf_amount,vrf_date,is_insurance_registered,insurance_type,last_expiry_date,islivelihood,livelihood_activities,annual_Income,pip_category,ifsc,account_type,account_number,branch_name,bank_name,account_status,family_member_count,annual_income_family,is_local_representative,local_representative_position,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
            const result = await pool.execute(query, [
                request_data.shg_id,
                request_data.member_id,
                request_data.member_name,
                request_data.father_name,
                request_data.age,
                request_data.dob,
                request_data.gender,
                request_data.religion,
                request_data.community,
                request_data.vulnerability,
                request_data.vulnerability_categiryt || null,
                request_data.education,
                request_data.occupation,
                request_data.worker_code,
                request_data.msme_reg_number,
                request_data.pan_number,
                request_data.aadhar_number,
                request_data.smart_card,
                request_data.contact,
                request_data.role,
                request_data.monthly_savings,
                request_data.is_vrf_received,
                request_data.vrf_amount,
                request_data.vrf_date,
                request_data.is_insurance_registered,
                request_data.insurance_type,
                request_data.last_expiry_date,
                request_data.islivelihood,
                request_data.livelihood_activities, 
                request_data.annual_Income,
                request_data.pip_category,
                request_data.ifsc,
                request_data.account_type,
                request_data.account_number,
                request_data.branch_name,
                request_data.bank_name,
                request_data.account_status,
                request_data.family_member_count,
                request_data.annual_income_family,
                request_data.is_local_representative,
                request_data.local_representative_position,
                0,
            ]);
            console.log("completeddddddddddddddddd");
            var update_count_query = `select count(*) as counts from shg_members where shg_id=${request_data.shg_id}`;
            const [update_count] = await pool.execute(update_count_query); 
            var update_count_data = `update shg SET active_members=${update_count[0].counts} where id=${request_data.shg_id}`;
            const [updates_count] = await pool.execute(update_count_data); 
            return res.status(200).json({ status: true, response: result }); 

        } 
       

    } catch (e) {
        console.log(e);
        return res.status(400).send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const getallBankdetails = async (req, res) => {
    try {
        const queryString = `SELECT 
    MAX(bank_details.id) AS id,
    MAX(bank_details.bank_id) AS bank_id,
    MAX(bank_details.ifsc_code) AS ifsc_code,
    MAX(bank_details.branch_name) AS branch_name,
    bank_details.bank_name,
    COUNT(*) AS bank_count
FROM bank_details
GROUP BY bank_details.bank_name`;
        const [data, fields] = await pool.execute(queryString);
        console.log(data);


        if (!data || data == "null") {
            return res
                .status(404)
                .json({ status: "error", error: "No data found" });
        } else {
            return res.send({ status: "success", data });
        }
    } catch (e) {
        console.log(e);
        return res.status(400).send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
}

const updateShg = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const data = req.body;
        const { SHGId } = data;
        const data2 = await model.find({ SHGId, isDeleted: false }, { _id: 0 });
        const data1 = await bankDetailsModel.find(
            { SHGId },
            { IFSC: 1, bankName: 1, accountNumber: 1, branchName: 1, _id: 0 }
        );
        const oldData = {
            ...data2[0]._doc,
            bankDetails: data1[0],
            bankDetails1: data1[1],
            bankDetails2: data1[2]
        }
        const updatedData = compareObjects(oldData, data);
        if (oldData.totalMembers !== undefined) {
            updatedData.totalMembers = oldData.totalMembers;
        }
        const basicDetails = [
            "SHGName",
            "formationDate",
            "formationYear",
            "formedBy",
            "category",
            "specialCategory",
            "meetingFrequency",
            "monitoredBy",
            "ifCST",
            "auditingDate",
            "projectsInSHGArea"
        ];

        const bankLinkageRows = [
            "loanType",
            "dosage",
            "amount",
            "bankName",
            "loanAcNumber",
            "roi",
            "tenure",
            "balance",
            "date",
            "closingDate",
            "IFSC",
            "branchName"
        ];

        const bankDetails = [
            "IFSC",
            "bankName",
            "accountNumber",
            "branchName",
            "accountType",
            "accountStatus"
        ];

        const animatorDetails = [
            "name",
            "contact",
            "liveihood",
            "liveihoodvalue"
        ];

        const representativeOne = [
            "name",
            "contact",
            "liveihoodOne",
            "liveihoodvalueOne"
        ];

        const representativeTwo = [
            "name",
            "contact",
            "liveihoodOne",
            "liveihoodvalueOne"
        ];

        const PLF = [
            "shgFederated",
            "dateAffiliated",
            "amountOfAnnualSubscription",
            "dateOfLastSubscription"
        ];

        const SHGSavings = [
            "memberSaving",
            "shgSaving",
            "totalSaving"
        ];

        const grading = [
            "grading",
            "category",
            "date"
        ];

        const economicAssistance = [
            "received",
            "date"
        ];

        const rf = [
            "received",
            "date",
            "amount"
        ];

        const cif = [
            "received",
            "amount",
            "date"
        ];
        const cif1 = [
            "received",
            "amount",
            "date"
        ];
        const cif2 = [
            "received",
            "amount",
            "date"
        ];

        const asf = [
            "received",
            "amount"
        ];

        const cap = [
            "received",
            "amount",
            "date"
        ];

        const bulkLoan = [
            "received",
            "amount",
            "balanceLoan"
        ];

        const CST = [
            "name",
            "contact"
        ];

        // Initialize empty objects to store updated values
        const updatedBankDetail = {};
        const updatedBasicDetails = {};
        const updatedBankLinkageRows = {};
        const updatedAnimatorDetails = {};
        const updatedRepresentativeOne = {};
        const updatedRepresentativeTwo = {};
        const updatedPLF = {};
        const updatedSHGSavings = {};
        const updatedGrading = {};
        const updatedEconomicAssistance = {};
        const updatedRF = {};
        const updatedCIF = {};
        const updatedCIF1 = {};
        const updatedCIF2 = {};
        const updatedASF = {};
        const updatedCAP = {};
        const updatedBulkLoan = {};
        const updatedCST = {};

        // Loop through updatedData and populate corresponding updated objects
        for (const field of Object.keys(updatedData)) {
            if (basicDetails.includes(field)) {
                updatedBasicDetails[field] = String(updatedData[field]);
            } else if (bankLinkageRows.includes(field)) {
                updatedBankLinkageRows[field] = String(updatedData[field]);
            } else if (bankDetails.includes(field)) {
                updatedBankDetail[field] = String(updatedData[field]);
            } else if (animatorDetails.includes(field)) {
                updatedAnimatorDetails[field] = String(updatedData[field]);
            } else if (representativeOne.includes(field)) {
                updatedRepresentativeOne[field] = String(updatedData[field]);
            } else if (representativeTwo.includes(field)) {
                updatedRepresentativeTwo[field] = String(updatedData[field]);
            } else if (PLF.includes(field)) {
                updatedPLF[field] = String(updatedData[field]);
            } else if (SHGSavings.includes(field)) {
                updatedSHGSavings[field] = String(updatedData[field]);
            } else if (grading.includes(field)) {
                updatedGrading[field] = String(updatedData[field]);
            } else if (economicAssistance.includes(field)) {
                updatedEconomicAssistance[field] = String(updatedData[field]);
            } else if (rf.includes(field)) {
                updatedRF[field] = String(updatedData[field]);
            } else if (cif.includes(field)) {
                updatedCIF[field] = String(updatedData[field]);
            } else if (cif1.includes(field)) {
                updatedCIF1[field] = String(updatedData[field]);
            } else if (cif2.includes(field)) {
                updatedCIF2[field] = String(updatedData[field]);
            } else if (asf.includes(field)) {
                updatedASF[field] = String(updatedData[field]);
            } else if (cap.includes(field)) {
                updatedCAP[field] = String(updatedData[field]);
            } else if (bulkLoan.includes(field)) {
                updatedBulkLoan[field] = String(updatedData[field]);
            } else if (CST.includes(field)) {
                updatedCST[field] = String(updatedData[field]);
            }
        }
        const updateStatus = {};

        // Check and update updateStatus based on each object
        if (Object.keys(updatedBankDetail).length > 0) {
            updateStatus.bankDetails = "";
        }

        if (Object.keys(updatedBasicDetails).length > 0) {
            updateStatus.basicDetails = "";
        }

        if (Object.keys(updatedBankLinkageRows).length > 0) {
            updateStatus.bankLinkageRows = "";
        }

        if (Object.keys(updatedAnimatorDetails).length > 0) {
            updateStatus.animatorDetails = "";
        }

        if (Object.keys(updatedRepresentativeOne).length > 0) {
            updateStatus.representativeOne = "";
        }

        if (Object.keys(updatedRepresentativeTwo).length > 0) {
            updateStatus.representativeTwo = "";
        }

        if (Object.keys(updatedPLF).length > 0) {
            updateStatus.PLF = "";
        }

        if (Object.keys(updatedSHGSavings).length > 0) {
            updateStatus.SHGSavings = "";
        }

        if (Object.keys(updatedGrading).length > 0) {
            updateStatus.grading = "";
        }

        if (Object.keys(updatedEconomicAssistance).length > 0) {
            updateStatus.economicAssistance = "";
        }

        if (Object.keys(updatedRF).length > 0) {
            updateStatus.rf = "";
        }

        if (Object.keys(updatedCIF).length > 0) {
            updateStatus.cif = "";
        }

        if (Object.keys(updatedASF).length > 0) {
            updateStatus.asf = "";
        }

        if (Object.keys(updatedCAP).length > 0) {
            updateStatus.cap = "";
        }

        if (Object.keys(updatedBulkLoan).length > 0) {
            updateStatus.bulkLoan = "";
        }

        if (Object.keys(updatedCST).length > 0) {
            updateStatus.CST = "";
        }
        const updatedBy = req.body.updatedBy;
        updatedData.updateStatus = updateStatus;
        const editedData = await editedField(updatedData);
        updatedData.updateStatus = { ...editedData };
        updatedData.SHGId = SHGId;
        updatedData.SHGCode = data.SHGCode;
        updatedData.approved = 0;
        updatedData.updatedAt = new Date();
        updatedData.updatedBy = updatedBy;
        updatedData.isDeleted = false;
        updatedData.createdAt = oldData.createdAt;
        const shgPending = new shgPendingModel(updatedData);
        const response1 = await shgPending.save();
        const currentDocument = await model.findOneAndUpdate(
            { SHGId, isDeleted: false },
            { approved: 0 }
        );
        if (!currentDocument) {
            return handleInvalidQuery(res, "No SHG found with given SHGId");
        }
        return res.status(200).send({ status: true, result: response1 });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};
// 6-11
const updateShgMember = async (req, res) => {
    try {
        const shgMemberModel = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgMemberSchema, "SHGMemberPending");
        const data = req.body;
        const { SHGId, MemberId } = data;
        if (!SHGId) {
            return handleInvalidQuery(res, "SHGId is required");
        }
        if (!MemberId) {
            return handleInvalidQuery(res, "MemberId is required");
        }
        const existingMember = await shgMemberModel.findOne({
            SHGId,
            MemberId,
            isDeleted: false,
        });
        if (!existingMember) {
            return handleInvalidQuery(
                res,
                "No SHG member found with given SHGId and MemberId"
            );
        }
        const updatedBy = req.body.updatedBy;
        const oldData = { ...existingMember.toObject() };
        const updatedData = compareObjects(oldData, data);
        if (oldData.totalMembers !== undefined) {
            updatedData.totalMembers = oldData.totalMembers;
        }
        const bankDetail = [
            "IFSC",
            "bankName",
            "accountNumber",
            "branchName",
            "accountType",
            "accountStatus",
        ];
        const socialCategory = [
            "PIP",
            "PIPCategory",
            "annualIncome",
            "isESharm",
            "MSMERegNumber",
            "islivelihood",
            "occupation",
            "workerCode",
        ];
        const memberDetail = [
            "memberName",
            "fatherName",
            "community",
            "VRFAmount",
            "monthlySavings",
            "education",
        ];
        const AADHAR = "AADHAR";
        const smartCard = "smartCard";
        const contact = "contact";

        const updatedBankDetails = {};
        const updatedSocialCategory = {};
        const updatedmemberDetail = {};
        const updatedAADHAR = {};
        const updatesmartCard = {};
        const updatecontact = {};

        for (const field of Object.keys(updatedData)) {
            if (bankDetail.includes(field)) {
                updatedBankDetails[field] = String(updatedData[field]);
            } else if (socialCategory.includes(field)) {
                updatedSocialCategory[field] = String(updatedData[field]);
            } else if (memberDetail.includes(field)) {
                updatedmemberDetail[field] = String(updatedData[field]);
            } else if (field === AADHAR) {
                updatedAADHAR[field] = String(updatedData[field]);
            } else if (field === smartCard) {
                updatesmartCard[field] = String(updatedData[field]);
            } else if (field === contact) {
                updatecontact[field] = String(updatedData[field]);
            }
        }

        const ApprovedStatus = {};

        if (Object.keys(updatedBankDetails).length > 0) {
            ApprovedStatus.bankDetail = "";
        }
        if (Object.keys(updatedSocialCategory).length > 0) {
            ApprovedStatus.socialCategory = "";
        }
        if (Object.keys(updatedmemberDetail).length > 0) {
            ApprovedStatus.memberDetail = "";
        }
        if (Object.keys(updatedAADHAR).length > 0) {
            ApprovedStatus.AADHAR = "";
        }
        if (Object.keys(updatesmartCard).length > 0) {
            ApprovedStatus.smartCard = "";
        }
        if (Object.keys(updatecontact).length > 0) {
            ApprovedStatus.contact = "";
        }
        updatedData.ApprovedStatus = ApprovedStatus;
        updatedData.SHGId = SHGId;
        updatedData.MemberId = MemberId;
        updatedData.approved = 0;
        updatedData.updatedAt = new Date();
        updatedData.updateCount = Number(oldData.updateCount) + 1;
        updatedData.isDeleted = false;
        updatedData.createdAt = oldData.createdAt;
        updatedData.memberName = String(data.memberName);
        const shgMemberPending = new shgPendingModel(updatedData);
        shgMemberPending.updatedBy = updatedBy;
        const response1 = await shgMemberPending.save();
        await existingMember.updateOne({ approved: 0 });
        return res.status(200).send({ status: true, result: response1 });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};
const updateSaveShgMember = async (req, res) => {
    try {
        const data = req.body;
        console.log("dataaaaaaaaa");
        console.log(data);
        const request_data = {};
        // Filter out empty fields
        const filteredData = Object.keys(data).reduce((filtered, key) => {
            if (data[key] !== "") {
                filtered[key] = data[key];
            }
            return filtered;
        }, {});

        // Date fields
        request_data.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        request_data.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const shgmemberCode = await generateShgMemberCode();
        request_data.shg_id = filteredData.SHGId.value;
        request_data.member_id = shgmemberCode;
        request_data.member_name = filteredData.memberName;
        request_data.father_name = filteredData.fatherName;
        request_data.age = filteredData.memberAge;
        request_data.dob = filteredData.DOB;
        request_data.gender = filteredData.gender;
        request_data.community = filteredData.community;
        var isVulnerable = 0;
        var isVRFReceived = 0;
        var vrf_amount = 0;
        var insurance_type = null;
        var last_expiry_date = null;
        var isInsuranceRegistered = 0;
        var islivelihood = 0;
        var isESharm = 0;
        var account_status = 0;
        var vulnerableCategory = 0;
        var isLocalBodyRepresentative = 0;
        var local_representative_position = null;
        var livelihood_activities = 0;
        if (request_data.vrf_amount !== undefined) {
            vrf_amount = request_data.vrf_amount;
        }
        if (request_data.insurance_type !== undefined) {
            insurance_type = request_data.insurance_type;
        }
        if (request_data.last_expiry_date !== undefined) {
            last_expiry_date = request_data.last_expiry_date;
        }
        if (request_data.isVulnerable == "yes") {
            isVulnerable = 1;
        }
        if (request_data.isVRFReceived == "yes") {
            isVRFReceived = 1;
        }
        if (request_data.isInsuranceRegistered == "yes") {
            isInsuranceRegistered = 1;
        }
        if (request_data.islivelihood == "yes") {
            islivelihood = 1;
        }
        if (request_data.isESharm == "yes") {
            isESharm = 1;
        }
        if (request_data.account_status == "yes") {
            account_status = 1;
        }
        if (request_data.isLocalBodyRepresentative == "yes") {
            isLocalBodyRepresentative = 1;
        }
        var workerCode = null;
        var msme_reg_number = null;
        if (filteredData.worker_code !== undefined) {
            workerCode = filteredData.workerCode;
        }
        if (filteredData.MSMERegNumber !== undefined) {
            msme_reg_number = filteredData.MSMERegNumber;
        }
        if (filteredData.localBodyRepresentativePosition !== undefined) {
            local_representative_position = filteredData.localBodyRepresentativePosition;
        }
        if (filteredData.livelihood_activities !== undefined) {
            livelihood_activities = livelihood_activities;
        }
        console.log(filteredData);
        request_data.vulnerability = isVulnerable;
        request_data.vulnerability_categiryt = filteredData.vulnerableCategory;
        request_data.education = filteredData.education;
        request_data.occupation = filteredData.occupation;
        request_data.worker_code = workerCode;
        request_data.msme_reg_number = msme_reg_number;
        request_data.pan_number = filteredData.PAN;
        request_data.aadhar_number = filteredData.AADHAR;
        request_data.smart_card = filteredData.smartCard;
        request_data.contact = filteredData.contact;
        request_data.role = filteredData.role;
        request_data.monthly_savings = filteredData.monthlySavings;
        request_data.religion = filteredData.religion;
        request_data.is_vrf_received = isVRFReceived;
        request_data.vrf_amount = vrf_amount;
        request_data.is_insurance_registered = isInsuranceRegistered;
        request_data.insurance_type = insurance_type;
        request_data.last_expiry_date = last_expiry_date;
        request_data.islivelihood = islivelihood;
        request_data.livelihood_activities = livelihood_activities;
        request_data.is_esharm = isESharm;
        request_data.annual_Income = filteredData.annualIncome;
        request_data.pip_category = filteredData.PIPCategory;
        request_data.ifsc = filteredData.IFSC;
        request_data.account_type = filteredData.accountType;
        request_data.account_number = filteredData.accountNumber;
        request_data.branch_name = filteredData.branchName;
        request_data.bank_name = filteredData.bankName;
        request_data.account_status = account_status;
        request_data.family_member_count = filteredData.familyMemberCount;
        request_data.annual_income_family = filteredData.annualIncomeOfFamily;
        request_data.is_local_representative = isLocalBodyRepresentative;
        request_data.local_representative_position = local_representative_position;

        console.log("request_data request_data request_data request_data request_data ");
        console.log(request_data);
        const connection = await pool.getConnection();

        const updateQuery = `
        UPDATE shg_members 
        SET member_name = ?,
            dob = ?,
            doj = ?,
            role = ?,
            social_category = ?,
            pvtg_category = ?,
            religion = ?,
            education = ?,
            marital_status = ?,
            insurance = ?,
            disability = ?,
            disability_type = ?,
            is_head_of_family = ?,
            father_name = ?,
            relation = ?,
            cardes_role = ?,
            nrgea_job_number = ?,
            pmay_g_id = ?,
            secc_id = ?,
            nrlm_mis_id = ?,
            state_mis_id = ?,
            primary_livelhoods = ?,
            secondary_livel_hoods = ?,
            third_livelhoods = ?,
            approved_comment = ?,
            first_time_approval_date = ?,
            status = ?,
            account_number = ?,
            ifsc = ?,
            branch_name = ?,
            bank_name = ?,
            acc_opening_date = ?,
            account_type = ?
        WHERE shg_id = ? AND member_id = ?`;
        const updateResult = await pool.execute(updateQuery, [
            request_data.member_name || null,
            request_data.dob || null,
            request_data.doj || null,
            request_data.role || null,
            request_data.social_category || null,
            request_data.pvtg_category || null,
            request_data.religion || null,
            request_data.education || null,
            request_data.marital_status || null,
            request_data.insurance || null,
            request_data.disability || null,
            request_data.disability_type || null,
            request_data.is_head_of_family || null,
            request_data.father_name || null,
            request_data.relation || null,
            request_data.cardes_role || null,
            request_data.nrgea_job_number || null,
            request_data.pmay_g_id || null,
            request_data.secc_id || null,
            request_data.nrlm_mis_id || null,
            request_data.state_mis_id || null,
            request_data.primary_livelhoods || null,
            request_data.secondary_livel_hoods || null,
            request_data.third_livelhoods || null,
            request_data.approved_comment || null,
            request_data.first_time_approval_date || null,
            request_data.status || null,
            request_data.account_number || null,
            request_data.ifsc || null,
            request_data.branch_name || null,
            request_data.bank_name || null,
            request_data.acc_opening_date || null,
            request_data.account_type || null,
            request_data.shg_id,
            request_data.member_id
        ]);
        console.log(updateResult);
        console.log("updateResult");
        //     res.send({status:true, message:"Updated Successfully"}); 

    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

function editedField(data) {
    const keys = Object.keys(data);
    let dummyObject = {};
    for (const key of keys) {
        dummyObject[key] = "";
    }
    return dummyObject;
}

const deleteShg = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const { SHGId } = req.params;
        if (!SHGId) {
            return handleInvalidQuery(res, "SHGId is required");
        }
        const data = await model.findOneAndUpdate(
            { SHGId, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );
        if (!data) {
            return handleInvalidQuery(res, "No SHG found with given SHGId");
        }
        return res.status(200).send({ status: true, data });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const deleteShgMember = async (req, res) => {
    try {
        const model = mongo.conn.model(
            "SHGMember",
            shgMemberSchema,
            "shgMembersNew"
        );
        const { MemberId } = req.params;
        if (!MemberId) {
            return handleInvalidQuery(res, "MemberId is required");
        }
        const data = await model.findOneAndUpdate(
            { MemberId, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );
        if (!data) {
            return handleInvalidQuery(res, "No SHG member found with given MemberId");
        }
        return res.status(200).send({ status: true, data });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const getBankdetails = async (req, res) => {
    try {

        const IFSCCode = req.params.IFSCCode;
        const queryString = `select * from bank_details where ifsc_code='${IFSCCode}'`;
        const [data, fields] = await pool.execute(queryString);
        console.log("data data data datadata");
        console.log(data);


        if (!data || data == "null") {
            return res
                .status(404)
                .json({ status: "error", error: "Provide Valid IFSC Code" });
        } else {
            return res.send({ status: "success", data });
        }
    } catch (err) {
        return res
            .status(400)
            .json({ success: false, error: "Invalid data or request" });
    }
};
// bank validation
const bankValidate = async (req, res) => {
    try {
        console.log(req.body);
        const IFSC = req.body.IFSC;
        const bankName = req.body.bankName;
        const accountNumber = req.body.accountNumber;
        const branchName = req.body.branchName;
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", {}, "bankDetailshg");
        const existingSHG = await bankDetailsModel.findOne({
            "IFSC": IFSC,
            "bankName": bankName,
            "accountNumber": accountNumber,
            "branchName": branchName,
            is_active: 1
        });
        const bank = JSON.parse(JSON.stringify(existingSHG))
        if (existingSHG) {
            const SHGId = bank.SHGId;
            const SHG = mongo.conn.model("SHG", {}, "shgMapTest");
            const shgData = await SHG.find({ SHGId });
            return res.status(409).json({
                status: "error",
                error: "Bank details already exist for SHG",
                data: {
                    existingSHG, shgData
                },
            });
        }
        else {
            return res.status(200).json({ status: "success", message: "New User" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
// member bank detail validation
const bankValidateMember = async (req, res) => {
    try {
        const IFSC = req.query.IFSC;
        const bankName = req.query.bankName;
        const accountNumber = req.query.accountNumber;
        const branchName = req.query.branchName;
        const SHGMember = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember")
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const existingBankDetails = await SHGMember.find({
            IFSC,
            bankName,
            accountNumber,
            branchName,
            is_active: 1
        });
        if (existingBankDetails) {
            return res.status(409).json({
                status: "error",
                error: "Bank details already exist in bankDetailsModel",
                data: existingBankDetails,
            });
        } else {
            return res.status(200).json({ status: "success", message: "New User" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
/* AADHAR VALIDATE   */
const aadharValidate = async (req, res) => {
    try {
        const AADHAR = req.params.AADHAR;
        const SHGMember = mongo.conn.model("SHGMember", {}, "SHGMember");
        const SHGMemberPending = mongo.conn.model(
            "UpdateData",
            updateShgMemberSchema,
            "SHGMemberPending"
        );
        const existingMember = await SHGMember.find({ AADHAR, is_active: 1 });
        const existingPendingMember = await SHGMemberPending.find({
            AADHAR,
            is_active: 1,
        });
        if (
            (existingMember.length > 0 && existingMember != null) ||
            (existingPendingMember != null && existingPendingMember.length > 0)
        ) {
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
    try {
        const smartCard = req.params.smartCard;
        const SHGMember = mongo.conn.model("SHGMember", {}, "SHGMember");
        const SHGMemberPending = mongo.conn.model(
            "UpdateData",
            updateShgMemberSchema,
            "SHGMemberPending"
        );
        const existingMember = await SHGMember.find({ smartCard, is_active: 1 });
        const existingPendingMember = await SHGMemberPending.find({
            smartCard,
            is_active: 1,
        });
        if (
            (existingMember.length > 0 && existingMember != null) ||
            (existingPendingMember != null && existingPendingMember.length > 0)
        ) {
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
const contactValidate = async (req, res) => {
    try {
        const contact = req.params.contact;
        const SHGMember = mongo.conn.model("SHGMember", {}, "SHGMember");
        const SHGMemberPending = mongo.conn.model(
            "UpdateData",
            updateShgMemberSchema,
            "SHGMemberPending"
        );
        const existingMember = await SHGMember.find({ contact, is_active: 1 });
        const existingPendingMember = await SHGMemberPending.find({
            contact,
            is_active: 1,
        });
        if (
            (existingMember.length > 0 && existingMember != null) ||
            (existingPendingMember != null && existingPendingMember.length > 0)
        ) {
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

const getShgNamelist = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, is_active: 1 };
        district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
        block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (query.panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
        habitation ? (query.habitation = { $regex: new RegExp(habitation, "i") }) : null;
        const data = await model
            .find(query, { _id: 0, __v: 0 })
            .sort({ createdAt: -1 })
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
const getShgsNewlist = async (req, res) => {
    try {
        var { district, block, panchayat, habitation, limit, skip } = req.query;


        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, approved: 0, is_ActiveApproved: 1, is_active: 1, reject: 0 };
        var queryoptions = `
        SELECT *
        FROM shg
        WHERE approved = 1 AND is_completed = 1 
          AND reject = 0 
          ${district ? `AND district LIKE '%${district}%'` : ''}
          ${block ? `AND block LIKE '%${block}%'` : ''}
          ${panchayat ? `AND panchayat LIKE '%${panchayat}%'` : ''} 
          ${habitation ? `AND habitation LIKE '%${habitation}%'` : ''} 
        ORDER BY created_at DESC, id DESC
        LIMIT ${limit}
        OFFSET ${skip};
    `;
        const connection = await pool.getConnection();
        // Get last inserted ID
        const [data] = await connection.query(queryoptions);
        connection.release();  
        if (data.length <= 0) {
            return handleInvalidQuery(
                res,
                "No SHGs found in village, create shg first"
            );
        }
        res.set("SHG-Total-Count", data.length);
        res.send(data);
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
}; 

const getShgMembersnewlist = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        var { district, block, panchayat, habitation, limit, skip, SHGId } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, is_active: 1, approved: 1, is_ActiveApproved: 1, reject: 0 };
        district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
        block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (query.panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
        habitation ? (query.habitation = { $regex: new RegExp(habitation, "i") }) : null;
        SHGId ? query.SHGId = SHGId : null;
        const startDate = new Date('2023-11-01');

        const data = await model
            // .find(query, { _id: 0, __v: 0 })
            .find({ ...query, approvedAt: { $gte: startDate } }, { _id: 0, __v: 0 })
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

//member list(specific shg)
const getShgMemberlistshgid = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        // const pendingModel = mongo.conn.model("SHGMember", updateShgMemberSchema, "SHGMemberPending");

        const { SHGId } = req.params;
        if (!SHGId) {
            return handleInvalidQuery(res, "MemberId is required");
        }
        const data = await model.find({ SHGId, isDeleted: false, reject: 0, is_ActiveApproved: 1, is_active: 1 });
        // const data1 = await pendingModel.find({ SHGId, isDeleted: false,approved:0 });

        if (data.length <= 0) {
            return handleInvalidQuery(res, "No SHG member found with given MemberId");
        }
        return res.send({ data });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const getShgMemberlistid = async (req, res) => {
    try {
        const model = mongo.conn.model("incompletedMember", inCompleteshgMemberSchema, "IncompletedMember");
        // const pendingModel = mongo.conn.model("SHGMember", updateShgMemberSchema, "SHGMemberPending");

        const { Id } = req.params;
        if (!Id) {
            return handleInvalidQuery(res, "MemberId is required");
        }
        const data = await model.find({ Id, isDeleted: false, reject: 0, is_ActiveApproved: 1, is_active: 1 });
        // const data1 = await pendingModel.find({ SHGId, isDeleted: false,approved:0 });

        if (data.length <= 0) {
            return handleInvalidQuery(res, "No SHG member found with given MemberId");
        }
        return res.send({ data });
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};

const uploadfilesdata = async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.uploadedFile;

    try {
        const workbook = xlsx.read(uploadedFile.data);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        data.splice(0, 2);
        // console.log(data.length);
        for (let i = 0; i < data.length; i++) {

            const row = data[i];
            console.log(row);
            const excelDate = row.__EMPTY_6;
            const excelDate2 = row.__EMPTY_22;
            var account_type = 1;
            // if ('__EMPTY_35' in row && row.__EMPTY_35 === "Active") {
            if ('__EMPTY_35' in row) {
                // console.log(row);   
                const convertedDate = row.__EMPTY_6;
                const convertedDate1 = row.__EMPTY_13;

                let promoters_name = "";
                let reason = "-";
                let special_category = "-";
                let status = 1;
                let active_members = 0;

                if ('__EMPTY_10' in row) {
                    promoters_name = row.__EMPTY_11;
                }
                if ('__EMPTY_14' in row && row.__EMPTY_14) {
                    special_category = row.__EMPTY_14;
                }
                if ('__EMPTY_35' in row && row.__EMPTY_35 === "Inactive") {
                    status = 0;
                    reason = row.__EMPTY_33;
                }
                // console.log(row);

                const queryString = `SELECT district.districtname, blocks.blockname, villages.villagename, habitation.habitation, district.districtcode, blocks.blockcode, villages.villagecode, habitation.habitation_id FROM district INNER JOIN blocks ON blocks.districtcode = district.districtcode INNER JOIN villages ON villages.blockcode = blocks.blockcode INNER JOIN habitation ON habitation.panchayat = villages.villagename WHERE habitation.habitation LIKE '%${row.__EMPTY_3}%'`;

                try {
                    const [results, fields] = await pool.execute(queryString);
                    if (results.length > 0) {

                        // console.log('Fetched rows:', results);
                        // res.json(rows);
                        const query = 'INSERT INTO shg (district, block, panchayat, habitation, districtcode, blockcode, panchayatcode, habitationcode, shg_code, shg_name, formation_date, primary_cbo, secondary_cbo, promoted_by, promoters_name, co_opt_status, co_opt_revival_date, category, special_category, meeting_frequency, savings_frequency, total_savings, tenure_months, primary_livelhoods, secondary_livelhoods, third_livelhoods, active_members, status, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                        // console.log(results[0]);
                        try {
                            const document = {
                                district: results[0].districtname,
                                block: results[0].blockname,
                                panchayat: results[0].villagename,
                                habitation: results[0].habitation,
                                districtcode: results[0].districtcode,
                                blockcode: results[0].blockcode,
                                panchayatcode: results[0].villagecode,
                                habitationcode: results[0].habitation_id,
                                shg_code: row.__EMPTY_4,
                                shg_name: row.__EMPTY_5,
                                formation_date: convertedDate,
                                primary_cbo: row.__EMPTY_8,
                                secondary_cbo: row.__EMPTY_9,
                                promoted_by: row.__EMPTY_10,
                                promoters_name: promoters_name,
                                co_opt_status: row.__EMPTY_12,
                                co_opt_revival_date: convertedDate1,
                                category: row.__EMPTY_14,
                                special_category: special_category,
                                meeting_frequency: row.__EMPTY_16,
                                savings_frequesncy: row.__EMPTY_17,
                                total_savings: row.__EMPTY_18,
                                tenure_months: row.__EMPTY_19,
                                primary_livelhoods: row.__EMPTY_20,
                                secondary_livel_hoods: row.__EMPTY_21,
                                third_livelhoods: row.__EMPTY_22,
                                active_members: row.__EMPTY_7,
                                status: status,
                                reason: reason,
                            };
                            const result = await pool.execute(query, [
                                document.district,
                                document.block,
                                document.panchayat,
                                document.habitation,
                                document.districtcode,
                                document.blockcode,
                                document.panchayatcode,
                                document.habitationcode,
                                document.shg_code,
                                document.shg_name,
                                document.formation_date,
                                document.primary_cbo,
                                document.secondary_cbo,
                                document.promoted_by,
                                document.promoters_name,
                                document.co_opt_status,
                                document.co_opt_revival_date,
                                document.category,
                                document.special_category,
                                document.meeting_frequency,
                                document.savings_frequesncy,
                                document.total_savings || null,
                                document.tenure_months || null,
                                document.primary_livelhoods || null,
                                document.secondary_livel_hoods || null,
                                document.third_livelhoods || null,
                                document.active_members || null,
                                document.status || null,
                                document.reason || null
                            ]);
                            var bank_status = 0;
                            var bank_add_status = 0;
                            console.log(row);
                            if (row.__EMPTY_23 != "-" && row.__EMPTY_28 == "") {
                                var queryString1 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${row.__EMPTY_24}'`;
                                account_type = 1;
                            }
                            else if (row.__EMPTY_23 == "-" && row.__EMPTY_28 != "-") {
                                var queryString1 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${row.__EMPTY_29}'`;
                                account_type = 0;
                            }
                            else if (row.__EMPTY_28 != "-" && row.__EMPTY_23 != "-") {
                                bank_status = 1;
                                var queryString1 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${row.__EMPTY_24}' `;
                                var queryString2 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${row.__EMPTY_29}'`;
                                account_type = 2;
                            }
                            else {
                                bank_add_status = 1;
                            }

                            try {
                                if (bank_add_status == 0) {
                                    var shg_id = result[0].insertId;
                                    if (bank_status == 1) {
                                        if (bank_results.length > 0) {
                                            const [bank_results, fields1] = await pool.execute(queryString1);
                                            console.log("bank_results");
                                            console.log(bank_results);
                                            const document1 = {
                                                bank_id: bank_results[0].id,
                                                shg_id: shg_id,
                                                ifsc: bank_results[0].ifsc_code,
                                                bank_name: bank_results[0].bank_name,
                                                account_number: row.__EMPTY_9,
                                                branch_name: row.__EMPTY_11,
                                                account_type: account_type
                                            };
                                            const query = 'INSERT INTO shg_bank_details (bank_id, shg_id, ifsc, bank_name, account_number, branch_name, account_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                            const result1 = await pool.execute(query, [
                                                document1.bank_id,
                                                document1.shg_id,
                                                document1.ifsc,
                                                document1.bank_name,
                                                document1.account_number,
                                                document1.branch_name,
                                                document1.account_type
                                            ]);
                                            const [bank_results1, fields11] = await pool.execute(queryString2);
                                            console.log("bank_results");
                                            console.log(bank_results1);
                                            const document11 = {
                                                bank_id: bank_results1[0].id,
                                                shg_id: shg_id,
                                                ifsc: bank_results1[0].ifsc_code,
                                                bank_name: bank_results1[0].bank_name,
                                                account_number: row.__EMPTY_9,
                                                branch_name: row.__EMPTY_11,
                                                account_type: account_type
                                            };
                                            const query1 = 'INSERT INTO shg_bank_details (bank_id, shg_id, ifsc, bank_name, account_number, branch_name, account_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                            const result11 = await pool.execute(query1, [
                                                document11.bank_id,
                                                document11.shg_id,
                                                document11.ifsc,
                                                document11.bank_name,
                                                document11.account_number,
                                                document11.branch_name,
                                                document11.account_type
                                            ]);
                                        }
                                    }
                                    else {
                                        const [bank_results, fields1] = await pool.execute(queryString1);
                                        if (bank_results.length > 0) {
                                            console.log("bank_results");
                                            console.log(bank_results);
                                            const document1 = {
                                                bank_id: bank_results[0].id,
                                                shg_id: shg_id,
                                                ifsc: bank_results[0].ifsc_code,
                                                bank_name: bank_results[0].bank_name,
                                                account_number: row.__EMPTY_9,
                                                branch_name: row.__EMPTY_11,
                                                account_type: account_type
                                            };
                                            const query = 'INSERT INTO shg_bank_details (bank_id, shg_id, ifsc, bank_name, account_number, branch_name, account_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                            const result3 = await pool.execute(query, [
                                                document1.bank_id,
                                                document1.shg_id,
                                                document1.ifsc,
                                                document1.bank_name,
                                                document1.account_number,
                                                document1.branch_name,
                                                document1.account_type
                                            ]);
                                            console.log('Inserted row:', result3[0]);
                                            console.log('Inserted ID:', result3[0].insertId);
                                        }
                                    }
                                    // Access the insert ID if


                                }
                            }

                            catch (e) {
                                return res
                                    .status(400)
                                    .send({ status: false, error: `Invalid Query1 err: ${e.message}` });
                            }
                            console.log('Inserted row:', result[0]);
                            console.log('Inserted ID:', result[0].insertId); // Access the insert ID if needed
                        } catch (error) {
                            console.error('Error inserting row:', error);
                            throw error; // Rethrow the error to handle it further if needed
                        }
                    }

                } catch (error) {
                    console.error('Error fetching data:', error);
                    res.status(500).json({ error: 'Error fetching data' });
                }
            }
        }

        res.json(data);


    } catch (err) {
        console.error("Error reading file:", err);
        res.status(500).send('Error reading file.');
    }
};


const uploadfilesdata1 = async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.uploadedFile;

    try {
        const workbook = xlsx.read(uploadedFile.data);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        data.splice(0, 2);

        for (let i = 0; i < data.length; i++) {
            console.log(data[i]);
            const row = data[i];

            const excelDate = row.__EMPTY_6;
            const excelDate2 = row.__EMPTY_22;
            var account_type = 1;
            var active_data = `${row.__EMPTY_4}`;
            let active_data_trim = active_data.trim();
            if ('__EMPTY_45' in row && row.__EMPTY_45 === "ACTIVE") {
                // console.log(row);   
                const convertedDate = row.__EMPTY_6;
                const convertedDate1 = row.__EMPTY_22;

                let promoters_name = "";
                let reason = "-";
                let category = null;
                let pvtg_category = null;
                let education = null;
                let insurance = null;
                let marital_status = null;
                let disability = null;
                let disability_type = null;
                let is_head_of_family = null;
                let cardes_role = null;
                let nrgea_job_number = null;
                let pmay_g_id = null;
                let secc_id = null;
                let nrlm_mis_id = null;
                let state_mis_id = null;
                let primary_livelhoods = null;
                let secondary_livel_hoods = null;
                let third_livelhoods = null;
                let first_time_approval_date = null;
                let status = 1;
                let active_members = 0;
                if ('__EMPTY_12' in row && row.__EMPTY_12 != "" && row.__EMPTY_12 != "-") {
                    category = row.__EMPTY_12;
                }
                if ('__EMPTY_13' in row && row.__EMPTY_13 != "" && row.__EMPTY_13 != "-") {
                    pvtg_category = row.__EMPTY_13;
                }
                if ('__EMPTY_15' in row && row.__EMPTY_15 != "" && row.__EMPTY_15 != "-") {
                    education = row.__EMPTY_15;
                }
                if ('__EMPTY_16' in row && row.__EMPTY_16 != "" && row.__EMPTY_16 != "-") {
                    marital_status = row.__EMPTY_16;
                }
                if ('__EMPTY_17' in row && row.__EMPTY_17 != "" && row.__EMPTY_17 != "-") {
                    insurance = row.__EMPTY_17;
                }
                if ('__EMPTY_18' in row && row.__EMPTY_18 != "" && row.__EMPTY_18 != "-") {
                    disability = row.__EMPTY_18;
                }
                if ('__EMPTY_19' in row && row.__EMPTY_19 != "" && row.__EMPTY_19 != "-") {
                    disability_type = row.__EMPTY_19;
                }
                if ('__EMPTY_20' in row && row.__EMPTY_20 != "" && row.__EMPTY_20 != "-") {
                    is_head_of_family = row.__EMPTY_20;
                }
                if ('__EMPTY_31' in row && row.__EMPTY_31 != "" && row.__EMPTY_31 != "-") {
                    cardes_role = row.__EMPTY_31;
                }
                if ('__EMPTY_35' in row && row.__EMPTY_35 != "" && row.__EMPTY_35 != "-") {
                    nrgea_job_number = row.__EMPTY_35;
                }
                if ('__EMPTY_36' in row && row.__EMPTY_36 != "" && row.__EMPTY_36 != "-") {
                    pmay_g_id = row.__EMPTY_36;
                }
                if ('__EMPTY_37' in row && row.__EMPTY_37 != "" && row.__EMPTY_37 != "-") {
                    secc_id = row.__EMPTY_37;
                }
                if ('__EMPTY_38' in row && row.__EMPTY_38 != "" && row.__EMPTY_38 != "-") {
                    nrlm_mis_id = row.__EMPTY_38;
                }
                if ('__EMPTY_39' in row && row.__EMPTY_39 != "" && row.__EMPTY_39 != "-") {
                    state_mis_id = row.__EMPTY_39;
                }
                if ('__EMPTY_32' in row && row.__EMPTY_32 != "" && row.__EMPTY_32 != "-") {
                    primary_livelhoods = row.__EMPTY_32;
                }
                if ('__EMPTY_33' in row && row.__EMPTY_33 != "" && row.__EMPTY_33 != "-") {
                    secondary_livel_hoods = row.__EMPTY_33;
                }
                if ('__EMPTY_34' in row && row.__EMPTY_34 != "" && row.__EMPTY_34 != "-") {
                    third_livelhoods = row.__EMPTY_34;
                }
                if ('__EMPTY_44' in row && row.__EMPTY_44 != "" && row.__EMPTY_44 != "-") {
                    third_livelhoods = row.__EMPTY_44;
                }
                const queryString = `SELECT * FROM shg WHERE shg.shg_code = '${active_data_trim}'`;
                try {
                    const [results, fields] = await pool.execute(queryString);
                    console.log(results);
                    console.log("resultssssssssssssssssss---------------------------------");
                    if (results.length > 0) {
                        const query = 'INSERT INTO shg_members (shg_id, member_id, member_name, dob, doj, role, social_category, pvtg_category, religion, education, marital_status, insurance, disability, disability_type, is_head_of_family, father_name, relation, cardes_role,nrgea_job_number,pmay_g_id,secc_id,nrlm_mis_id,state_mis_id, primary_livelhoods, secondary_livel_hoods, third_livelhoods, approved_comment, first_time_approval_date,status, account_number,ifsc,branch_name,bank_name,acc_opening_date,account_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)';
                        // console.log(results[0]);
                        try {
                            const document = {
                                shg_id: results[0].id,
                                member_id: row.__EMPTY_4,
                                member_name: row.__EMPTY_8,
                                dob: row.__EMPTY_9,
                                doj: row.__EMPTY_10,
                                role: row.__EMPTY_11,
                                social_category: category,
                                pvtg_category: pvtg_category,
                                religion: row.__EMPTY_14,
                                education: education,
                                marital_status: marital_status,
                                insurance: insurance,
                                disability: disability,
                                disability_type: disability_type,
                                is_head_of_family: is_head_of_family,
                                father_name: row.__EMPTY_21,
                                relation: row.__EMPTY_22,
                                cardes_role: cardes_role,
                                nrgea_job_number: nrgea_job_number,
                                pmay_g_id: pmay_g_id,
                                secc_id: secc_id,
                                nrlm_mis_id: nrlm_mis_id,
                                state_mis_id: state_mis_id,
                                primary_livelhoods: primary_livelhoods,
                                secondary_livel_hoods: secondary_livel_hoods,
                                third_livelhoods: third_livelhoods,
                                first_time_approval_date: first_time_approval_date,
                                status: 1,
                                account_number: row.__EMPTY_23,
                                ifsc: row.__EMPTY_24,
                                branch_name: row.__EMPTY_25,
                                bank_name: row.__EMPTY_26,
                                acc_opening_date: row.__EMPTY_27,
                                account_type: row.__EMPTY_28,
                                approved_comment: row.__EMPTY_43

                            };
                            const result = await pool.execute(query, [
                                document.shg_id,
                                document.member_id,
                                document.member_name,
                                document.dob,
                                document.doj,
                                document.role,
                                document.social_category,
                                document.pvtg_category,
                                document.religion,
                                document.education,
                                document.marital_status,
                                document.insurance,
                                document.disability,
                                document.disability_type,
                                document.is_head_of_family,
                                document.father_name,
                                document.relation,
                                document.cardes_role,
                                document.nrgea_job_number,
                                document.pmay_g_id,
                                document.secc_id,
                                document.nrlm_mis_id || null,
                                document.state_mis_id || null,
                                document.primary_livelhoods || null,
                                document.secondary_livel_hoods || null,
                                document.third_livelhoods || null,
                                document.approved_comment,
                                document.first_time_approval_date || null,
                                document.status,
                                document.account_number || null,
                                document.ifsc || null,
                                document.branch_name || null,
                                document.bank_name || null,
                                document.acc_opening_date || null,
                                document.account_type || null

                            ]);
                            console.log('Inserted row:', result[0]);
                            console.log('Inserted ID:', result[0].insertId); // Access the insert ID if needed
                        } catch (error) {
                            console.error('Error inserting row:', error);
                            throw error; // Rethrow the error to handle it further if needed
                        }
                    }

                } catch (error) {
                    console.error('Error fetching data:', error);
                    res.status(500).json({ error: 'Error fetching data' });
                }
            }
        }

        res.json(data);


    } catch (err) {
        console.error("Error reading file:", err);
        res.status(500).send('Error reading file.');
    }
};

function convertDateFormat(dateString) {
    var parts = dateString.split('-');
    var newDateFormat = parts[2] + '-' + parts[1] + '-' + parts[0];
    return newDateFormat;
}
function convertExcelDate(excelDate) {
    console.log("excelDate");
    console.log(excelDate);
    const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
    return date.toISOString().split('T')[0]; // Return ISO format YYYY-MM-DD
}


module.exports = {
    getBranch,
    getDistrictData,
    getPanjayat,
    getShgData,
    getShgs,
    addShg,
    addShgMember,
    getShgMembers,
    getShg,
    getShgMember,
    updateShg,
    updateShgMember,
    deleteShg,
    deleteShgMember,
    getBankdetail,
    getallBankdetails,
    aadharValidate,
    smartCardValidate,
    contactValidate,
    getShgsPending,
    getBankdetails,
    getShgMembersPending,
    getShgNamelist,
    bankValidate,
    bankValidateMember,
    getShgsNewlist,
    getShgMemberlistshgid,
    getShgMemberlistid, getShgMembersnewlist,
    updateSaveShgMember,
    uploadfilesdata,
    uploadfilesdata1,
    getProjectsshg
};


async function getUniqueCodeAndValue(key, district, block, model) {
    var aggregate = [
        {
            $group: {
                _id: {
                    [`${key}name`]: `$${key}name`,
                    [`${key}code`]: `$${key}code`,
                },
            },
        },
        {
            $project: {
                _id: 0,
                [`${key}name`]: `$_id.${key}name`,
                [`${key}code`]: `$_id.${key}code`,
            },
        },
    ];

    var matchObj =
        block == null
            ? {
                districtname: district,
            }
            : {
                districtname: district,
                blockname: block,
            };

    if (district) {
        aggregate.unshift({
            $match: matchObj,
        });
    }
    var data = await model.aggregate(aggregate);
    return data;
}

async function getSHGID(villagecode) {
    return new Promise(async (resolve, reject) => {
        try {
            const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
            const villageModel = mongo.conn.model("village", {}, "villages")
            var village = await villageModel.find({ villagecode: villagecode }, { villagecode: 1 })
            if (village.length <= 0) {
                throw new Error("Invalid village code")
            }
            var data = await model.find({ SHGId: { $gte: villagecode * 100, $lt: (villagecode + 1) * 100 }, isDeleted: false }, { SHGId: 1 });
            var shgID = villagecode;
            if (!data.length <= 0) {
                data.sort((a, b) => parseInt(a.SHGId) - parseInt(b.SHGId))
                var lastSHG = data[data.length - 1]
                shgID = lastSHG.SHGId + 1;
            } else {
                shgID = villagecode * 100 + 1;
            }
            return resolve(shgID)
        } catch (e) {
            return reject(e)
        }
    }
    )
}
async function getMemberId(SHGId) {
    return new Promise(async (resolve, reject) => {
        try {
            const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
            var data = await model.find({ SHGId, isDeleted: false }, { MemberId: 1, _id: 0 });
            var memberId = SHGId;
            if (!data.length <= 0) {
                data.sort((a, b) => parseInt(a.MemberId) - parseInt(b.MemberId));
                var lastMember = data[data.length - 1];
                const MemId = JSON.parse(JSON.stringify(lastMember));
                memberId = MemId.MemberId + 1;
            } else {
                memberId = SHGId * 10000 + 1;
            }
            return resolve(memberId);
        } catch (e) {
            return reject(e);
        }
    });
}
const uniqueData = (list) => {
    const data = Array.from(new Set(list.map(JSON.stringify))).map(JSON.parse);
    return data;
};
function compareObjects(oldData, newData) {
    let obj1 = JSON.parse(JSON.stringify(oldData))
    let obj2 = JSON.parse(JSON.stringify(newData))
    const diff = {};

    for (const key in obj2) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null) {
            if (!obj1.hasOwnProperty(key) || typeof obj1[key] !== 'object' || obj1[key] === null) {
                diff[key] = obj2[key];
            } else {
                const nestedDiff = compareObjects1(obj1[key], obj2[key]);
                if (Object.keys(nestedDiff).length > 0) {
                    diff[key] = nestedDiff;
                }
            }
        } else if (obj1[key] !== obj2[key]) {
            diff[key] = obj2[key];
        }
    }

    return diff;
}
function compareObjects1(obj1, obj2) {
    const diff = {};

    for (const key in obj2) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null) {
            if (!obj1.hasOwnProperty(key) || typeof obj1[key] !== 'object' || obj1[key] === null) {
                // Include the full object from obj2 when there is a difference.
                diff[key] = obj2[key];
            } else {
                // Recursively compare nested objects.
                const nestedDiff = compareObjects(obj1[key], obj2[key]);
                if (Object.keys(nestedDiff).length > 0) {
                    diff[key] = nestedDiff;
                }
            }
        } else if (obj1[key] !== obj2[key]) {
            // Include the full object from obj2 when there is a difference.
            diff[key] = obj2[key];
        }
    }
    if (Object.keys(diff).length !== 0) {
        return obj2;
    } else {
        return ''
    }

}

function editedField(data) {
    const keys = Object.keys(data);

    let dummyObject = {};
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = "";
        dummyObject[key] = value;
    }
    return dummyObject;
}
// memberid for incompletedmember
async function getmemId(Id) {
    return new Promise(async (resolve, reject) => {
        try {
            const model = mongo.conn.model("incompletedMember", inCompleteshgMemberSchema, "IncompletedMember");;
            var data = await model.find({ Id, isDeleted: false }, { MemberId: 1, _id: 0 });
            var memberId = Id;
            if (!data.length <= 0) {
                data.sort((a, b) => parseInt(a.MemberId) - parseInt(b.MemberId));
                var lastMember = data[data.length - 1];
                const MemId = JSON.parse(JSON.stringify(lastMember));
                memberId = MemId.MemberId + 1;
            } else {
                memberId = Id * 10 + 1;
            }
            return resolve(memberId);
        } catch (e) {
            return reject(e);
        }
    });
}