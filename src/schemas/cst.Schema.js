const mongoose = require("mongoose");

const CSTDetailsSchema = new mongoose.Schema({
    district: String,
    block: String,
    isDeleted: { type: Boolean, default: false },
    memberName: String,
    MemberId: {type:Number,required:true,unique:true},
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
    roleofCST:String,
    memberStatus :Number,
    updateCount: {
      type: Number,
      default: 0 ,
    },
    rejectionSummary:String,

    reject:{
        type: Number,
        enum: [0, 1],
        default: 0,
      },
    is_active:{
        type: Number,
        enum: [0, 1],
        default: 1,
      },
      approved:{
        type: Number,
        enum: [0, 1],
        default: 0,
      },
      approvedAt:{
        type: Date,
      },
      approvedBY:String,
      createdBy:String,
      updatedBy:String,
      is_ActiveSummary:String,
      is_ActiveRejectSummary:String,
      is_ActiveApproved: {
        type: Number,
        enum: [0, 1],
        default: 1,
      },
      is_ActiveReject: {
        type: Number,
        enum: [0, 1],
        default: 0,
      },
      ApprovedStatus : {},
      
})
module.exports = CSTDetailsSchema
