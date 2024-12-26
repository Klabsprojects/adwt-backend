const axios = require('axios');
const { Buffer } = require('buffer');
const xml2js = require('xml2js');
const shgSchema = require("../schemas/shg.schema");
const updateShgSchema = require("../schemas/shg.updateschema");
const shgMemberSchema = require("../schemas/shgMember.schema");
const updateShgMemberSchema = require("../schemas/updateshgMember.schema");
const shgSchemaInComplete = require("../schemas/inComplete.schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");
const inCompleteshgMemberSchema = require("../schemas/incompleteMember.Schema");
const bankLinkageRowsSchema = require("../schemas/bankLinkage.Schema");


// const mongo = require("../utils/mongo");    
const SHGDataFun = require("../utils/shgData")

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


const handleInvalidQuery = (res, message = "") => {
    return res.status(201).send({ message: `no data found` });
};

const aadharverify = async (req, res) => {

    const instance = axios.create({
        timeout: 10000
      });
      
      instance.interceptors.request.use(request => {
        console.log('Starting Request', request);
        return request;
      });
      
      instance.interceptors.response.use(response => {
        console.log('Response:', response);
        return response;
      }, error => {
        console.error('Error Response:', error.response);
        return Promise.reject(error);
      });

    console.log(req.params.Aadharnumber);

    // Define the request parameters
    const requestData = {
        AUAKUAParameters: {
            LAT: "17.494568",
            LONG: "78.392056",
            AADHAARID: req.params.Aadharnumber,
            RRN: "1234567890",
            SLK: "LPAAS-GJLNV-ZSVIL-ZSWER",
            DEVID: "public",
            DEVMACID: "11:22:33:44:55",
            CONSENT: "Y",
            SHRC: "Y",
            VER: "2.5",
            SERTYPE: "07",
            ENV: "2",
            REF: "FROMSAMPLE",
            ISPI: "True",
            ISPA: "False",
            ISPFA: "False",
            PIMS: "E",
            Name: req.query.name,
            PIDOB: req.query.year,
            PIGENDER: req.query.gender
        },
        PIDXml: "",
        ENVIRONMENT: "0"
    };

    // Define the URL
    const url = 'https://tnpreauth.tn.gov.in/clientgwapi/api/Aadhaar/DoDemoAuth';
    console.log(url);

    // Make POST request using axios
    instance.post(url, requestData)
        .then(async (response) => {
            console.log('Response:', response.data);
            // console.log('Response:', response.data);

            // Access the responseXML field
            const responseXML = response.data.responseXML;

            // console.log('Encoded Response XML:', responseXML);

            // Decode base64 if needed
            const decodedXML = Buffer.from(responseXML, 'base64').toString('utf-8');
            console.log('Decoded Response XML:', decodedXML);
            xml2js.parseString(decodedXML, async (err, result) => {
                if (err) {
                    console.error('Error parsing XML:', err);
                    return;
                }
                console.log("response.data response.data response.dataresponse.data response.dataresponse.dataresponse.dataresponse.data response.data response.dataresponse.data");
                console.log(response.data);
                if (response.data.ret == "n") {
                    return res.status(200).json({ status: false, message: "Basic Demographic data did not match" });
                }
                else {
                    // Extracting information from the parsed object
                    const authRes = result.AuthRes;
                    const code = authRes.$.code; // Accessing attributes using $ notation
                    const info = authRes.$.info;
                    const signatureValue = authRes.Signature[0].SignatureValue[0]; // Access nested elements 
                    const check_aadhar_number_exists = `Select shg.* from shg_members INNER JOIN shg ON shg.id = shg_members.shg_id where shg_members.aadhar_number='${req.params.Aadharnumber}'`;
                    const connection = await pool.getConnection();
                    const [results] = await pool.execute(check_aadhar_number_exists);
                    try {
                        if (results.length == 0) {
                            return res.status(200).json({ status: true, data: { signatureValue }, aadhar_exists: 0 });
                        }
                        else {
                            return res.status(200).json({ status: true, data: { signatureValue }, aadhar_exists: 1, results: results });
                        }
                    }
                    catch (e) {
                        console.log("dsgsdggggvxcccccccccccc");
                        console.log('Error executing SQL query:', e);
                        return res.status(500).send('Internal Server Error');
                    }

                }

            });

            // Handle success
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: 'An error occurred' });
        });
}

const getApprovedCount = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const district = req.query.district;
        const approvedCount = await model.countDocuments({
            district: district,
            approved: 1,
        });
        const unapprovedCount = await model.countDocuments({
            district: district,
            approved: 0,
        });
        res.json({ status: true, approvedCount: approvedCount, unapprovedCount: unapprovedCount });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
}

const getApprovedList = async (req, res) => {
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
        AND is_completed=1
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

const getApproved = async (req, res) => {
    try { 
        // console.log(req.body);
        const SHGId = Number(req.body.SHGId);  
        const connection = await pool.getConnection();
        const update_count_data = `UPDATE shg SET is_completed=? WHERE id=?`;

        // const [updates_count] = await pool.execute(update_count_data, [1, SHGId]);
        var queryString = `SELECT * FROM shg WHERE id=${SHGId};`;
        const [data] = await connection.query(queryString);
        var active_members = data[0].active_members;
        var status = true;
        var count = 0;
        if(data[0].category == "Women")
        {
            if(active_members >= 10 && active_members <= 20)
            {
                status = true;
                
            }
            else{
                status = false;
                count = active_members;
                count_msg = 'Members count should be between 10 and 20 to send for approval';
            }
        }
        else if(data[0].category == "Srilankan Tamilan")
        {
            if(active_members >= 10 && active_members <= 20)
                {
                    status = true;
                }
                else{
                    status = false;
                    count = active_members;
                    count_msg = 'Members count should be between 10 and 20 to send for approval';
                }
        }
        else{
            if(active_members >= 5 && active_members <= 20)
                {
                    status = true;
                }
                else{
                    status = false;
                    count = active_members;
                    count_msg = 'Members count should be between 5 and 20 to send for approval';
                }
        }
        if(status)
        {
            res.status(200).json({ status: true, message: `Member with ID has been inactive from the active list.` });
        }
        else{
            res.status(200).json({ status: false, message: count_msg});
        } 
         
        
    } catch (error) {
        console.error("Error rejecting SHG from the active list:", error);
        res.status(500).json({
            status: false,
            error: `Internal server error: ${error.message}`,
        });
    }
};

const getUpdatedshg = async (req, res) => {
    try {
    const SHGId = Number(req.query.SHGId);

    var queryString = `SELECT * FROM shg WHERE id=${SHGId};`;
    var queryString2 = `SELECT 
                        shg_bank_details.*, 
                        bank_details.* 
                    FROM 
                        shg_bank_details 
                    INNER JOIN 
                        bank_details 
                    ON 
                        bank_details.id = shg_bank_details.bank_id 
                    WHERE 
                        shg_bank_details.shg_id = ${SHGId};`;
    // var queryString3 = `SELECT * FROM shg_linkage WHERE shg_id=${SHGId};`;

                var queryString3 = `SELECT 
                shg_linkage.*, 
                bank_details.* 
            FROM 
                shg_linkage 
            INNER JOIN 
                bank_details 
            ON 
                bank_details.id = shg_linkage.bank_id 
            WHERE 
                shg_linkage.shg_id = ${SHGId};`;
// var queryString3 = `SELECT * FROM shg_linkage WHERE shg_id=${SHGId};`;
    console.log(queryString);
    const connection = await pool.getConnection();
    const [data] = await connection.query(queryString);
    const [bank_details] = await connection.query(queryString2);
    const [shg_linkage] = await connection.query(queryString3);
    connection.release();
      const combinedData = {
            shg_data:data,
            bank_details:bank_details,
            shg_linkage:shg_linkage
            };
        const results = {
            SHGId: SHGId,
            updated: true,
            data: combinedData,
            newData: combinedData
        };
        res.json({ status: true, data: results });
        } catch (error) {
            res.status(500).json({ status: false, error: "Internal server error" });
        }
}

// view shg
const getUpdatedshg1 = async (req, res) => {
    try {
        const modelMapTest = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const modelPending = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
        const shgMembers = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const SHGId = Number(req.query.SHGId);
        const mapTestDataApproved0Update0 = await modelMapTest.find({
            SHGId: SHGId
        });
        const mapTestDataApproved0UpdateGT0Pending = await modelPending.find({
            SHGId: SHGId,
            approved: 0,
        });
        const bankDetailData = await bankDetailsModel.find(
            { SHGId },
            { bankId: 1, IFSC: 1, bankName: 1, accountStatus: 1, accountType: 1, accountNumber: 1, branchName: 1, _id: 0 }
        );
        const banklinkage = await bankLinkageRowsModel.find(
            { SHGId },
            {
                LinkageId: 1, loanType: 1, dosage: 1, amount: 1, bankName: 1, loanAcNumber: 1, roi: 1, tenure: 1,
                balance: 1, date: 1, closingDate: 1, IFSC: 1, branchName: 1, _id: 0
            }
        );

        const bank = await SHGDataFun.fetchBankDetails(SHGId);
        const [bankDetails, bankDetails1, bankDetails2] = [...bank];
        const linkage = await SHGDataFun.fetchBankLinkage(SHGId);
        const [bankLinkageRows, bankLinkageRows1, bankLinkageRows2] = [...linkage];
        const user = await SHGDataFun.fetchSHGuser(mapTestDataApproved0Update0[0]);
        const { animatorDetails, representativeOne, representativeTwo } = { ...user };
        if (mapTestDataApproved0UpdateGT0Pending[0]?.is_ActiveApproved === 1) {
            if (mapTestDataApproved0UpdateGT0Pending[0]?.animatorDetails !== 0 || mapTestDataApproved0UpdateGT0Pending[0]?.representativeOne !== 0
                || mapTestDataApproved0UpdateGT0Pending[0]?.representativeTwo !== 0) {
                const pendingUser = await SHGDataFun.fetchSHGuser(mapTestDataApproved0UpdateGT0Pending[0]);
                mapTestDataApproved0UpdateGT0Pending[0]?.animatorDetails ? (mapTestDataApproved0UpdateGT0Pending[0].animatorDetails = pendingUser.animatorDetails) : ''
                mapTestDataApproved0UpdateGT0Pending[0]?.representativeOne ? (mapTestDataApproved0UpdateGT0Pending[0].representativeOne = pendingUser.representativeOne) : ''
                mapTestDataApproved0UpdateGT0Pending[0]?.representativeTwo ? (mapTestDataApproved0UpdateGT0Pending[0].representativeTwo = pendingUser.representativeTwo) : '';
            }

        }
        let animator = { name: '', contact: 0, MemberId: 0 };
        let rep1 = { name: '', contact: 0, MemberId: 0 };
        let rep2 = { name: '', contact: 0, MemberId: 0 };


        if (bankDetailData) {
            const combinedData = {
                ...mapTestDataApproved0Update0[0]._doc,
                bankDetails,
                bankDetails1,
                bankDetails2,
                bankLinkageRows,
                bankLinkageRows1,
                bankLinkageRows2,
                animatorDetails,
                representativeOne,
                representativeTwo
            };
            if (bankDetailData) {
                let combinedData1;
                if (mapTestDataApproved0UpdateGT0Pending[0]?.is_ActiveApproved === 1) {

                    combinedData1 = {
                        ...mapTestDataApproved0UpdateGT0Pending[0]._doc,
                        bankDetails: bankDetailData[0],
                        bankDetails1: bankDetailData[1],
                        bankDetails2: bankDetailData[2],
                        bankLinkageRows: banklinkage[0],
                        bankLinkageRows1: banklinkage[1],
                        bankLinkageRows2: banklinkage[2]
                    };
                } else {
                    combinedData1 = {
                        ...mapTestDataApproved0UpdateGT0Pending[0]._doc,
                    }

                }
                const results = {
                    SHGId: SHGId,
                    updated: mapTestDataApproved0UpdateGT0Pending[0]?.updateCount > 0 ? true : false,
                    data: combinedData,
                    newData: combinedData1,
                };
                res.json({ status: true, data: results });
            }
        }
    } catch (error) {
        res.status(500).json({ status: false, error: "Internal server error" });
    }
};

const getMemberList = async (req, res) => {
    try {
       
        const SHGId = Number(req.query.SHGId);
        // const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        var query = `SELECT * FROM shg WHERE shg.id = '${SHGId}'`;
        const [shgData] = await pool.execute(query);  
        var query1 = `SELECT * FROM shg_members WHERE shg_members.shg_id = '${SHGId}'`;
        const [memberlist] = await pool.execute(query1);  
        const results = {
            SHGId: SHGId,
            district: shgData[0]?.district || '',
            block: shgData[0].block,
            panchayat: shgData[0].panchayat,
            habitation: shgData[0].habitation,
            SHGName: shgData[0].shg_name,
            totalCount: shgData[0].active_members,
            memberlist: memberlist,
            shg_data: shgData[0],
        };
        res.json({ status: true, data: results });
    } catch (error) {
        res.status(500).json({ status: false, error: "Internal server error" });
    }
};

const getmemberApprovedCount = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const district = req.query.district;
        const approvedCount = await model.countDocuments({
            district: district,
            approved: 1,
            memberStatus: 1
        });
        const unapprovedCount = await model.countDocuments({
            district: district,
            approved: 0,
            memberStatus: 1
        });
        res.json({ status: true, approvedCount: approvedCount, unapprovedCount: unapprovedCount });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
}

