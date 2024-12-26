const shgMemberSchema = require("../schemas/shgMember.schema");
const updateShgMemberSchema = require("../schemas/updateshgMember.schema");
const bankLinkageRowsSchema = require("../schemas/bankLinkage.Schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");

const mongo = require("../utils/mongo");

const fetchBankDetails=async(SHGId)=>{
    const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
    const bankData = await bankDetailsModel.find({SHGId})
    return bankData;
}

const fetchBankLinkage=async(SHGId)=>{
    const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
    const linkage = await bankLinkageRowsModel.find({SHGId})
    return linkage;
}
const fetchSHGuser=async(shgData)=>{
  console.log("shgData?.animatorDetails ",shgData?.animatorDetails )
  const [animator, rep1, rep2] = await Promise.all([
    getMemberDetails(shgData?.animatorDetails || 0),
    getMemberDetails(shgData?.representativeOne || 0),
    getMemberDetails(shgData?.representativeTwo || 0)
]);
console.log("animator, rep1, rep2",animator, rep1, rep2)

      return {
        animatorDetails:animator,
        representativeOne:rep1,
        representativeTwo:rep2
      }    

}
const getFullData=async(shgList)=>{  
  const data =await getData(shgList);
  return data
}

module.exports={
    fetchBankDetails,
    fetchBankLinkage,
    fetchSHGuser,
    getFullData
}
const getMemberDetails = async (memberId) => {
    const shgMembers = mongo.conn.model("SHGMember",shgMemberSchema,"SHGMember");
    if (memberId !== 0 && typeof memberId ==='number') {
      const memberData = await shgMembers.findOne(
        { MemberId: Number(memberId) },
        { _id: 0, MemberId: 1, memberName: 1, contact: 1 }
      );
      const member = JSON.parse(JSON.stringify(memberData));
      return {
        name: member?.memberName,
        contact: member?.contact,
        MemberId: member?.MemberId,
      };
    }
    return { name: '', contact: 0, MemberId: 0 };
  };

const getData=async(list)=>{
  const datas = { ...list };
const data = datas._doc;
const userData = await fetchSHGuser(data);
const { animatorDetails, representativeOne, representativeTwo } = { ...userData };
data.animatorDetails = { ...animatorDetails };
data.representativeOne = { ...representativeOne };
data.representativeTwo = { ...representativeTwo };

const bank = await fetchBankDetails(data.SHGId);
if (bank.length === 0) {
    data.bankDetails = bank[0];
} else if (bank.length === 1) {
    data.bankDetails = bank[0];
    data.bankDetails1 = bank[1];
} else if (bank.length === 2) {
    data.bankDetails = bank[0];
    data.bankDetails1 = bank[1];
    data.bankDetails2 = bank[2];
}
const bankLinkage = await fetchBankLinkage(data.SHGId);
if (bankLinkage.length === 0) {
    data.bankLinkageRows = bankLinkage[0];
} else if (bankLinkage.length === 1) {
    data.bankLinkageRows = bankLinkage[0];
    data.bankLinkageRows1 = bankLinkage[1];
} else if (bankLinkage.length === 2) {
    data.bankLinkageRows = bankLinkage[0];
    data.bankLinkageRows1 = bankLinkage[1];
    data.bankLinkageRows2 = bankLinkage[2];
}
return data;

}