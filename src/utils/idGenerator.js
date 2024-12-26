const shgSchema = require("../schemas/shg.schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");
const bankLinkageRowsSchema = require("../schemas/bankLinkage.Schema");
const shgMemberSchema = require("../schemas/shgMember.schema");

const mongo = require("../utils/mongo");

 const  getSHGID=async(villagecode) =>{
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

async function getBankId(SHGId) {
    return new Promise(async (resolve, reject) => {
        try {
            const model = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
            var data = await model.find({ SHGId }, { bankId: 1, _id: 0 });
            var bId = SHGId;
            if (!data.length <= 0) {
                data.sort((a, b) => parseInt(a.bankId) - parseInt(b.bankId));
                var lastbankData = data[data.length - 1];
                const banId = JSON.parse(JSON.stringify(lastbankData));
                bId = banId.bankId + 1;
            } else {
                bId = SHGId * 100 + 1;
            }
            return resolve(bId);
        } catch (e) {
            return reject(e);
        }
    });
}
async function getBankLinkageId(SHGId) {
    return new Promise(async (resolve, reject) => {
        try {
            const model = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
            var data = await model.find({ SHGId }, { LinkageId: 1, _id: 0 });
            var bId = SHGId;
            if (!data.length <= 0) {
                data.sort((a, b) => parseInt(a.LinkageId) - parseInt(b.LinkageId));
                var lastbankData = data[data.length - 1];
                const banId = JSON.parse(JSON.stringify(lastbankData));
                bId = banId.LinkageId + 1;
            } else {
                bId = SHGId * 100 + 1;
            }
            return resolve(bId);
        } catch (e) {
            return reject(e);
        }
    });
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

module.exports ={
    getSHGID,
    getBankId,
    getBankLinkageId,
    getMemberId  

}