const getcstApprovedCount = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const district = req.query.district;
        const approvedCount = await model.countDocuments({
            district: district,
            approved: 1,
            memberStatus: 2
        });
        const unapprovedCount = await model.countDocuments({
            district: district,
            approved: 0,
            memberStatus: 2
        });
        res.json({ status: true, approvedCount: approvedCount, unapprovedCount: unapprovedCount });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
}
const Acceptshg1 = async (req, res) => {
    try { 
        console.log(req.body);
        const SHGId = Number(req.body.SHGId);  
        const connection = await pool.getConnection();
        const update_count_data = `UPDATE shg SET is_completed=? WHERE shg_id=?`;
        const [updates_count] = await pool.execute(update_count_data, [0, SHGId]);
        console.log(updates_count);
         res.status(200).json({ status: true, message: `Member with ID has been inactive from the active list.` });
        
    } catch (error) {
        console.error("Error rejecting SHG from the active list:", error);
        res.status(500).json({
            status: false,
            error: `Internal server error: ${error.message}`,
        });
    }
}
const Acceptshg = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const shgMemberModel = mongo.conn.model("MemberData", shgMemberSchema, "SHGMember");
        const modelMapTest = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");

        const SHGId = Number(req.body.SHGId);
        const updateStatus = JSON.parse(JSON.stringify(req.body.updateStatus));
        const approvedBY = req.body.approvedBY;
        const updatedData = await shgPendingModel.findOne({
            SHGId,
            approved: 0,
        }, { _id: 0 });
        const shgData = await modelMapTest.findOne({
            SHGId,
            approved: 0,
        });

        if (!updatedData) {
            return res.status(404).send({ success: false, error: "No matching SHG found" });
        }
        // Check if any of the three fields are updated
        const fieldsToUpdate = ['animatorDetails', 'representativeOne', 'representativeTwo'];
        let update1, update2, approveBankDetail;
        const allStatusTrue = Object.values(updateStatus).every(item => item.status === "true");

        let falseCount = 0;

        // Iterate through each property in the object
        for (let key in updateStatus) {
            // Check if the "status" property is "false"
            if (updateStatus[key].status.toLowerCase() === "false") {
                falseCount++;
            }
        }
        if (updatedData.updateCount == 0) {
            if (allStatusTrue) {
                for (let member of fieldsToUpdate) {
                    const roleName = getMemberRoleForField(member)
                    const MemberId = shgData[member];
                    const memberUpdate = await shgMemberModel.findOneAndUpdate(
                        { SHGId, MemberId }, { $set: { role: roleName } }
                    );
                    if (!memberUpdate) {
                        return res.status(404).json({
                            status: false,
                            message: `Unapproved Member / Not found Member`,
                        })
                    }
                }
                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date()
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus, approved: 1, reject: 0, is_ActiveApproved: 1, approvedBY, approvedAt: new Date() } },
                    { new: true }
                );
                approveBankDetail = await bankDetailsModel.findOneAndUpdate({ SHGId }, { $set: { approved: 1 } })
                approveBankLinkage = await bankLinkageRowsModel.findOneAndUpdate({ SHGId }, { $set: { approved: 1 } })
            } else if (falseCount > 5) {
                let firstFalseStatusRejectSummary = null;

                // Iterate through each property in the object
                for (let key in updateStatus) {
                    // Check if the "status" property is "false"
                    if (updateStatus[key].status.toLowerCase() === "false") {
                        firstFalseStatusRejectSummary = updateStatus[key].rejectSummary;
                        break; // Exit the loop once the first "false" status is found
                    }
                }

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: firstFalseStatusRejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: firstFalseStatusRejectSummary } },
                    { new: true }
                );
                return res.status(200).json({
                    status: true,
                    message: `SHG Rejected successfully`,
                    updatedData: update1,
                });

            } else if (updateStatus?.cif?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif.rejectSummary } },
                    { new: true }
                );
                return res.status(200).json({
                    status: true,
                    message: `SHG Rejected successfully`,
                    updatedData: update1,
                });
            } else if (updateStatus?.cif1?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif1.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif1.rejectSummary } },
                    { new: true }
                );
                return res.status(200).json({
                    status: true,
                    message: `SHG Rejected successfully`,
                    updatedData: update1,
                });

            } else if (updateStatus?.cif2?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif2.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif2.rejectSummary } },
                    { new: true }
                );
                return res.status(200).json({
                    status: true,
                    message: `SHG Rejected successfully`,
                    updatedData: update1,
                });

            } else if (updateStatus?.bankDetails?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails.rejectSummary } },
                    { new: true }
                );
                return res.status(200).json({
                    status: true,
                    message: `SHG Rejected successfully`,
                    updatedData: update1,
                });
            } else if (updateStatus?.bankDetails1?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails1.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails1.rejectSummary } },
                    { new: true }
                );

                return res.status(200).json({
                    status: true,
                    message: `SHG Rejected successfully`,
                    updatedData: update1,
                });
            } else if (updateStatus?.bankDetails2?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails2.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails2.rejectSummary } },
                    { new: true }
                );
                return res.status(200).json({
                    status: true,
                    message: `SHG Rejected successfully`,
                    updatedData: update1,
                });

            } else if (updateStatus?.rf?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.rf.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.rf.rejectSummary } },
                    { new: true }
                );
                return res.status(200).json({
                    status: true,
                    message: `SHG Rejected successfully`,
                    updatedData: update1,
                });

            }
            else {
                let basicDetails = {
                    projectsInSHGArea: {
                        TNSRLM: false,
                        TNRTP: false,
                        PTSLP: false,
                        NRETP: false
                    },
                    formationDate: "",
                    formedBy: "",
                    category: "",
                    specialCategory: "",
                    meetingFrequency: "",
                    monitoredBy: "",
                }
                let animatorDetails = { animatorDetails: 0 }
                let representativeOne = { representativeOne: 0 };
                let representativeTwo = { representativeTwo: 0 };
                let PLF = {
                    shgFederated: "",
                    shgFederated: "",
                    dateAffiliated: "",
                    amountOfAnnualSubscription: "",
                    dateOfLastSubscription: "",
                }
                let SHGSavings = {
                    memberSaving: '',
                    shgSaving: '',
                    totalSaving: '',
                }
                let grading = {
                    grading: "",
                    category: "",
                    date: "",
                }

                let economicAssistance = {
                    received: "",
                    date: "",
                }
                let rf = {
                    received: "",
                    date: "",
                    amount: "",
                }
                let cif = {
                    received: "",
                    amount: "",
                    date: ""
                }
                let cif1 = {
                    received: "",
                    amount: "",
                    date: ""
                }
                let cif2 = {
                    received: "",
                    amount: "",
                    date: ""
                }
                let asf = {
                    received: "",
                    amount: ""
                }
                let cap = {
                    received: "",
                    amount: "",
                    date: ''
                }
                let bulkLoan = {
                    received: "",
                    amount: 0,
                    balanceLoan: ""
                }
                let rejectDetails = {}
                for (const field in updateStatus) {
                    if (field === 'basicDetails' && updateStatus?.basicDetails?.status === 'false') {
                        Object.assign(rejectDetails, basicDetails);
                    } else if (field === 'animatorDetails' && updateStatus?.animatorDetails?.status === 'false') {
                        Object.assign(rejectDetails, animatorDetails);
                    } else if (field === 'representativeOne' && updateStatus?.representativeOne?.status === 'false') {
                        Object.assign(rejectDetails, representativeOne);
                    } else if (field === 'representativeTwo' && updateStatus?.representativeTwo?.status === 'false') {
                        Object.assign(rejectDetails, representativeTwo);
                    } else if (field === 'PLF' && updateStatus?.PLF?.status === 'false') {
                        Object.assign(rejectDetails, PLF);
                    } else if (field === 'SHGSavings' && updateStatus?.SHGSavings?.status === 'false') {
                        Object.assign(rejectDetails, SHGSavings);
                    } else if (field === 'grading' && updateStatus?.grading?.status === 'false') {
                        Object.assign(rejectDetails, grading);
                    } else if (field === 'economicAssistance' && updateStatus?.economicAssistance?.status === 'false') {
                        Object.assign(rejectDetails, economicAssistance);
                    } else if (field === 'rf' && updateStatus?.rf?.status === 'false') {
                        Object.assign(rejectDetails, rf);
                    } else if (field === 'cif' && updateStatus?.cif?.status === 'false') {
                        Object.assign(rejectDetails, cif);
                    } else if (field === 'asf' && updateStatus?.asf?.status === 'false') {
                        Object.assign(rejectDetails, asf);
                    } else if (field === 'cap' && updateStatus?.cap?.status === 'false') {
                        Object.assign(rejectDetails, cap);
                    } else if (field === 'bulkLoan' && updateStatus?.bulkLoan?.status === 'false') {
                        Object.assign(rejectDetails, bulkLoan);
                    }
                }
                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(),
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, reject: 0, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), ...rejectDetails } },
                    { new: true }
                );
                approveBankDetail = await findOneAndUpdate({ SHGId }, { $set: { approved: 0 } })
            }
        } else if (updatedData.updateCount > 0) {
            const sendquery = {};

            const allStatusTrue = Object.values(updateStatus).every(item => item.status === "true");
            if (allStatusTrue) {
                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    { $set: { updateStatus, reject: 0, approved: 1, approvedBY, approvedAt: new Date(), re } },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            ...updatedData, updateStatus, approved: 1, reject: 0, approvedAt: new Date(), approvedBY
                        }
                    },
                    { new: true }
                );
            } else if (falseCount > 4) {
                let firstFalseStatusRejectSummary = null;

                // Iterate through each property in the object
                for (let key in updateStatus) {
                    // Check if the "status" property is "false"
                    if (updateStatus[key].status.toLowerCase() === "false") {
                        firstFalseStatusRejectSummary = updateStatus[key].rejectSummary;
                        break; // Exit the loop once the first "false" status is found
                    }
                }

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: firstFalseStatusRejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: firstFalseStatusRejectSummary } },
                    { new: true }
                );


            } else if (updateStatus?.cif?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif.rejectSummary } },
                    { new: true }
                );
            } else if (updateStatus?.cif1?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif1.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif1.rejectSummary } },
                    { new: true }
                );

            } else if (updateStatus?.rf?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.rf.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.rf.rejectSummary } },
                    { new: true }
                );

            } else if (updateStatus?.cif2?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif2.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.cif2.rejectSummary } },
                    { new: true }
                );


            } else if (updateStatus?.bankDetails?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails.rejectSummary } },
                    { new: true }
                );
            } else if (updateStatus?.bankDetails1?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails1.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails1.rejectSummary } },
                    { new: true }
                );

            } else if (updateStatus?.bankDetails2?.status === 'false') {
                // Iterate through each property in the object

                update1 = await shgPendingModel.findOneAndUpdate(
                    { SHGId, approved: 0 },
                    {
                        $set: {
                            updateStatus: { ...updateStatus }, is_ActiveApproved: 1,
                            approved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails2.rejectSummary
                        }
                    },
                    { new: true }
                );
                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { updateStatus: { ...updateStatus }, approved: 1, is_ActiveApproved: 1, approvedBY, approvedAt: new Date(), reject: 1, rejectionSummary: updateStatus.bankDetails2.rejectSummary } },
                    { new: true }
                );

            }

            else {
                const updatedlist = {}
                let basicDetails = {
                    projectsInSHGArea: {
                        TNSRLM: false,
                        TNRTP: false,
                        PTSLP: false,
                        NRETP: false
                    },
                    formationDate: "",

                    formedBy: "",
                    category: "",
                    specialCategory: "",
                    meetingFrequency: "",
                    monitoredBy: "",
                }
                let animatorDetails = { animatorDetails: 0 }
                let representativeOne = { representativeOne: 0 };
                let representativeTwo = { representativeTwo: 0 };
                let PLF = {
                    shgFederated: "",
                    shgFederated: "",
                    dateAffiliated: "",
                    amountOfAnnualSubscription: "",
                    dateOfLastSubscription: "",
                }
                let SHGSavings = {
                    memberSaving: '',
                    shgSaving: '',
                    totalSaving: '',
                }
                let grading = {
                    grading: "",
                    category: "",
                    date: "",
                }
                let economicAssistance = {
                    received: "",
                    date: "",
                }
                let rf = {
                    received: "",
                    date: "",
                    amount: "",
                }
                let cif = {
                    received: "",
                    amount: "",
                    date: ''

                }
                let cif1 = {
                    received: "",
                    amount: "",
                    date: ''

                }
                let cif2 = {
                    received: "",
                    amount: "",
                    date: ''

                }
                let asf = {
                    received: "",
                    amount: ""
                }
                let cap = {
                    received: "",
                    amount: "",
                    date: ''
                }

                let bulkLoan = {
                    received: "",
                    amount: 0,
                    balanceLoan: ""
                }
                for (const field in updateStatus) {
                    if (field === "basicDetails" && updateStatus?.basicDetails?.status === 'true') {
                        for (const key in basicDetails) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(basicDetails).filter(([key, value]) => value !== undefined)
                            );

                            Object.assign(updatedlist, basicDetails);
                        }
                    } else if (field === "PLF" && updateStatus?.PLF?.status === 'true') {
                        for (const key in PLF) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(PLF).filter(([key, value]) => value !== undefined)
                            );

                            Object.assign(updatedlist, PLF);
                        }
                    } else if (field === "SHGSavings" && updateStatus?.SHGSavings?.status === 'true') {
                        for (const key in SHGSavings) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(SHGSavings).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, SHGSavings);
                        }

                    } else if (field === "grading" && updateStatus?.grading?.status === 'true') {
                        for (const key in grading) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(grading).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, grading);
                        }

                    } else if (field === "economicAssistance" && updateStatus?.economicAssistance?.status === 'true') {
                        for (const key in grading) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(economicAssistance).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, grading);
                        }
                    } else if (field === "rf" && updateStatus?.rf?.status === 'true') {
                        for (const key in rf) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(rf).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, rf);
                        }

                    } else if (field === "cif" && updateStatus?.cif?.status === 'true') {
                        for (const key in cif) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(cif).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, cif);
                        }
                    } else if (field === "cif1" && updateStatus?.cif1?.status === 'true') {
                        for (const key in cif1) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(cif1).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, cif);
                        }
                    } else if (field === "cif2" && updateStatus?.cif2?.status === 'true') {
                        for (const key in cif2) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(cif2).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, cif);
                        }
                    } else if (field === "asf" && updateStatus?.asf?.status === 'true') {
                        for (const key in asf) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(asf).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, asf);
                        }
                    } else if (field === "cap" && updateStatus?.cap?.status === 'true') {
                        for (const key in cap) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(cap).filter(([key, value]) => value !== undefined)
                            );

                            Object.assign(updatedlist, cap);
                        }
                    } else if (field === "bulkLoan" && updateStatus?.bulkLoan?.status === 'true') {
                        for (const key in bulkLoan) {
                            updateStbasicDetailsatus[key] = updateStatus[key];
                            const filteredObject = Object.fromEntries(
                                Object.entries(bulkLoan).filter(([key, value]) => value !== undefined)
                            );
                            Object.assign(updatedlist, bulkLoan);
                        }
                    }
                }

                update2 = await modelMapTest.findOneAndUpdate(
                    { SHGId },
                    { $set: { ...updatedlist, approved: 1, reject: 0, approvedBY, approvedAt: new Date(), updateStatus } },
                    { new: true }
                );

                update1 = await shgPendingModel.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { updateStatus, approved: 1, approvedBY, approvedAt: new Date() } },
                    { new: true }
                );
            }
        }
        return res.status(200).json({
            status: true,
            message: `SHG Approved Successfully`,
            updatedData: update1,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error,
        });
    }
};
// Helper function to get the member role based on the field name
function getMemberRoleForField(fieldName) {
    switch (fieldName) {
        case 'animatorDetails':
            return 'Animator';
        case 'representativeOne':
            return 'Representative 1';
        case 'representativeTwo':
            return 'Representative 2';
        default:
            return null;
    }
}

