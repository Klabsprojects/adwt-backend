const mongoose = require("mongoose");

const CSTSchema = new mongoose.Schema({
    CSTId:{type:Number,require:true},
    district: String,
    block: String,
    panchayat: String,
    habitation: String,
    habitation_id:Number,
    villagecode:Number, 
    isDeleted: { type: Boolean, default: false },
    reject:{
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
      closingDate:{
        type: Date,
      },
      is_active: {
        type: Number,
        enum: [0, 1], 
        default: 1,   
      },
      createdAt: {
        type: Date,
        default: Date.now, 
      },
      updatedAt: {
        type: Date,
      },
      approved: {
        type: Number,
        enum: [0, 1],
        default: 1,
      },
      is_completed: {
        type: Number,
        enum: [0, 1],
        default: 0,
      },
      update: {
        type: Number,
        enum: [0, 1],
        default: 0,
      },
      is_ActiveApproved:{
        type: Number,
        enum: [0, 1],
        default: 1,
      },

})
module.exports = CSTSchema
