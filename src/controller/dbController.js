const { json } = require("body-parser");
const shgSchema = require("../schemas/shg.schema");
const shgMemberSchema = require("../schemas/shgMember.schema");

// const mongo = require("../utils/mongo");



const updateSHGHostData= async(req,res)=>{
    try{
        const model = mongo.conn.model("SHG", {}, "shgData");
        var { district, block, panchayat, habitation, limit, skip } = req.query;
        limit = limit ? parseInt(limit) : 100;
        skip = skip ? parseInt(skip) : 0;
        var query = { isDeleted: false };
        district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
        block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
        panchayat ? (query.panchayat = { $regex: new RegExp(panchayat, "i") }) : null;
        habitation ? (query.habitation = { $regex: new RegExp(habitation, "i") }) : null; 
        const data = await model
            .find({ ...query }, { _id: 0, __v: 0 })
            
        const count = await model.countDocuments(query);
        const totalCount = await model.countDocuments();
        if (data.length <= 0) {
            return handleInvalidQuery(
                res,
                "No SHGs found in village, create shg first"
            );
        }
        res.set("SHG-Total-Count", count);
        let result;
        data.map(async (list,i)=>{
            result = await getSHG(list);
        })
        return res.send(data);       

    }catch(e){}
}

module.exports={
    updateSHGHostData
}

const getSHG=async(datas)=>{
    try{
    const model = mongo.conn.model("SHG", shgSchema, "shgData");
    let animatorDetails =0;
    let representativeOne =0;
    let representativeTwo =0;
    const data = JSON.parse(JSON.stringify(datas));
    if(data?.animatorDetails){
        if(data?.animatorDetails?.name &&data?.animatorDetails?.contact){
            animatorDetails = await getMember(data.SHGId, data?.animatorDetails);
        }else{
            animatorDetails=0
        }
    }else{
        animatorDetails=0
    }
    if(data?.representativeOne){

        if(data?.representativeOne?.name &&data?.representativeOne?.contact){
            representativeOne=await getMember(data.SHGId, data.representativeOne);
        }else{
            representativeOne=0
        }
    }else{
        representativeOne=0
    }
    if(data?.representativeTwo){
        if(data?.representativeTwo?.name &&data?.representativeTwo?.contact){
            representativeTwo=await getMember(data.SHGId, data.representativeTwo);
        }else{
            representativeTwo=0
        }
    }else{
        representativeTwo=0
    }
    let result =await model.updateOne({SHGId:data.SHGId},{ $set: {animatorDetails,representativeOne,representativeTwo}},{new:true});
}catch (error) {
    console.error("Error updating document:", error);
  }

}

const getMember=async(SHGId, datas)=>{
    const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
    const data = JSON.parse(JSON.stringify(datas));
    const memberData = await model.find({SHGId, memberName:data.name,contact:data.contact},{MemberId:1,_id:0});
    if(memberData.length>0){
        return memberData[0].MemberId
    }else{
        return 0
    }
}