const Acceptnewusershg = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const modelMapTest = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const SHGId = Number(req.query.SHGId);
        const updatedData = await shgPendingModel.findOne(
            { SHGId, approved: 0, isDeleted: false, is_active: 1 },
            { _id: 0 },// Exclude the _id field
        );
        if (!updatedData) {
            return res.status(404).send({ status: false, error: `No unapproved SHG found with the given SHGId ${SHGId} in shgPending` });
        }
        if (updatedData.updateCount === 0) {
            await shgPendingModel.updateOne({ SHGId }, { $set: { approved: 1 } });
            updatedData.approved = 1;
            updatedData.approvedBY = "Admin";
            updatedData.approvedAt = new Date();
        }
        const filter = { SHGId };
        const update = { $set: updatedData.toObject() };
        const updateResult = await modelMapTest.updateOne(filter, update);
        if (updateResult.nModified === 0) {
            return res.status(404).send({ status: false, error: `No existing document found to update with SHGId ${SHGId}` });
        }
        return res.status(200).send({ status: true, data: updatedData, message: "SHG data updated in shgMapTest successfully" });
    } catch (e) {
        return res.status(500).send({ status: false, error: `Error updating SHG data: ${e.message}` });
    }
};

// approved by ,approvea at,approved 1
const rejectshg = async (req, res) => {
    try { 
        const SHGId = Number(req.body.SHGId); 
        const rejectionSummary = req.body.rejectionSummary;
        const approvedBY = req.body.approvedBY; 
        const connection = await pool.getConnection();
        const update_count_data = `UPDATE shg SET reject=?, reason=?, rejected_by=? WHERE id=?`;
        const [updates_count] = await pool.execute(update_count_data, [1, rejectionSummary, approvedBY, SHGId]); 
        console.log(updates_count);
         res.status(200).json({ status: true, message: `Rejected Successfully` });
        
    } catch (error) {
        console.error("Error rejecting SHG from the active list:", error);
        res.status(500).json({
            status: false,
            error: `Internal server error: ${error.message}`,
        });
    }
};

