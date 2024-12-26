const mongoose = require("mongoose");

const requiredString = {
    type: String,
    required: true,
}

const yesNoEnum = {
  type: String,
  enum: ["","yes", "no"],
}

const shgSchema = new mongoose.Schema({
  district: requiredString,
  block: requiredString,
  panchayat: requiredString,
  habitation: String,
  isDeleted:{type:Boolean,default:false},
  projectsInSHGArea: {
    TNSRLM: Boolean,
    TNRTP: Boolean,
    PTSLP: Boolean,
    NRETP: Boolean,
  },
  SHGCode: String,
  SHGName: requiredString,
  SHGId:{type:Number,unique:true,required:true},
  formationDate: String,
  formationYear:Number,
  formedBy: String,
  category: String,
  specialCategory:String,
  meetingFrequency: String,
  totalMembers: {type:Number,default:0},  
  animatorDetails: Number,
  representativeOne: Number,
  representativeTwo: Number,  
  monitoredBy: String,
  PLF: {
    shgFederated: yesNoEnum,
    dateAffiliated: String,
    amountOfAnnualSubscription: String,
    dateOfLastSubscription: String,
  },
  SHGSavings: {
    memberSaving: Number,
    shgSaving: Number,
    totalSaving: Number,
  },
  ifCST: String,
  CST: Number,
  grading: {
    grading:yesNoEnum,
    category: String,
    date: String,
  },
  auditingDate: String,
  economicAssistance: {
    received: yesNoEnum,
    date: String,
  },
  rf: {
    received: yesNoEnum,
    date: String,
    amount: Number,
  },
  cif: {
    received: yesNoEnum,
    amount: Number,
    date:String
  },
  cif1: {
    received: yesNoEnum,
    amount: Number,
    date:String
  },
  cif2: {
    received: yesNoEnum,
    amount: Number,
    date:String
  },
  asf: {
    received: yesNoEnum,
    amount: Number,
  },
  cap: {
    received: yesNoEnum,
    amount: Number,
    date: String,
  },
  bulkLoan: {
    received: yesNoEnum,
    amount: Number,
    balanceLoan: String,
  }, 
  is_active: {
    type: Number,
    enum: [0, 1], 
    default: 1,   
  },
  CSTApprove: {
    type: Number,
    enum: [0, 1], 
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
    default: 0 ,
  },
  createdBy:String,
  reject:{
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  approvedAt:{
    type: Date,
  },
  approvedBY:String,
  rejectionSummary:String,
  is_ActiveApproved:{
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  is_ActiveSummary:String,
  is_ActiveRejectSummary:String,
  updatedBy:String,
  updateStatus:{},
  is_ActiveReject: {
    type: Number,
    enum: [0, 1],
    default: 0,
  }
  });


module.exports = shgSchema;
