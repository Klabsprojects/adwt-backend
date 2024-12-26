const shgSchema = require("../schemas/shg.schema");
const updateShgSchema = require("../schemas/shg.updateschema");
const shgMemberSchema = require("../schemas/shgMember.schema");
const updateShgMemberSchema = require("../schemas/updateshgMember.schema");
const inCompleteshgMemberSchema = require("../schemas/incompleteMember.Schema");
const shgSchemaInComplete = require("../schemas/inComplete.schema");
const bankLinkageRowsSchema = require("../schemas/bankLinkage.Schema");

const CSTDetailsSchema = require("../schemas/cst.Schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");
// const mongo = require("../utils/mongo");
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


const updateStatus = require('../utils/shgUpdateStatus')
const SHGDataFun = require("../utils/shgData")

const idGenerator = require('../utils/idGenerator');
const trimData = require('../utils/trimData');

const handleInvalidQuery = (res, message = "") => {
    return res.status(201).send({ message: `no data found` });
};

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

        const reqData = req.body;
        const createdBy = req.body.createdBy;
        const returnData = await shgFulfill(reqData);
        const { data, animator, rep1, rep2 } = { ...returnData }
        if (data?.bankDetails1) {
            updateStatus.updateStatus = {
                ...updateStatus.updateStatus,
                bankDetails1: ''
            }
        }
        if (data?.bankDetails2) {
            updateStatus.updateStatus = {
                ...updateStatus.updateStatus,
                bankDetails2: ''
            }
        }

        if (data?.bankLinkageRows1) {
            updateStatus.updateStatus = {
                ...updateStatus.updateStatus,
                bankLinkageRows1: ''
            }
        }
        if (data?.bankLinkageRows1) {
            updateStatus.updateStatus = {
                ...updateStatus.updateStatus,
                bankLinkageRows2: ''
            }
        }
        if (data?.cif1) {
            updateStatus.updateStatus = {
                ...updateStatus.updateStatus,
                bankLinkageRows2: ''
            }
        }
        if (data?.cif2) {
            updateStatus.updateStatus = {
                ...updateStatus.updateStatus,
                bankLinkageRows2: ''
            }
        }

        // Check if 'Id' 
        if (data.Id) {
            const incompletedData = await model2.findOneAndUpdate({ Id: data.Id }, { Status: 1, SHGId: data.SHGId }, { _id: 0, __v: 0 });
            if (incompletedData) {
                // const shgMapTestData = { ...incompletedData.toObject() };
                const shgMapTestData = { ...data, updateStatus: { ...updateStatus.updateStatus } };
                delete shgMapTestData._id;
                delete shgMapTestData.__v;

                const reqData = await checkBankData(data);
                const { bankDetailInstances, bankDetailPendingInstances } = { ...reqData };
                const reqlinkData = await checkBankLinkageData(data);
                const { bankLinkageRowsInstances, bankLinkageRowsPendingInstances } = { ...reqlinkData }
                const pendingList = { ...shgMapTestData };
                const shgPending = new model1(pendingList);
                const data11 = await shgPending.save();
                const shgMapTest = new model(shgMapTestData);
                const data111 = await shgMapTest.save();
                // Save bank details
                const incompletedMembers = await model3.find({ Id: data.Id }, { __v: 0 });
                if (incompletedMembers.length > 0) {
                    // Define arrays to collect promises for bulk operations
                    const updatePromises = [];
                    const savePromises = [];
                    const pendingPromises = [];

                    for (const incompletedMember of incompletedMembers) {
                        const member_id = await idGenerator.getMemberId(data.SHGId);
                        incompletedMember.MemberId = member_id;
                        incompletedMember.Status = 1;

                        // Update the MemberId in model3
                        const updatePromise = model3.findOneAndUpdate(
                            { _id: incompletedMember._id },
                            { ...incompletedMember },
                            { new: true }
                        );
                        updatePromises.push(updatePromise);

                        // Create a new instance in model4 and move data
                        const model3Data = incompletedMember.toObject();
                        const model3Datas = delete model3Data._id
                        const shgMemberInstance = new model4({ SHGId: data.SHGId, ...model3Data });
                        const savePromise = shgMemberInstance.save();
                        savePromises.push(savePromise);

                        // Pending
                        const ApprovedStatus = {
                            memberDetail: "",
                            AADHAR: "",
                            smartCard: "",
                            contact: "",
                            socialCategory: "",
                            bankDetail: "",
                        };

                        // Save pending member details to shgmemberPendingModel
                        const pendingList = { SHGId: data.SHGId, ...model3Data, ApprovedStatus };
                        const pendingMember = new shgmemberPendingModel(pendingList);
                        const pendingPromise = pendingMember.save();
                        pendingPromises.push(pendingPromise);
                    }

                    // Execute bulk operations using Promise.all
                    const updatedMembers = await Promise.all(updatePromises);
                    const savedMembers = await Promise.all(savePromises);
                    const pendingMembers = await Promise.all(pendingPromises);

                    // Optionally, you can use the results if needed
                    const [animatorData, rep1Data, rep2Data] = await Promise.all([
                        model4.findOne({ SHGId: Number(data.SHGId), memberName: animator.name, contact: Number(animator.contact) }, { MemberId: 1 }),
                        model4.findOne({ SHGId: Number(data.SHGId), memberName: rep1.name, contact: rep1.contact }, { MemberId: 1 }),
                        model4.findOne({ SHGId: Number(data.SHGId), memberName: rep2.name, contact: rep2.contact }, { MemberId: 1 }),
                    ]);
                    // Now animatorData, rep1Data, and rep2Data contain the results of the respective queries

                    await model.findOneAndUpdate({ SHGId: Number(data.SHGId) }, { animatorDetails: animatorData?.MemberId, representativeOne: rep1Data?.MemberId, representativeTwo: rep2Data?.MemberId })
                    await model1.findOneAndUpdate({ SHGId: Number(data.SHGId) }, { animatorDetails: animatorData?.MemberId, representativeOne: rep1Data?.MemberId, representativeTwo: rep2Data?.MemberId })
                    const bankDetailResponses = await Promise.all(bankDetailInstances.map(instance => instance.save()));
                    await Promise.all(bankDetailPendingInstances.map(instance => instance.save()));
                    const bankLinkageRowsResponses = await Promise.all(bankLinkageRowsInstances.map(instance => instance.save()));
                    await Promise.all(bankLinkageRowsPendingInstances.map(instance => instance.save()));
                    return res.status(200).send({ status: true, data11, data111, bankDetailResponses, bankLinkageRowsResponses });
                }
            }
        }

    } catch (e) {
        return res.status(400).send({ status: false, error: `Invalid Query err: ${e.message}` });
    }
};