// AcceptshgMember new & updated user
const AcceptshgMember = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgMemberSchema, "SHGMemberPending");
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const SHGId = Number(req.body.SHGId);
        const MemberId = Number(req.body.MemberId);
        const ApprovedStatus = JSON.parse(JSON.stringify(req.body.ApprovedStatus));

        let message = ''
        const approvedBY = req.body.approvedBY;
        const updatedData = await shgPendingModel.findOne({
            SHGId,
            MemberId,
            approved: 0,
            isDeleted: false,
            is_active: 1,
        }, { _id: 0 });
        if (!updatedData) {
            return res.status(404).json({
                status: false,
                error: `No unapproved SHG member found with the given SHGId ${SHGId} and MemberId ${MemberId} in shgPending`,
            });
        }
        let update2;
        let update1;
        if (updatedData.updateCount === 0) {
            const sendquery = {};
            const allStatusTrue = Object.values(ApprovedStatus).every(item => item.status === "true");
            if (allStatusTrue) {
                update2 = await model.findOneAndUpdate(
                    { MemberId },
                    { $set: { ApprovedStatus, approved: 1, reject: 0, approvedBY, approvedAt: new Date() } },
                    { new: true }
                );

                update1 = await shgPendingModel.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { ApprovedStatus, reject: 0, approved: 1, approvedBY, approvedAt: new Date() } },
                    { new: true }
                );
                message = "Member Approved Succefully";
            } else if (ApprovedStatus.AADHAR?.status == 'false' || ApprovedStatus.bankDetail['status'] === 'false') {
                let rejectSummary;
                if (ApprovedStatus.AADHAR?.status == 'false') {
                    rejectSummary = ApprovedStatus.AADHAR.rejectSummary
                } else {
                    rejectSummary = ApprovedStatus.bankDetail.rejectSummary
                }
                update2 = await model.findOneAndUpdate(
                    { MemberId },
                    { $set: { approved: 1, reject: 1, rejectSummary, approvedBY, approvedAt: new Date(), ApprovedStatus } },
                    { new: true }
                );

                update1 = await shgPendingModel.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { ApprovedStatus, approved: 1, approvedBY, approvedAt: new Date(), reject: 1 } },
                    { new: true }
                );
                message = "Member Rejected Succefully";

            }
            else if (ApprovedStatus.socialCategory?.status === 'false' || ApprovedStatus.smartCard?.status === 'false'
                || ApprovedStatus.memberDetail?.status === 'false' || ApprovedStatus.contact?.status === 'false') {
                let rejectDetails = {}
                const contact = { contact: '' };
                const smartCard = { smartCard: '' };
                const memberDetail = {
                    fatherName: "",
                    memberAge: "",
                    DOB: "",
                    gender: "",
                    religion: "",
                    community: "",
                    vulnerableCategory: "",
                    role: "",
                    PAN: "",
                    isVRFReceived: "",
                    VRFAmount: "",
                    monthlySavings: "",
                    education: "",
                };
                const socialcatagory = {
                    PIP: "",
                    PIPCategory: "",
                    annualIncome: "",
                    isESharm: "",
                    MSMERegNumber: "",
                    islivelihood: "",
                    occupation: "",
                    workerCode: "",
                };
                for (const field in ApprovedStatus) {
                    if (field === 'socialCategory' && ApprovedStatus.socialCategory.status === 'false') {
                        Object.assign(rejectDetails, socialcatagory);
                    } else if (field === 'smartCard' && ApprovedStatus.smartCard.status === 'false') {
                        Object.assign(rejectDetails, smartCard);
                    } else if (field === 'memberDetail' && ApprovedStatus.memberDetail?.status === 'false') {
                        Object.assign(rejectDetails, memberDetail);
                    } else if (field === 'contact' && ApprovedStatus.contact?.status === 'false') {
                        Object.assign(rejectDetails, contact);
                    }
                }
                update2 = await model.findOneAndUpdate(
                    { MemberId },
                    { $set: { ...rejectDetails, approved: 1, reject: 0, approvedBY, approvedAt: new Date(), ApprovedStatus } },
                    { new: true }
                );
                update1 = await shgPendingModel.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { ApprovedStatus, approved: 1, approvedBY, approvedAt: new Date() } },
                    { new: true }
                );
                updatedData.ApprovedStatus = ApprovedStatus;
                message = "Member Approved Succefully";

            }
        }
        else if (updatedData.updateCount > 0) {
            const sendquery = {};
            const allStatusTrue = Object.values(ApprovedStatus).every(item => item.status === "true");
            if (allStatusTrue) {
                update1 = await shgPendingModel.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { ApprovedStatus, reject: 0, approved: 1, approvedBY, approvedAt: new Date() } },
                    { new: true }
                );
                update2 = await model.findOneAndUpdate(
                    { MemberId },
                    {
                        $set: {
                            ...updatedData, approved: 1, reject: 0, approvedAt: new Date(), ApprovedStatus, approvedBY
                        }
                    },
                    { new: true }
                );
            }
            else if (ApprovedStatus.AADHAR?.status == 'false' || ApprovedStatus.bankDetail['status'] === 'false') {
                let rejectSummary;
                if (ApprovedStatus.AADHAR?.status == 'false') {
                    rejectSummary = ApprovedStatus.AADHAR.rejectSummary
                } else {
                    rejectSummary = ApprovedStatus.bankDetail.rejectSummary
                }
                update2 = await model.findOneAndUpdate(
                    { MemberId },
                    { $set: { approved: 1, reject: 1, rejectSummary, approvedBY, approvedAt: new Date(), ApprovedStatus } },
                    { new: true }
                );

                update1 = await shgPendingModel.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { ApprovedStatus, approved: 1, approvedBY, approvedAt: new Date(), reject: 1 } },
                    { new: true }
                );
            }
            else if (ApprovedStatus.socialCategory?.status === 'false' || ApprovedStatus.smartCard?.status === 'false'
                || ApprovedStatus.memberDetail?.status === 'false' || ApprovedStatus.contact?.status === 'false') {
                const filteredData = updatedData
                const fieldsToRemove = ['isDeleted', 'SHGId', 'MemberId', 'is_active', 'createdAt', 'updatedAt', 'approved', 'is_completed', 'update', 'reject', 'is_ActiveApproved', 'updateCount', 'ApprovedStatus'];
                let updatedlist = {}
                const AADHAR = { AADHAR: '' };
                const contact = { contact: '' };
                const smartCard = { smartCard: '' };
                const memberDetail = {
                    fatherName: "",
                    memberAge: "",
                    DOB: "",
                    gender: "",
                    religion: "",
                    community: "",
                    vulnerableCategory: "",
                    role: "",
                    PAN: "",
                    isVRFReceived: "",
                    VRFAmount: "",
                    monthlySavings: "",
                    education: "",
                };
                const socialcatagory = {
                    PIP: "",
                    PIPCategory: "",
                    annualIncome: "",
                    isESharm: "",
                    MSMERegNumber: "",
                    islivelihood: "",
                    occupation: "",
                    workerCode: "",
                };
                const bankDetail = {
                    IFSC: "",
                    bankName: "",
                    accountNumber: "",
                    branchName: "",
                    accountType: "",
                    accountStatus: "",
                };
                for (const field in ApprovedStatus) {
                    if (field === 'socialCategory' && ApprovedStatus.socialCategory.status === 'true') {
                        for (const key in socialcatagory) {
                            socialcatagory[key] = updatedData[key];
                        }
                        const filteredObject = Object.fromEntries(
                            Object.entries(socialcatagory).filter(([key, value]) => value !== undefined)
                        );

                        Object.assign(updatedlist, socialcatagory);
                    }
                    else if (field === 'smartCard' && ApprovedStatus.smartCard.status === 'true') {
                        for (const key in smartCard) {
                            smartCard[key] = updatedData[key];
                        }
                        const filteredObject = Object.fromEntries(
                            Object.entries(smartCard).filter(([key, value]) => value !== undefined)
                        );
                        Object.assign(updatedlist, smartCard);
                    }
                    else if (field === 'memberDetail' && ApprovedStatus.memberDetail?.status === 'false') {
                        for (const key in memberDetail) {
                            memberDetail[key] = updatedData[key];
                        }
                        const filteredObject = Object.fromEntries(
                            Object.entries(memberDetail).filter(([key, value]) => value !== undefined)
                        );
                        Object.assign(updatedlist, memberDetail);
                    }
                    else if (field === 'contact' && ApprovedStatus.contact?.status === 'false') {
                        for (const key in contact) {
                            contact[key] = updatedData[key];
                        }
                        const filteredObject = Object.fromEntries(
                            Object.entries(contact).filter(([key, value]) => value !== undefined)
                        );
                        Object.assign(updatedlist, contact);
                    }

                    else if (field === 'AADHAR' && ApprovedStatus.AADHAR?.status === 'false') {
                        for (const key in AADHAR) {
                            contact[key] = updatedData[key];
                        }
                        const filteredObject = Object.fromEntries(
                            Object.entries(AADHAR).filter(([key, value]) => value !== undefined)
                        );
                        Object.assign(updatedlist, AADHAR);
                    } else if (field === 'bankDetail' && ApprovedStatus.bankDetail?.status === 'false') {
                        for (const key in bankDetail) {
                            contact[key] = updatedData[key];
                        }
                        const filteredObject = Object.fromEntries(
                            Object.entries(bankDetail).filter(([key, value]) => value !== undefined)
                        );
                        Object.assign(updatedlist, bankDetail);
                    }

                }
                update2 = await model.findOneAndUpdate(
                    { MemberId },
                    { $set: { ...updatedlist, approved: 1, reject: 0, approvedBY, approvedAt: new Date(), ApprovedStatus } },
                    { new: true }
                );

                update1 = await shgPendingModel.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { ApprovedStatus, approved: 1, approvedBY, approvedAt: new Date() } },
                    { new: true }
                );
                updatedData.ApprovedStatus = ApprovedStatus;
            }
        }

        return res.status(200).json({ status: true, message, data: { update1, update2 } });
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: `Error updating SHG data: ${error.message}`,
        });
    }
};
// check what value tru update that feild

