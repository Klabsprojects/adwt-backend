const mongoose = require("mongoose");

const requiredString = {
  type: String,
  required: true,
}

const bankDetailsSchema = new mongoose.Schema({
  bankId: Number,
  SHGId: Number,
  IFSC: String,
  bankName: String,
  accountNumber: String,
  branchName: String,
  accountType:String,
  accountStatus:String,
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
  updateCount: {
    type: Number,
    default: 0,
  },
  createdBy: String,
  reject: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  approvedAt: {
    type: Date,
  },
  approvedBY: String,
 
});


module.exports = bankDetailsSchema;