const updateShg = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const model1 = mongo.conn.model("shg", shgSchema, "shgPending");

        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");

        const data = JSON.parse(JSON.stringify({ ...req.body }));
        const SHGId = Number(data['SHGId']);
        const shgFullData = await getShgallData(SHGId, data);
        res.json({ status: true, result: shgFullData })

    }
    catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }

}


const shgView = async (req, res) => {
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
        const mapTestDataApproved0UpdateGT0Pending = await modelPending.findOne({
            SHGId: SHGId,
        }).sort({ createdAt: -1, _id: -1, updatedAt: -1 });
        if (mapTestDataApproved0UpdateGT0Pending != null && mapTestDataApproved0UpdateGT0Pending.length > 0 && mapTestDataApproved0UpdateGT0Pending[0]?.is_ActiveApproved === 1) {
            if (mapTestDataApproved0UpdateGT0Pending[0]?.animatorDetails !== 0 || mapTestDataApproved0UpdateGT0Pending[0]?.representativeOne !== 0
                || mapTestDataApproved0UpdateGT0Pending[0]?.representativeTwo !== 0) {
                const pendingUser = await SHGDataFun.fetchSHGuser(mapTestDataApproved0UpdateGT0Pending[0]);
                mapTestDataApproved0UpdateGT0Pending[0]?.animatorDetails ? mapTestDataApproved0UpdateGT0Pending[0].animatorDetails = pendingUser.animatorDetails : ''
                mapTestDataApproved0UpdateGT0Pending[0]?.representativeOne ? mapTestDataApproved0UpdateGT0Pending[0].representativeOne = pendingUser.representativeOne : ''
                mapTestDataApproved0UpdateGT0Pending[0]?.representativeTwo ? mapTestDataApproved0UpdateGT0Pending[0].representativeTwo = pendingUser.representativeTwo : '';
            }

        } else {
        }
        const bankDetailData = await bankDetailsModel.find(
            { SHGId },
            { bankId: 1, IFSC: 1, bankName: 1, accountNumber: 1, branchName: 1, _id: 0 }
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
                if (mapTestDataApproved0UpdateGT0Pending !== null && mapTestDataApproved0UpdateGT0Pending.length > 0 && mapTestDataApproved0UpdateGT0Pending[0]?.is_ActiveApproved === 1) {

                    combinedData1 = {
                        ...mapTestDataApproved0UpdateGT0Pending[0]._doc,
                        bankDetails: bankDetailData[0],
                        bankDetails1: bankDetailData[1],
                        bankDetails2: bankDetailData[2],
                        bankLinkageRows: banklinkage[0],
                        bankLinkageRows1: banklinkage[1],
                        bankLinkageRows2: banklinkage[2]
                    };
                } else if (mapTestDataApproved0UpdateGT0Pending !== null && mapTestDataApproved0UpdateGT0Pending.length > 0) {
                    combinedData1 = {
                        ...mapTestDataApproved0UpdateGT0Pending[0]._doc,
                    }

                }
                const results = {
                    SHGId: SHGId,
                    data: combinedData,
                    newData: combinedData1,
                };
                res.json({ status: true, data: results });
            }
        }

    } catch (e) {
        res.status(500).json({ status: false, error: "Internal server error" });
    }
}

