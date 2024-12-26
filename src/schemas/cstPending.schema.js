const mongoose = require("mongoose");

const CSTPendingSchema = new mongoose.Schema({
    district: String,
    block: String,    
    isDeleted: { type: Boolean, default: false },
    memberName: String,
    SHGCode: String,
    MemberId: {type:Number,required:true},
    fatherName: String,
    memberAge: Number,
    DOB: String,
    gender: String,        
    education: String,
    aknowlege:String,
    AADHAR:Number,
    smartCard: Number,
    contact: Number,
    email:String,
    memberStatus :Number,
    roleofCST:String,
    updateCount: {
      type: Number,
      default: 0 ,
    },
    reject:{
        type: Number,
        enum: [0, 1],
        default: 0,
      },
      approvedAt:{
        type: Date,
      },
      is_ActiveApproved: {
        type: Number,
        enum: [0, 1],
        default: 1,
      },
      approved: {
        type: Number,
        enum: [0, 1],
        default: 0,
      },
      rejectionSummary:String,
      is_ActiveSummary:String,
      is_ActiveRejectSummary:String,
      approvedBY:String,
      createdBy:String,
      updatedBy:String,
      is_ActiveReject: {
        type: Number,
        enum: [0, 1],
        default: 0,
      },
      ApprovedStatus : {},
})
module.exports = CSTPendingSchema
