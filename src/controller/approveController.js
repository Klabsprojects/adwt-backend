const shgSchema = require("../schemas/shg.schema");
const updateShgSchema = require("../schemas/shg.updateschema");
const shgMemberSchema = require("../schemas/shgMember.schema");
const updateShgMemberSchema = require("../schemas/updateshgMember.schema");
const shgSchemaInComplete = require("../schemas/inComplete.schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");
const inCompleteshgMemberSchema = require("../schemas/incompleteMember.Schema");
const bankLinkageRowsSchema = require("../schemas/bankLinkage.Schema");

// const mongo = require("../utils/mongo");
const mysql = require("../utils/mysql");

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
        // Find the unapproved SHG data in the shgPending collection
        const updatedData = await shgPendingModel.findOne({
            SHGId,
            approved: 0,
        });
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
        
        if (allStatusTrue) {
            for (let member of fieldsToUpdate) {
                const roleName = getMemberRoleForField(member)
                const MemberId = { ...shgData[member] };
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
        
        }  else {
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
            let animatorDetails = { animatorDetails: { name: "", contact: "" } }
            let representativeOne = { representativeOne: { name: "", contact: "" } };
            let representativeTwo = { representativeTwo: { name: "", contact: "" } };
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
                amount: ""
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
                        approved: 1, approvedBY, approvedAt: new Date(), ...rejectDetails
                    }
                },
                { new: true }
            );
            update2 = await modelMapTest.findOneAndUpdate(
                { SHGId },
                { $set: { updateStatus: { ...updateStatus }, approved: 1, reject: 0, is_ActiveApproved: 1, approvedBY, approvedAt: new Date() } },
                { new: true }
            );
            approveBankDetail = await findOneAndUpdate({ SHGId }, { $set: { approved: 1} })
        }
        return res.status(200).json({
            status: true,
            message: `SHG data with SHGId ${SHGId} updated successfully`,
            updatedData: update1,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: "Internal server error",
        });
    }
};

module.exports = {
    Acceptshg,
    Acceptnewusershg,

}

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