// const getInactiveList = async (req, res) => {
//     console.log("teststttttttttttttttttttttttttttttttttt ttttttttttttttttttttttttttttttt tttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt");
//     try {
//         var { district, block, panchayat, habitation, limit, skip } = req.query;
//         limit = limit ? parseInt(limit) : 100;
//         skip = skip ? parseInt(skip) : 0;
//         var queryString = `
//         SELECT *
//         FROM shg
//         WHERE reject = 2
//           ${district ? `AND district LIKE '%${district}%'` : ''}
//           ${block ? `AND block LIKE '%${block}%'` : ''}
//           ${panchayat ? `AND panchayat LIKE '%${panchayat}%'` : ''} 
//           ${habitation ? `AND habitation LIKE '%${habitation}%'` : ''} 
//         ORDER BY created_at DESC, id DESC
//         LIMIT ${limit}
//         OFFSET ${skip};
//         `;
//         const connection = await pool.getConnection();
//         const [data] = await connection.query(queryString);
//         connection.release();
//         console.log(data);
//         console.log("rows datadfhdshf  hsdbfhsdf hbsdfhsdnf hsbdfh snf hshdbfhsnd f");
//         if (data.length <= 0) {
//             return handleInvalidQuery(
//                 res,
//                 "No SHGs found in village, create shg first"
//             );
//         }
//         res.set("SHG-Total-Count", data.length);
//         res.send(data);
//     } catch (e) {
//         return res
//             .status(400)
//             .send({ status: false, error: `Invalid Query err: ${e.message}` });
//     }
// };

module.exports = {
    addShg,
    updateShg,
    shgView,
    // getInactiveList
    // getUpdatedshg
}


const shgFulfill = async (reqData) => {
    const data = { ...reqData }
    data.SHGId = await idGenerator.getSHGID(data.villagecode);
    data.district = data.district.toUpperCase();
    data.block = data.block.toUpperCase();
    data.panchayat = data.panchayat.toUpperCase();
    data.habitation = data.habitation.toUpperCase();
    data.createdAt = new Date();
    data.approved = 0;
    data.CST = Number(data.CST.MemberId) || 0;
    const animator = data.animatorDetails;
    const rep1 = data.representativeOne;
    const rep2 = data.representativeTwo;
    data.animatorDetails = 0;
    data.representativeOne = 0;
    data.representativeTwo = 0;

    const returnData = {
        data,
        animator,
        rep1,
        rep2
    }

    return returnData
}