const Acceptnewusershgmember = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgMemberSchema, "SHGMemberPending");
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const SHGId = Number(req.body.SHGId);
        const MemberId = Number(req.body.MemberId);

        const updatedData = {}
        updatedData.approved = 1;
        updatedData.approvedBY = req.body.approvedBY;
        updatedData.approvedAt = new Date();
        const filter = { SHGId, MemberId };
        const update = { $set: { ...updatedData } };
        const updateResult = await model.updateOne({ ...filter }, { ...update });
        const updateResult1 = await shgPendingModel.updateOne({ ...filter }, { ...update });
        if (updateResult.nModified === 0) {
            return res.status(404).send({ status: false, error: `No existing document found to update with SHGId ${SHGId}` });
        }
        return res.status(200).send({ status: true, data: updatedData, message: "SHG data updated in shgMapTest successfully" });
    } catch (e) {
        return res.status(500).send({ status: false, error: `Error updating SHG data: ${e.message}` });
    }
};

const rejectshgmember = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgMemberSchema, "SHGMemberPending");
        const modelSHGMember = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const SHGId = Number(req.body.SHGId);
        const MemberId = Number(req.body.MemberId);

        const rejectionSummary = req.body.rejectionSummary;
        const approvedBy = req.body.approvedBy;
        const approved = 1;
        const approvedAt = new Date()
        await shgPendingModel.updateOne({ SHGId, MemberId }, { $set: { reject: 1, approvedBy, approved, approvedAt, rejectionSummary } });
        await modelSHGMember.updateOne({ SHGId, MemberId }, { $set: { reject: 1, approvedBy, approved, approvedAt, rejectionSummary } });
        return res.status(200).send({ status: true, message: "SHG rejected successfully, and the rejection summary is added to shgMapTest" });
    } catch (e) {
        return res.status(500).send({ status: false, error: `Error updating SHG data: ${e.message}` });
    }
};
async function generateShgCode() {
    const connection = await pool.getConnection();
    try {
        console.log("shgCode");
        // Get last inserted ID
        const [rows] = await connection.query('SELECT shg_code FROM shg ORDER BY id DESC LIMIT 1');
        
        console.log(rows.length);
        const lastId = 0;
        if (rows.length > 0) {
            const lastId = rows[0].shg_code || 0;
        }
        connection.release();
        // console.log(rows[0].shg_code);
        // console.log("shgCode");
        // console.log(lastId);
        // Generate SHG code based on last ID + 1 or current timestamp
        const shgCode = parseInt(lastId) > 0 ? (parseInt(lastId) + 1).toString().padStart(6, '0') : Math.floor(Date.now() / 1000).toString();
        return shgCode;
    } catch (error) {
        console.error('Error generating SHG code:', error);
        throw error;
    } 
}
function convertDateFormat(dateString) {
    var parts = dateString.split('-');
    var newDateFormat = parts[2] + '-' + parts[1] + '-' + parts[0];
    return newDateFormat;
}
const inCompletedShg = async (req, res) => {
    try {
        const data = req.body;
        // console.log(data);
        // return true;
        const request_data = {};
        // Filter out empty fields
        const filteredData = Object.keys(data).reduce((filtered, key) => {
            if (data[key] !== "") {
                filtered[key] = data[key];
            }
            return filtered;
        }, {});
        console.log(filteredData);
        console.log("filteredData filteredData filteredData filteredData filteredData filteredData filteredData filteredDatafilteredDatafilteredData filteredDatafilteredDatafilteredDatafilteredDatafilteredDatafilteredData ");
        // Additional formatting
        request_data.district = filteredData.district.toUpperCase();
        request_data.block = filteredData.block.toUpperCase();
        request_data.panchayat = filteredData.panchayat.toUpperCase();
        request_data.habitation = filteredData.habitation.toUpperCase();

        // Date fields
        request_data.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        request_data.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        console.log("data data data data data data data data dayta");
        // Default values
        // request_data.shg_id = data.SHGId.value;
        // request_data.member_id = data.SHGId.value;
        console.log("data data data data data data data data dayta");
        // Mapping specific fields
        request_data.projects = JSON.stringify(data.projectsInSHGAreas);
        request_data.shg_name = filteredData.SHGName;
        request_data.shg_activity = filteredData.shg_activity;

        // Mapping optional fields
        if (filteredData.formationDate !== undefined) {
            request_data.formation_date = filteredData.formationDate;
        }
        if (filteredData.formedBy !== undefined) {
            request_data.formed_by = filteredData.formedBy;
        }
        if (filteredData.category !== undefined) {
            request_data.category = filteredData.category;
        }
        if (filteredData.monitoredBy !== undefined) {
            request_data.monitored_by = filteredData.monitoredBy;
        }
        if (filteredData.specialCategory !== undefined) {
            request_data.special_category = filteredData.specialCategory;
        }
        if (filteredData.meetingFrequency !== undefined) {
            request_data.meeting_frequency = filteredData.meetingFrequency;
        }
        // Handle PLF fields
        if (filteredData.PLF !== "") {
            request_data.plf_federated = filteredData.PLF.shgFederated;
            if (filteredData.PLF.dateAffiliated !== "") {
                request_data.plf_affiliated_date = filteredData.PLF.dateAffiliated;
            }
            if (filteredData.PLF.amountOfAnnualSubscription !== "") {
                request_data.plf_annual_subscription = filteredData.PLF.amountOfAnnualSubscription;
            }
            if (filteredData.PLF.dateOfLastSubscription !== "") {
                request_data.last_subs_date = filteredData.PLF.dateOfLastSubscription;
            }
        }
        request_data.grading = 0;
        request_data.grading_category = null;
        request_data.grading_date = null;
        request_data.rf_received = 0;
        request_data.rf_amount = 0;
        request_data.rf_date = null;
        request_data.economic_received = 0;
        request_data.economic_date = null;
        request_data.cif_received = 0;
        request_data.cif_amount = null;
        request_data.cif_date = null;
        request_data.asf_received = 0;
        request_data.asf_amount = 0;
        request_data.asf_date = null;
        request_data.cap_received = 0;
        request_data.cap_amount = 0;
        request_data.cap_date = null;
        request_data.bulk_received = 0;
        request_data.bulk_amount = 0;
        request_data.bulk_balace_loan = 0;
        request_data.plf_federated = 0;
        request_data.plf_affiliated_date = null;
        request_data.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        request_data.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        console.log("data data data data data data data data dayta");
        // Handle savings fields
        if (filteredData.SHGSavings.memberSaving !== "") {
            request_data.member_savings_per_month = filteredData.SHGSavings.memberSaving;
        }
        if (filteredData.SHGSavings.shgSaving !== "") {
            request_data.shg_savings_per_month = filteredData.SHGSavings.shgSaving;
        }
        if (filteredData.SHGSavings.totalSaving !== "") {
            request_data.total_savings = filteredData.SHGSavings.totalSaving;
        }
        if (filteredData.grading.grading !== "") {
            if (filteredData.grading.grading == "yes") {
                request_data.grading = 1;
            }
        }
        if (filteredData.grading.category !== "") {
            request_data.grading_category = filteredData.grading.category;
        }
        if (filteredData.grading.date !== "") {
            request_data.grading_date = filteredData.grading.date;
        }
        // if (filteredData.economicAssistance.received !== "") {
        // if(filteredData.economicAssistance.received == "yes")
        // {
        if (filteredData.economicAssistance.date !== "") {
            request_data.economic_received = 1;
            request_data.economic_amount = filteredData.economicAssistance.amount;
            request_data.economic_date = filteredData.economicAssistance.date;
        }

        // } 
        // }
        // if (filteredData.rf.received !== "") {
        // if(filteredData.rf.received == "yes")
        // {
        if (filteredData.rf.date !== "") {
            request_data.rf_received = 1;
            request_data.rf_amount = filteredData.rf.amount;
            request_data.rf_date = filteredData.rf.date;
        }

        // } 
        // }

        // if (filteredData.asf.received !== "") {
        // if(filteredData.asf.received == "yes")
        // {
        if (filteredData.asf.amount !== "") {
            request_data.asf_received = 1;
            request_data.asf_amount = filteredData.asf.amount;
            request_data.asf_date = filteredData.asf.date;
            // }

        }
        // }

        // if (filteredData.cap.received !== "") {
        // if(filteredData.cap.received == "yes")
        // {
        if (filteredData.cap.amount !== "" && filteredData.cap.date !== "") {
            request_data.cap_amount = filteredData.cap.amount;
            request_data.cap_date = filteredData.cap.date;
            request_data.cap_received = 1;
        }
        // } 
        // }

        // if (filteredData.bulkLoan.received !== "") {
        // if(filteredData.bulkLoan.received == "yes")
        // {
        if (filteredData.bulkLoan.amount !== "") {
            request_data.bulk_received = 1;
            request_data.bulk_amount = filteredData.bulkLoan.amount;
            request_data.bulk_balanceLoan = filteredData.bulkLoan.balanceLoan;
            request_data.bulk_date = filteredData.bulkLoan.date;
        }

        // }  
        // } 
        // if (filteredData.cif.received !== "") {
        // if(filteredData.cif.received == "yes")
        // {
        if (filteredData.cif.amount !== "" && filteredData.cif.date !== "") {
            request_data.cif_received = 1;
            request_data.cif_amount = filteredData.cif.amount;
            request_data.cif_date = filteredData.cif.date;
        }

        // }  
        // } 
        console.log(filteredData.cif.received);
        console.log(filteredData.cif.amount);
        console.log(filteredData.cif.date);
        // var shg_id = filteredData.villagecode;
        // Generate SHG code
        const shgCode = await generateShgCode();
        var village_data = `SELECT * FROM shg WHERE shg.panchayatcode = '${filteredData.villagecode}'  ORDER BY shg.id DESC LIMIT 1`;
        const [village_datas] = await pool.execute(village_data);
        var newPanchayatCode;

        if (village_datas.length === 0) {
            console.log('No records found. Starting with default code.');
            lastNumber = 1;
            newPanchayatCode = formatCode(filteredData.blockcodes, lastNumber);
            shg_ids = `${filteredData.villagecode}0001`;
            console.log(currentCode);
        } else {
            // If records are found, extract the last four digits and increment
            var currentCode = village_datas[0].shg_code;
            var lastFourDigits = currentCode.slice(-4);
            console.log(lastFourDigits);
            var incrementedNumber = parseInt(lastFourDigits, 10) + 1;
            var incrementedCode = incrementedNumber.toString().padStart(4, '0');
            // Construct the new panchayat code
            newPanchayatCode = currentCode.slice(0, -4) + incrementedCode;
            shg_ids = `${village_datas[0].panchayatcode}${incrementedCode}`;
            console.log(newPanchayatCode);
        }

        // console.log(currentCode);
        // console.log("currentCode currentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCodecurrentCode");
        // console.log(filteredData.villagecode);
        request_data.villagecode = filteredData.villagecode;
        request_data.shg_code = newPanchayatCode;
        // console.log("request_data.grading"); 
        // console.log(request_data.grading_date);
        console.log(request_data);
        console.log(filteredData.shg_id);
        console.log("request_data");
        console.log("request_data");
        console.log("request_data");
        console.log("request_data");
        console.log("request_data");
        console.log("request_data");
        console.log("request_data");
        console.log("request_data");
        console.log("request_data");
        console.log("request_data");
        console.log("reque st_data ");
        if (filteredData.shg_id) {
            const delete_query = `DELETE FROM shg_bank_details WHERE shg_id = ?`;
            try {
                const [result] = await pool.execute(delete_query, [filteredData.shg_id]);
                console.log("Delete result:", result);
            } catch (error) {
                console.error("Error executing delete query:", error);
            }
            const updateQuery = `
                UPDATE shg 
                SET 
                    district = ?, 
                    block = ?, 
                    panchayat = ?, 
                    habitation = ?, 
                    panchayatcode = ?, 
                    updated_at = ?, 
                    approved = ?,  
                    shg_name = ?, 
                    projects = ?, 
                    formation_date = ?, 
                    formed_by = ?, 
                    plf_federated = ?, 
                    plf_affiliated_date = ?, 
                    plf_annual_subscription = ?, 
                    last_subs_date = ?, 
                    meeting_frequency = ?, 
                    member_savings_per_month = ?, 
                    shg_savings_per_month = ?, 
                    total_savings = ?, 
                    category = ?, 
                    special_category = ?, 
                    monitored_by = ?, 
                    grading = ?, 
                    grading_category = ?, 
                    grading_date = ?, 
                    rf_received = ?, 
                    rf_amount = ?, 
                    rf_date = ?, 
                    asf_received = ?, 
                    asf_amount = ?, 
                    asf_date = ?,
                    cap_received = ?, 
                    cap_amount = ?, 
                    cap_date = ?, 
                    bulk_received = ?, 
                    bulk_amount = ?, 
                    bulk_balanceLoan = ?, 
                    bulk_date = ?, 
                    cif_received = ?, 
                    cif_amount = ?, 
                    cif_date = ?, 
                    shg_activity = ?, 
                    economic_received = ?, 
                    economic_amount = ?, 
                    economic_date = ? 
                WHERE id = ?`;

            result = await pool.execute(updateQuery, [
                request_data.district,
                request_data.block,
                request_data.panchayat,
                request_data.habitation,
                request_data.villagecode,
                request_data.updated_at,
                request_data.approved || 0,
                request_data.shg_name || null,
                request_data.projects || null,
                request_data.formation_date || null,
                request_data.formed_by || null,
                request_data.plf_federated || 0,
                request_data.plf_affiliated_date || null,
                request_data.plf_annual_subscription || 0,
                request_data.last_subs_date || null,
                request_data.meeting_frequency || null,
                request_data.member_savings_per_month || 0,
                request_data.shg_savings_per_month || 0,
                request_data.total_savings || 0,
                request_data.category || null,
                request_data.special_category || null,
                request_data.monitored_by || null,
                request_data.grading || null,
                request_data.grading_category || null,
                request_data.grading_date || null,
                request_data.rf_received || 0,
                request_data.rf_amount || null,
                request_data.rf_date || null,
                request_data.asf_received || 0,
                request_data.asf_amount || 0,
                request_data.asf_date || null,
                request_data.cap_received || 0,
                request_data.cap_amount || 0,
                request_data.cap_date || null,
                request_data.bulk_received || 0,
                request_data.bulk_amount || 0,
                request_data.bulk_balanceLoan || 0,
                request_data.bulk_date || null,
                request_data.cif_received || 0,
                request_data.cif_amount || 0,
                request_data.cif_date || null,
                request_data.shg_activity || null,
                request_data.economic_received || 0,
                request_data.economic_amount || null,
                request_data.economic_date || null,
                filteredData.shg_id
            ]);
            console.log("result result result result result resultresultresult resultresultresultresultresult");
            console.log(result);
            var shg_id = filteredData.shg_id;


            /* Delete Bank Linkage datas  */

            const delete_query1 = `DELETE FROM shg_linkage WHERE shg_id = ?`;
            try {
                const [result] = await pool.execute(delete_query1, [filteredData.shg_id]);
                console.log("Delete result:", result);
            } catch (error) {
                console.error("Error executing delete query:", error);
            }


            if (filteredData.bankLinkageRows !== undefined) {
                const areFieldsValid = Object.values(filteredData.bankLinkageRows).every(value => value !== ''); 
                console.log(filteredData.bankLinkageRows.bank);
                if (areFieldsValid) {


                    var queryString21 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${filteredData.bankLinkageRows.bank}'`;
                    const [bankLinkageRowsresult] = await pool.execute(queryString21);
                    console.log(bankLinkageRowsresult);
                    if (bankLinkageRowsresult.length > 0) {
                        const document11 = {
                            bank_id: bankLinkageRowsresult[0].id,
                            shg_id: shg_id,
                            loan_type: filteredData.bankLinkageRows.loanType,
                            loan_disbursement_date: filteredData.bankLinkageRows.date,
                            amount: filteredData.bankLinkageRows.amount,
                            loan_Account_number: filteredData.bankLinkageRows.loanAcNumber,
                            roi: filteredData.bankLinkageRows.roi,
                            tenure: filteredData.bankLinkageRows.tenure,
                            balance: filteredData.bankLinkageRows.balance,
                            linkage: filteredData.bankLinkageRows.dosage,
                            closing_date: filteredData.bankLinkageRows.closingDate,
                            created_at: request_data.created_at,
                            updated_at: request_data.updated_at,
                        };
                        // console.log(document2);
                        const shg_bank_details1 = 'INSERT INTO shg_linkage (shg_id,loan_type, loan_disbursement_date, amount, bank_id, loan_Account_number, roi, tenure,balance,closing_date,linkage,created_at,updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?)';
                        const results12 = await pool.execute(shg_bank_details1, [
                            document11.shg_id,
                            document11.loan_type,
                            document11.loan_disbursement_date,
                            document11.amount,
                            document11.bank_id,
                            document11.loan_Account_number,
                            document11.roi,
                            document11.tenure,
                            document11.balance,
                            document11.closing_date,
                            document11.linkage,
                            document11.created_at,
                            document11.updated_at,
                        ]);


                    }
                }
            }

            if (filteredData.bankLinkageRows1 !== undefined) {
                const areFieldsValid1 = Object.values(filteredData.bankLinkageRows1).every(value => value !== '');
                if (areFieldsValid1) {
                    var queryString20 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${filteredData.bankLinkageRows1.bank}'`;
                    const [bankLinkageRowsresult1] = await pool.execute(queryString20);
                    if (bankLinkageRowsresult1.length > 0) {
                        const bank_linkage_document = {
                            bank_id: bankLinkageRowsresult1[0].id,
                            shg_id: shg_id,
                            loan_type: filteredData.bankLinkageRows1.loanType,
                            loan_disbursement_date: filteredData.bankLinkageRows1.date,
                            amount: filteredData.bankLinkageRows1.amount,
                            loan_Account_number: filteredData.bankLinkageRows1.loanAcNumber,
                            roi: filteredData.bankLinkageRows1.roi,
                            tenure: filteredData.bankLinkageRows1.tenure,
                            balance: filteredData.bankLinkageRows1.balance,
                            linkage: filteredData.bankLinkageRows1.dosage,
                            closing_date: filteredData.bankLinkageRows1.closingDate,
                            created_at: request_data.created_at,
                            updated_at: request_data.updated_at,
                        };
                        // console.log(document2);
                        const shg_bank_details12 = 'INSERT INTO shg_linkage (shg_id,loan_type, loan_disbursement_date, amount, bank_id, loan_Account_number, roi, tenure,balance,closing_date,linkage,created_at,updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?)';
                        const bank_linkage_document_result11 = await pool.execute(shg_bank_details12, [
                            bank_linkage_document.shg_id,
                            bank_linkage_document.loan_type,
                            bank_linkage_document.loan_disbursement_date,
                            bank_linkage_document.amount,
                            bank_linkage_document.bank_id,
                            bank_linkage_document.loan_Account_number,
                            bank_linkage_document.roi,
                            bank_linkage_document.tenure,
                            bank_linkage_document.balance,
                            bank_linkage_document.closing_date,
                            bank_linkage_document.linkage,
                            bank_linkage_document.created_at,
                            bank_linkage_document.updated_at,
                        ]);

                    }
                }
            }


            if (filteredData.bankLinkageRows2 !== undefined) {
                const areFieldsValid1 = Object.values(filteredData.bankLinkageRows2).every(value => value !== '');
                if (areFieldsValid1) {
                    var queryString20 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${filteredData.bankLinkageRows2.bank}'`;
                    const [bankLinkageRowsresult2] = await pool.execute(queryString20);
                    if (bankLinkageRowsresult2.length > 0) {
                        const bank_linkage_document = {
                            bank_id: bankLinkageRowsresult2[0].id,
                            shg_id: shg_id,
                            loan_type: filteredData.bankLinkageRows2.loanType,
                            loan_disbursement_date: filteredData.bankLinkageRows2.date,
                            amount: filteredData.bankLinkageRows2.amount,
                            loan_Account_number: filteredData.bankLinkageRows2.loanAcNumber,
                            roi: filteredData.bankLinkageRows2.roi,
                            tenure: filteredData.bankLinkageRows2.tenure,
                            balance: filteredData.bankLinkageRows2.balance,
                            linkage: filteredData.bankLinkageRows2.dosage,
                            closing_date: filteredData.bankLinkageRows2.closingDate,
                            created_at: request_data.created_at,
                            updated_at: request_data.updated_at,
                        };
                        // console.log(document2);
                        const shg_bank_details13 = 'INSERT INTO shg_linkage (shg_id,loan_type, loan_disbursement_date, amount, bank_id, loan_Account_number, roi, tenure,balance,closing_date,linkage,created_at,updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?)';
                        const bank_linkage_document_result = await pool.execute(shg_bank_details13, [
                            bank_linkage_document.shg_id,
                            bank_linkage_document.loan_type,
                            bank_linkage_document.loan_disbursement_date,
                            bank_linkage_document.amount,
                            bank_linkage_document.bank_id,
                            bank_linkage_document.loan_Account_number,
                            bank_linkage_document.roi,
                            bank_linkage_document.tenure,
                            bank_linkage_document.balance,
                            bank_linkage_document.closing_date,
                            bank_linkage_document.linkage,
                            bank_linkage_document.created_at,
                            bank_linkage_document.updated_at,
                        ]);
                    }
                }
            }

        }
        else {
            // Insert into database
            const connection = await pool.getConnection();
            const query = 'INSERT INTO shg (district, block, panchayat, habitation,panchayatcode, created_at, updated_at, approved, shg_code,shg_id, shg_name, projects,formation_date, formed_by, plf_federated, plf_affiliated_date, plf_annual_subscription, last_subs_date, meeting_frequency, member_savings_per_month, shg_savings_per_month, total_savings,category,special_category, monitored_by,grading,grading_category,grading_date,rf_received,rf_date,asf_received,asf_amount,cap_received,cap_amount,cap_date,bulk_received,bulk_amount,bulk_balanceLoan,cif_received,cif_amount,cif_date,shg_activity,economic_received,economic_date,bulk_date,asf_date,rf_amount,economic_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
            result = await pool.execute(query, [
                request_data.district,
                request_data.block,
                request_data.panchayat,
                request_data.habitation,
                request_data.villagecode,
                request_data.created_at,
                request_data.updated_at,
                0,
                request_data.shg_code || null,
                shg_ids,
                request_data.shg_name || null,
                request_data.projects || null,
                request_data.formation_date || null,
                request_data.formed_by || null,
                request_data.plf_federated || 0,
                request_data.plf_affiliated_date || null,
                request_data.plf_annual_subscription || 0,
                request_data.last_subs_date || null,
                request_data.meeting_frequency || null,
                request_data.member_savings_per_month || 0,
                request_data.shg_savings_per_month || 0,
                request_data.total_savings || 0,
                request_data.category || null,
                request_data.special_category || null,
                request_data.monitored_by || null,
                request_data.grading,
                request_data.grading_category,
                request_data.grading_date || null,
                request_data.rf_received,
                request_data.rf_date || null,
                request_data.asf_received,
                request_data.asf_amount,
                request_data.cap_received,
                request_data.cap_amount,
                request_data.cap_date || null,
                request_data.bulk_received,
                request_data.bulk_amount,
                request_data.bulk_balace_loan,
                request_data.cif_received,
                request_data.cif_amount,
                request_data.cif_date || null,
                request_data.shg_activity,
                request_data.economic_received,
                request_data.economic_date || null,
                request_data.bulk_date || null,
                request_data.asf_date || null,
                request_data.rf_amount || 0,
                request_data.economic_amount || 0,

            ]);
            var shg_id = result[0].insertId;
            console.log(shg_id);
            console.log("Ranjithhhhhhhhhhhhhhhhhhhhhhhhhhh");
            console.log("testttttttttttttttttttttt");
        }
        console.log(shg_id);
        console.log("shg_id-------===================");
        var queryString1 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${filteredData.bankDetails.IFSC}' `;
        const [bank_results, fields1] = await pool.execute(queryString1);

        console.log(shg_id);
        console.log("shg_id-------===================");
        var loan_account = false;
        if (bank_results.length > 0) {
            const document1 = {
                bank_id: bank_results[0].id,
                shg_id: shg_id,
                ifsc: bank_results[0].ifsc_code,
                bank_name: bank_results[0].bank_name,
                account_number: filteredData.bankDetails.accountNumber,
                branch_name: filteredData.bankDetails.branchName,
                account_type: filteredData.bankDetails.accountType,
                account_opening_date: filteredData.bankDetails.accountOpeningDate,
                accountStatus: filteredData.bankDetails.accountStatus,
            };
            if (filteredData.bankDetails.accountType != "Savings") {
                loan_account = true;
            }
            console.log(document1);
            const shg_bank_details = 'INSERT INTO shg_bank_details (bank_id, shg_id, ifsc, bank_name, account_number, branch_name, account_type,account_opening_date,account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)';
            const result1 = await pool.execute(shg_bank_details, [
                document1.bank_id,
                document1.shg_id,
                document1.ifsc,
                document1.bank_name,
                document1.account_number,
                document1.branch_name,
                document1.account_type,
                document1.account_opening_date,
                document1.accountStatus,
            ]);
        }
        if (filteredData.bankDetails1 !== undefined) {
            var queryString2 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${filteredData.bankDetails1.IFSC}'`;
            const [bank_results1] = await pool.execute(queryString2);
            if (filteredData.bankDetails1.accountType != "Savings") {
                loan_account = true;
            }
            if (bank_results1.length > 0) {
                const document2 = {
                    bank_id: bank_results1[0].id,
                    shg_id: shg_id,
                    ifsc: bank_results1[0].ifsc_code,
                    bank_name: bank_results1[0].bank_name,
                    account_number: filteredData.bankDetails1.accountNumber,
                    branch_name: filteredData.bankDetails1.branchName,
                    account_type: filteredData.bankDetails1.accountType,
                    account_opening_date: filteredData.bankDetails1.accountOpeningDate,
                    accountStatus: filteredData.bankDetails1.accountStatus,
                };
                console.log(document2);
                const shg_bank_details1 = 'INSERT INTO shg_bank_details (bank_id, shg_id, ifsc, bank_name, account_number, branch_name, account_type,account_opening_date,account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)';
                const result12 = await pool.execute(shg_bank_details1, [
                    document2.bank_id,
                    document2.shg_id,
                    document2.ifsc,
                    document2.bank_name,
                    document2.account_number,
                    document2.branch_name,
                    document2.account_type,
                    document2.account_opening_date,
                    document2.accountStatus,
                ]);
            }
        }

        if (filteredData.bankDetails2 !== undefined) {
            var queryString3 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${filteredData.bankDetails2.IFSC}'`;
            const [bank_results2] = await pool.execute(queryString3);
            if (filteredData.bankDetails2.accountType != "Savings") {
                loan_account = true;
            }
            if (bank_results2.length > 0) {
                const document3 = {
                    bank_id: bank_results2[0].id,
                    shg_id: shg_id,
                    ifsc: bank_results2[0].ifsc_code,
                    bank_name: bank_results2[0].bank_name,
                    account_number: filteredData.bankDetails2.accountNumber,
                    branch_name: filteredData.bankDetails2.branchName,
                    account_type: filteredData.bankDetails2.accountType,
                    account_opening_date: filteredData.bankDetails2.accountOpeningDate,
                    accountStatus: filteredData.bankDetails2.accountStatus,
                };
                console.log(document3);
                const shg_bank_details2 = 'INSERT INTO shg_bank_details (bank_id, shg_id, ifsc, bank_name, account_number, branch_name, account_type,account_opening_date,account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)';
                const result13 = await pool.execute(shg_bank_details2, [
                    document3.bank_id,
                    document3.shg_id,
                    document3.ifsc,
                    document3.bank_name,
                    document3.account_number,
                    document3.branch_name,
                    document3.account_type,
                    document3.account_opening_date,
                    document3.accountStatus,
                ]);
            }
        }


        var response_data = {
            shg_code: newPanchayatCode,
            shg_id: shg_ids,
            id: shg_id,
            loan_account: loan_account
        }
        if (loan_account) {
            var bank_linkage_dat = `SELECT * FROM shg_bank_details WHERE shg_id='${shg_id}' and account_type !='Savings'`;
            const [bank_linkage_dats] = await pool.execute(bank_linkage_dat);
            response_data.bank_data = bank_linkage_dats;
        }
        return res.status(200).json({ status: true, response: response_data });
    } catch (e) {
        console.error(`Invalid Query err: ${e.message}`);
        return res.status(400).json({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};
// Function to format the code
function formatCode(codes, lastNumber) {
    console.log(codes);
    // Extract the first three letters of the panchayat, removing any special characters
    const panchayatFormatted = codes.panchayat.slice(0, 3).replace(/[^a-zA-Z]/g, '');
    const panchayatAbbreviation = panchayatFormatted.toUpperCase();

    // Format the last number as a four-digit string, padded with zeros
    const lastNumberFormatted = lastNumber.toString().padStart(4, '0');

    // Merge all parts into the final format
    const formattedCode = `${codes.district}${codes.block}${panchayatAbbreviation}${codes.habitation}${lastNumberFormatted}`;

    return formattedCode;
}

// get incomplete shgid
const getinCompletedSHGmember = async (req, res) => {
    try {
        var { district, block, panchayat, habitation, limit, skip, id } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var queryString = `
        SELECT *
        FROM shg_members INNER JOIN shg on shg.id = shg_members.shg_id
        WHERE shg.id = ${id}
        ORDER BY shg_members.created_at DESC, shg_members.id DESC
        LIMIT ${limit}
        OFFSET ${skip};
        `;
        const connection = await pool.getConnection();
        const [data] = await connection.query(queryString);
        console.log(data);
        connection.release();
        console.log("rows datadfhdshf  hsdbfhsdf hbsdfhsdnf hsbdfh snf hshdbfhsnd f");
        if (data.length <= 0) {
            return handleInvalidQuery(
                res,
                "No SHG Members Found"
            );
        }
        res.set("SHG-Total-Count", data.length);
        res.send(data);
    } catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
    // if (data.length > 0) {
    //     res.set("SHG-Total-Count", count);
    //     return res.send({
    //         status: true,
    //         count: count,
    //         data: data,
    //     });
    // } else {
    //     return res.send({
    //         status: true,
    //         count: 0,
    //         data: [],
    //     });
    // }
};

const getincompletedShg = async (req, res) => {
    try {
        const model = mongo.conn.model("incompleted", shgSchemaInComplete, "IncompleteShg");
        const model2 = mongo.conn.model("incompletedMember", inCompleteshgMemberSchema, "IncompletedMember")
        const Id = req.params.Id;
        const shgDocument = await model.findOne({ Id });
        const memberDocument = await model2.find({ Id });

        if (!shgDocument) {
            return res.status(404).json({ message: "SHG not found" });
        }

        return res.status(200).json({ shgDocument, memberDocument });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


const getInactiveLists = async (req, res) => {
    console.log("teststttttttttttttttttttttttttttttttttt ttttttttttttttttttttttttttttttt tttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt");
    try {
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var queryString = `
        SELECT *
        FROM shg
        WHERE reject = 2
          ${district ? `AND district LIKE '%${district}%'` : ''}
          ${block ? `AND block LIKE '%${block}%'` : ''}
          ${panchayat ? `AND panchayat LIKE '%${panchayat}%'` : ''} 
          ${habitation ? `AND habitation LIKE '%${habitation}%'` : ''} 
        ORDER BY created_at DESC, id DESC
        LIMIT ${limit}
        OFFSET ${skip};
        `;
        const connection = await pool.getConnection();
        const [data] = await connection.query(queryString);
        connection.release();
        console.log(data);
        console.log("rows datadfhdshf  hsdbfhsdf hbsdfhsdnf hsbdfh snf hshdbfhsnd f");
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
}

const getincompletedShgList = async (req, res) => {
    try {
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var queryString = `
        SELECT *
        FROM shg
        WHERE approved = 0 AND is_completed = 0 
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
        const [data] = await connection.query(queryString);
        connection.release();
        console.log(data);
        console.log("rows datadfhdshf  hsdbfhsdf hbsdfhsdnf hsbdfh snf hshdbfhsnd f");
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
}

const updateInCompletedShg = async (req, res) => {
    try {
        const model = mongo.conn.model("incompleted", shgSchemaInComplete, "IncompleteShg");
        const data = req.body;
        const { Id } = data;
        if (!Id) {
            return handleInvalidQuery(res, "SHGId is required")
        }
        const result = await model.findOneAndUpdate({ Id }, data, { new: true });
        if (!result) {
            return handleInvalidQuery(res, "No SHG found with given Id")
        }
        return res.status(200).send({ success: true, result })
    } catch (e) {
        return res.status(400).send({ success: false, error: `Invalid Query err: ${e.message}` })
    }
}
// get shgmember list approved 0
const getlistMember = async (req, res) => {

    try {
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        // var queryString = `
        //     SELECT shg_member.*,shg.name,shg.panchayat,shg.habitation,shg.block
        //     FROM shg_member INNER JOIN shg ON shg.id = shg_member.shg_id
        //     WHERE  
        //       ${district ? `shg.district LIKE '%${district}%'` : ''}
        //       ${block ? `AND shg.block LIKE '%${block}%'` : ''}
        //       ${panchayat ? `AND shg.panchayat LIKE '%${panchayat}%'` : ''} 
        //       ${habitation ? `AND shg.habitation LIKE '%${habitation}%'` : ''} 
        //     ORDER BY shg_member.created_at DESC
        //     LIMIT ${limit}
        //     OFFSET ${skip};
        //     `;
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
        ORDER BY shg_members.created_at DESC
        LIMIT ${limit}
        OFFSET ${skip};
        `;

        // Now queryString will be correctly formatted regardless of which filters are applied

        const connection = await pool.getConnection();
        const [data] = await connection.query(queryString);
        console.log(data);
        connection.release();
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
    // if (data.length > 0) {
    //     res.set("SHG-Total-Count", count);
    //     return res.send({
    //         status: true,
    //         count: count,
    //         data: data,
    //     });
    // } else {
    //     return res.send({
    //         status: true,
    //         count: 0,
    //         data: [],
    //     });
    // }


};

const getUpdatedshgmember = async (req, res) => { 
        var bank_id = req.query.bank_id;
        const queryString = `Select shg.*,shg_members.* from shg_members INNER JOIN shg ON shg.id = shg_members.shg_id where shg_members.id=${req.query.MemberId}`;
        try {
            const [results] = await pool.execute(queryString);
        
        // const modelMapTest = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        // const modelPending = mongo.conn.model("UpdateData", updateShgMemberSchema, "SHGMemberPending");
        const MemberId = Number(req.query.MemberId);
        // const mapTestDataApproved0Update0 = await modelMapTest.find({
        //     MemberId: MemberId,
        //     updateCount: 0,
        // });
        // const mapTestDataApproved0UpdateGT0Pending = await modelPending.find({
        //     MemberId: MemberId,
        //     approved: 0,
        // });
        const result = {
            MemberId: MemberId,
            updated: true,
            data: results[0],
            newData: results[0],
        };
        res.json({ status: true, data:result  });
    } catch (e) {
        res.status(500).json({ status: false, error: `Invalid Query err: ${e.message}`  });
    }
};

// reject list shg
const getrejectListShg = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, is_active: 1, approved: 1, is_ActiveApproved: 1, is_ActiveReject: 1 };
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
// reject list shgmember
const getrejectListShgmember = async (req, res) => {
    try {
        var queryString1 = `SELECT * FROM bank_details WHERE bank_details.ifsc_code = '${filteredData.bankDetails.IFSC}' AND bank_details.bank_name LIKE '%${filteredData.bankDetails.bankName}%'`;
        const [bank_results, fields1] = await pool.execute(queryString1);

        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        var { district, block, panchayat, habitation, limit, skip, SHGId } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, is_active: 1, approved: 1, is_ActiveApproved: 1, is_ActiveReject: 0, reject: 1 };
        SHGId ? query.SHGId = Number(SHGId) : null;
        const data = await model
            .find({ ...query }, { _id: 0, __v: 0, })
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
const rejectshgList = async (req, res) => {
    try {
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var queryString = `
        SELECT *
        FROM shg
        WHERE reject = 1
          ${district ? `AND district LIKE '%${district}%'` : ''}
          ${block ? `AND block LIKE '%${block}%'` : ''}
          ${panchayat ? `AND panchayat LIKE '%${panchayat}%'` : ''} 
          ${habitation ? `AND habitation LIKE '%${habitation}%'` : ''} 
        ORDER BY created_at DESC, id DESC
        LIMIT ${limit}
        OFFSET ${skip};
        `;
        const connection = await pool.getConnection();
        const [data] = await connection.query(queryString);
        console.log(data);
        connection.release();
        console.log("rows datadfhdshf  hsdbfhsdf hbsdfhsdnf hsbdfh snf hshdbfhsnd f");
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
}

const rejectmemberList = async (req, res) => {
    try {
        const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        var { district, block, panchayat, habitation, limit, skip, SHGId } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false, is_active: 1, approved: 1, is_ActiveApproved: 1, reject: 1 };
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
}

const updateInCompletedShgMember = async (req, res) => {
    try {
        const model = mongo.conn.model("incompletedMember", inCompleteshgMemberSchema, "IncompletedMember");
        const data = req.body;
        const { Id, MemberId } = data;
        if (!Id) {
            return handleInvalidQuery(res, "Id is required")
        }
        if (!MemberId) {
            return handleInvalidQuery(res, "MemberId is required")
        }
        const result = await model.findOneAndUpdate({ Id, MemberId, isDeleted: false }, data, { new: true });
        if (!result) {
            return handleInvalidQuery(res, "No SHG member found with given SHGId and MemberId")
        }
        return res.status(200).send({ success: true, result })
    } catch (e) {
        return res.status(400).send({ success: false, error: `Invalid Query err: ${e.message}` })
    }
}

module.exports = {
    getApprovedCount,
    getApproved,
    aadharverify,
    getApprovedList,
    getUpdatedshg,
    getMemberList,
    getmemberApprovedCount,
    getcstApprovedCount,
    Acceptshg,
    Acceptshg1,
    Acceptnewusershg,
    rejectshg,
    AcceptshgMember,
    Acceptnewusershgmember,
    rejectshgmember,
    inCompletedShg,
    getincompletedShgList,
    getInactiveLists,
    updateInCompletedShg,
    getlistMember,
    getUpdatedshgmember,
    getrejectListShg,
    getrejectListShgmember,
    getincompletedShg,
    getinCompletedSHGmember,
    rejectshgList,
    rejectmemberList,
    updateInCompletedShgMember

};

async function getId(villagecode) {
    return new Promise(async (resolve, reject) => {
        try {
            const model1 = mongo.conn.model("incompleted", shgSchemaInComplete, "IncompleteShg");
            const villageModel = mongo.conn.model("village", {}, "villages");
            var village = await villageModel.find(
                { villagecode: villagecode },
                { villagecode: 1 }
            );
            if (village.length <= 0) {
                throw new Error("Invalid village code");
            }
            var data1 = await model1.find(
                {
                    Id: { $gte: villagecode * 10, $lt: (villagecode + 1) * 10 },
                    isDeleted: false,
                },
                { Id: 1 }
            );
            var data = [...data1];
            var ID = villagecode;
            if (!data.length <= 0) {
                data.sort((a, b) => parseInt(a.Id) - parseInt(b.Id));
                var lastSHG = data[data.length - 1];
                ID = lastSHG.Id + 1;
            } else {
                ID = villagecode * 10 + 1;
            }
            return resolve(ID);
        } catch (e) {
            return reject(e);
        }
    });
}