const addSHGBankData = async (SHGId, data) => {
    const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
    const bankDetailsPendingModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailPendingshg");
    const bankId = await idGenerator.getBankId(SHGId)
    const bankDetailsInstance = new bankDetailsModel({
        SHGId: SHGId,
        bankId: bankId,
        IFSC: data?.IFSC,
        bankName: data?.bankName,
        accountNumber: data?.accountNumber,
        branchName: data.branchName,
        accountType: data.accountType,
        accountStatus: data.accountStatus,
    });

    const bankDetailsPendingInstance = new bankDetailsPendingModel({
        SHGId: SHGId,
        bankId: bankId,
        IFSC: data?.IFSC,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        branchName: data.branchName,
        accountType: data.accountType,
        accountStatus: data.accountStatus,
    });

    const payload = {
        bankDetailsInstance,
        bankDetailsPendingInstance
    }
    return payload
}
const addSHGBankLinkageData = async (SHGId, data) => {
    const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
    const bankLinkageRowsPendingModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowPendingShg");

    const LinkageId = await idGenerator.getBankLinkageId(SHGId);
    const bankLinakageInstance = new bankLinkageRowsModel({
        SHGId: SHGId,
        LinkageId: LinkageId,
        loanType: data.loanType,
        dosage: data.dosage,
        amount: data.amount,
        bankName: data.bankName,
        loanAcNumber: data.loanAcNumber,
        roi: data.roi,
        tenure: data.tenure,
        balance: data.balance,
        date: data.date,
        closingDate: data.closingDate,
        IFSC: data.IFSC,
        branchName: data.branchName,
    });
    const bankLinakagePendingInstance = new bankLinkageRowsPendingModel({
        SHGId: SHGId,
        LinkageId: LinkageId,
        loanType: data.loanType,
        dosage: data.dosage,
        amount: data.amount,
        bankName: data.bankName,
        loanAcNumber: data.loanAcNumber,
        roi: data.roi,
        tenure: data.tenure,
        balance: data.balance,
        date: data.date,
        closingDate: data.closingDate,
        IFSC: data.IFSC,
        branchName: data.branchName,
    });
    const linkage = {
        bankLinakageInstance,
        bankLinakagePendingInstance
    }
    return linkage
}

const checkBankData = async (data) => {
    const bankDetailInstances = []
    const bankDetailPendingInstances = []
    if (data.bankDetails && !trimData.isEmptyBankDetails(data.bankDetails)) {
        const returnData = await addSHGBankData(data.SHGId, data.bankDetails);

        bankDetailInstances.push(returnData.bankDetailsInstance);
        bankDetailPendingInstances.push(returnData.bankDetailsPendingInstance);
    }
    if (data?.bankDetails1 && !trimData.isEmptyBankDetails(data.bankDetails1)) {
        const returnData = await addSHGBankData(data.SHGId, data?.bankDetails1);

        bankDetailInstances.push(returnData.bankDetailsInstance);
        bankDetailPendingInstances.push(returnData.bankDetailsPendingInstance);
    }
    if (data.bankDetails2 && !trimData.isEmptyBankDetails(data.bankDetails2)) {
        const returnData = await addSHGBankData(data.SHGId, data.bankDetails2);

        bankDetailInstances.push(returnData.bankDetailsInstance);
        bankDetailPendingInstances.push(returnData.bankDetailsPendingInstance);
    }

    const reqData = {
        bankDetailInstances,
        bankDetailPendingInstances
    }
    return reqData
}


const checkBankLinkageData = async (data) => {
    const bankLinkageRowsInstances = []
    const bankLinkageRowsPendingInstances = []
    if (data.bankLinkageRows && !trimData.isEmptyBankLinkageRows(data.bankLinkageRows)) {
        const returnData = await addSHGBankLinkageData(data.SHGId, data.bankLinkageRows)
        bankLinkageRowsInstances.push(returnData.bankLinakageInstance);
        bankLinkageRowsPendingInstances.push(returnData.bankLinakagePendingInstance);
    }
    if (data.bankLinkageRows1 && !trimData.isEmptyBankLinkageRows(data.bankLinkageRows1)) {
        const returnData = await addSHGBankLinkageData(data.SHGId, data.bankLinkageRows1)
        bankLinkageRowsInstances.push(returnData.bankLinakageInstance);
        bankLinkageRowsPendingInstances.push(returnData.bankLinakagePendingInstance);
    }
    if (data.bankLinkageRows2 && !trimData.isEmptyBankLinkageRows(data.bankLinkageRows2)) {
        const returnData = await addSHGBankLinkageData(data.SHGId, data.bankLinkageRows2)
        bankLinkageRowsInstances.push(returnData.bankLinakageInstance);
        bankLinkageRowsPendingInstances.push(returnData.bankLinakagePendingInstance);
    }

    let reqData = {
        bankLinkageRowsInstances,
        bankLinkageRowsPendingInstances
    }
    return reqData
}


const getrep1Data = async (MemberId) => {

}
const getrep2Data = async (MemberId) => {

}






// view specific shg
const getUpdatedshg = async (req, res) => {
    try {
        const modelMapTest = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const modelPending = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");

        const SHGId = Number(req.query.SHGId);
        const mapTestDataApproved0Update0 = await modelMapTest.find({
            SHGId: SHGId,
            // approved: 0,
            // updateCount: 0,
        });
        const mapTestDataApproved0UpdateGT0Pending = await modelPending.find({
            SHGId: SHGId,
            approved: 0,
            // updateCount: { $gt: 0 },
        });
        const bankDetailData = await bankDetailsModel.find(
            { SHGId },
            { bankId: 1, IFSC: 1, bankName: 1, accountNumber: 1, branchName: 1, _id: 0 }
        );
        const banklinkage = await bankLinkageRowsModel.find(
            { SHGId },
            {
                LinkageId: 1, loanType: 1, dosage: 1, amount: 1, bankName: 1, loanAcNumber: 1, roi: 1, tenure: 1,
                balance: 1, date: 1, closingDate: 1, IFSC: 1, branchName: 1, _id: 0
            }
        );
        const repOne = getrep1Data(mapTestDataApproved0Update0[0].representativeOne)
        const repTwo = getrep2Data(mapTestDataApproved0Update0[0].representativeOne)
        if (bankDetailData) {
            const combinedData = {
                ...mapTestDataApproved0Update0[0]._doc,
                bankDetails: bankDetailData[0],
                bankDetails1: bankDetailData[1],
                bankDetails2: bankDetailData[2],
                bankLinkageRows: banklinkage[0],
                bankLinkageRows1: banklinkage[1],
                bankLinkageRows2: banklinkage[2]
            };
            if (bankDetailData) {
                const combinedData1 = {
                    ...mapTestDataApproved0UpdateGT0Pending[0]._doc,
                    bankDetails: bankDetailData[0],
                    bankDetails1: bankDetailData[1],
                    bankDetails2: bankDetailData[2],
                    bankLinkageRows: banklinkage[0],
                    bankLinkageRows1: banklinkage[1],
                    bankLinkageRows2: banklinkage[2]
                };
                const results = {
                    SHGId: SHGId,
                    updated: combinedData1.length > 0 ? true : false,
                    data: combinedData,
                    newData: combinedData1,
                };
                res.json({ status: true, data: results });
            }
        }
    } catch (error) {
        console.error("Error retrieving data:", error);
        res.status(500).json({ status: false, error: "Internal server error" });
    }
};

const getShgallData = async (SHGId, datas) => {
    const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
    const bankDetailsPendingModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailPendingshg");

    const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
    const bankLinkageRowsPendingModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowPendingShg");

    const data = JSON.parse(JSON.stringify({ ...datas }));

    const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const model1 = mongo.conn.model("shg", shgSchema, "shgPending");

    const data2 = await model.find({ SHGId, isDeleted: false }, { _id: 0, reject: 0, createdBy: 0, is_ActiveApproved: 0, is_completed: 0, approved: 0, is_active: 0, createdAt: 0, is_ActiveReject: 0, __v: 0, updateStatus: 0, update: 0, approvedAt: 0, approvedBY: 0, bankLinkageRows: 0, isDeleted: 0, approved: 0 });

    const updateCount = data2[0].updateCount;
    const updatedBy = data?.updatedBy || 0;
    delete data2[0].updateCount;
    const oldData = { ...data2[0]._doc };

    const { bankLinkageRows, bankLinkageRows1, bankLinkageRows2 } = { ...data };
    const { bankDetails, bankDetails1, bankDetails2 } = { ...data };

    delete data?.bankDetails
    delete data?.bankDetails1
    delete data?.bankDetails2
    delete data?.bankLinkageRows
    delete data?.bankLinkageRows1
    delete data?.bankLinkageRows2
    delete data?.approved
    delete data?.isDeleted

    data.animatorDetails = data.animatorDetails.MemberId
    data.representativeOne = data.representativeOne.MemberId
    data.representativeTwo = data.representativeTwo.MemberId
    data.CST = data.CST.MemberId
    const updateStatus = {}
    if (bankDetails?.bankId > 0 && Object.keys(bankDetails).length > 0) {
        const compareBank = await compareBankData(SHGId, bankDetails, updateCount, updatedBy);
        compareBank ? updateStatus.bankDetails = '' : '';

    } else {
        const bankId = await idGenerator.getBankId(Number(SHGId));
        let payload = {
            SHGId: Number(SHGId),
            ...bankDetails,
            bankId: bankId,
            is_active: 1,
            createdAt: new Date(),
            approved: 0,
            updateCount: 0,
            createdBy: updatedBy
        };
        const bankDetail = new bankDetailsModel(payload);
        const bankResult = await bankDetail.save();

        const bankPending = new bankDetailsPendingModel(payload);
        const bankPendingResult = await bankPending.save();
        updateStatus.bankDetails = ''

    }
    if (typeof bankDetails1 === "object") {

        if (bankDetails1?.bankId > 0 && Object.keys(bankDetails1).length > 0) {

            const compareBank = await compareBankData(SHGId, bankDetails1, updateCount, updatedBy);
            compareBank ? updateStatus.bankDetails1 = '' : ''
        } else {
            const bankId = await idGenerator.getBankId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankDetails1,
                bankId: bankId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: 0,
                createdBy: updatedBy
            };
            const bankDetail = new bankDetailsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankDetailsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankDetails1 = ''
        }
    }
    if (typeof bankDetails2 === "object") {

        if (bankDetails2?.bankId > 0 && Object.keys(bankDetails2).length > 0) {

            const compareBank = await compareBankData(SHGId, bankDetails2, updateCount, updatedBy);
            compareBank ? updateStatus.bankDetails2 = '' : ''
        } else {
            const bankId = await idGenerator.getBankId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankDetails2,
                bankId: bankId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: 0,
                createdBy: updatedBy
            };
            const bankDetail = new bankDetailsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankDetailsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankDetails2 = ''
        }
    }

    if (typeof bankLinkageRows === "object") {

        if (bankLinkageRows?.LinkageId > 0 && Object.keys(bankLinkageRows).length > 0) {
            const compareBank = await compareBankLinkageData(SHGId, bankLinkageRows, updateCount, updatedBy);
            compareBank ? updateStatus.bankLinkageRows = '' : '';

        } else {
            const LinkageId = await idGenerator.getBankLinkageId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankLinkageRows,
                bankId: LinkageId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: Number(updateCount) + 1,
                createdBy: updatedBy
            };
            const bankDetail = new bankLinkageRowsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankLinkageRowsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankLinkageRows = ''
        }
    }
    if (typeof bankLinkageRows1 === "object") {

        if (bankLinkageRows1?.LinkageId > 0 && Object.keys(bankLinkageRows1).length > 0) {

            const compareBank = await compareBankLinkageData(SHGId, bankLinkageRows, updateCount, updatedBy);
            compareBank ? updateStatus.bankLinkageRows1 = '' : ''
        } else {
            const LinkageId = await idGenerator.getBankLinkageId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankLinkageRows1,
                bankId: LinkageId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: Number(updateCount) + 1,
                createdBy: updatedBy
            };
            const bankDetail = new bankLinkageRowsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankLinkageRowsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankLinkageRows = ''
        }
    }
    if (typeof bankLinkageRows2 === "object") {

        if (bankLinkageRows2?.LinkageId > 0 && Object.keys(bankLinkageRows).length > 0) {

            const compareBank = await compareBankLinkageData(SHGId, bankLinkageRows, updateCount, updatedBy);
            compareBank ? updateStatus.bankLinkageRows1 = '' : ''
        } else {
            const LinkageId = await idGenerator.getBankLinkageId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankLinkageRows1,
                bankId: LinkageId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: Number(updateCount) + 1,
                createdBy: updatedBy
            };
            const bankDetail = new bankLinkageRowsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankLinkageRowsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankLinkageRows2 = ''
        }
    }



    const compare = await compareObjects(oldData, data);
    const filed = await getupdateField(compare);
    Object.assign(updateStatus, filed);
    const payloads = {
        SHGId,
        district: data?.district,
        block: data?.block,
        panchayat: data?.panchayat,
        habitation: data?.habitation,
        SHGName: data?.SHGName,
        ...compare,
        updateCount: updateCount + 1,
        updatedBy,
        updatedAt: new Date(),
        approved: 0,
        reject: 0,
        updateStatus
    }

    const addPendingData = new model1(payloads);
    const pendingResult = await addPendingData.save();
    const mainModel = await model.findOneAndUpdate({ SHGId }, { approved: 0 }, { new: true })
    return pendingResult
    // return data2;
}


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

const getupdateField = async (updatedData) => {
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
        "amount"
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
    // const updatedProjectsInSHGArea = {};
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
    const updatedASF = {};
    const updatedCAP = {};
    const updatedBulkLoan = {};
    const updatedCST = {};

    // Loop through updatedData and populate corresponding updated objects
    for (const field of Object.keys(updatedData)) {
        if (basicDetails.includes(field)) {
            updatedBasicDetails[field] = "";
        } else if (bankLinkageRows.includes(field)) {
            updatedBankLinkageRows[field] = String(updatedData[field]);
        } else if (bankDetails.includes(field)) {
            updatedBankDetail[field] = String(updatedData[field]);
        } else if (field === "animatorDetails") {
            updatedAnimatorDetails[field] = "";
        } else if (field === "representativeOne") {

            updatedRepresentativeOne[field] = "";
        } else if (field === "representativeTwo") {
            updatedRepresentativeTwo[field] = "";
        } else if (field === "PLF") {
            updatedPLF[field] = "";
        } else if (field === "SHGSavings") {
            updatedSHGSavings[field] = "";
        } else if (field === "grading" || field === "auditingDate") {

            updatedGrading.grading = "";
        } else if (field === "economicAssistance") {
            updatedEconomicAssistance[field] = "";
        } else if (field === "rf") {
            updatedRF[field] = "";
        } else if (field === "cif") {
            updatedCIF[field] = "";
        } else if (field === "asf") {
            updatedASF[field] = "";
        } else if (field === "CAP") {
            updatedCAP[field] = "";
        } else if (field === "bulkLoan") {
            updatedBulkLoan[field] = "";
        } else if (field === CST) {
            updatedCST[field] = "";
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
    return updateStatus

}

const compareBankData = async (SHGId, bankDetails, updateCount, updatedBy) => {
    const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
    const bankDetailsPendingModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailPendingshg");

    const bankDetailData = await bankDetailsModel.find(
        { bankId: Number(bankDetails.bankId) },
        { IFSC: 1, bankName: 1, accountNumber: 1, branchName: 1, accountType: 1, accountStatus: 1, _id: 0, bankId: 1 }
    );
    const bankCompare = await compareObjects(bankDetailData[0], bankDetails);
    if (Object.keys(bankCompare).length > 0) {
        let payload = {
            SHGId: Number(SHGId),
            ...bankDetails,
            is_active: 1,
            createdAt: new Date(),
            approved: 0,
            updateCount: Number(updateCount) + 1,
            updatedBy
        }
        const bankPending = new bankDetailsPendingModel(payload);
        const bankPendingResult = await bankPending.save();
        await bankDetailsModel.findOneAndUpdate({ bankId: Number(bankDetails.bankId) }, { approved: 0 }, { new: true })
        return true
    } else {
        return false
    }

    // const bankmodel = 

}
const compareBankLinkageData = async (SHGId, bankLinkage, updateCount, updatedBy) => {
    const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
    const bankLinkageRowsPendingModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowPendingShg");

    const bankLinkagedata = await bankLinkageRowsModel.find({ LinkageId: bankLinkage.LinkageId }, {
        loanType: 1, dosage: 1, amount: 1, IFSC: 1, bankName: 1,
        loanAcNumber: 1, roi: 1, tenure: 1, balance: 1, branchName: 1, date: 1, closingDate: 1, LinkageId: 1
    })
    const bankCompare = await compareObjects(bankLinkagedata[0], bankLinkage);
    if (Object.keys(bankCompare).length > 0) {
        let payload = {
            SHGId: Number(SHGId),
            ...bankLinkage,
            is_active: 1,
            createdAt: new Date(),
            approved: 0,
            updateCount: Number(updateCount) + 1,
            updatedBy
        }
        const banklinkagePending = new bankLinkageRowsPendingModel(payload);
        const bankLinkagePendingResult = await banklinkagePending.save();
        await bankLinkageRowsModel.findOneAndUpdate({ LinkageId: Number(bankLinkage.LinkageId) }, { approved: 0 }, { new: true })

        return true
    } else {
        return false
    }
}