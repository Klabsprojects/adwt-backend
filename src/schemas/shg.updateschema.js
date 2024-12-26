const mongoose = require("mongoose");

// const requiredString = {
//     type: String,
//     required: true,
// }

const yesNoEnum = {
  type: String,
  enum: ["yes", "no"],
}

const updateShgSchema = new mongoose.Schema({
  district: String,
  block: String,
  panchayat:String,
  habitation: String,
  isDeleted:{type:Boolean,default:false},
  projectsInSHGArea: {
    TNSRLM: Boolean,
    TNRTP: Boolean,
    PTSLP: Boolean,
    NRETP: Boolean,
  },
  SHGCode: String,
  SHGName: String,
  SHGId:{type:Number,required: true},
  formationDate: String,
  formationYear:Number,
  formedBy: String,
  category: String,
  specialCategory:String,
  meetingFrequency: String,
  totalMembers: {type:Number,default:0},  
  animatorDetails: {
    name: String,
    contact: String,
    MemberId:Number,
  },
  representativeOne: {
    name: String,
    contact: String,
    MemberId:Number,
    
  },
  representativeTwo: {
    name: String,
    contact: String,
    MemberId:Number,

  },
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
  auditingDate:String,
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
  // bankLinkageRows:{
  //   loanType:String,
  //   dosage:Number,
  //   amount:Number,
  //   bankName:String,
  //   loanAcNumber:Number,
  //   roi:Number,
  //   tenure:Number,
  //   balance:Number,
  //   date:String,
  //   closingDate:String,
  //   IFSC:String,
  //   branchName:String,

  // },
  // bankLinkageRows1:{
  //   loanType:String,
  //   dosage:Number,
  //   amount:Number,
  //   bankName:String,
  //   loanAcNumber:Number,
  //   roi:Number,
  //   tenure:Number,
  //   balance:Number,
  //   date:String,
  //   closingDate:String,
  //   IFSC:String,
  //   branchName:String,
  // },
  // bankLinkageRows2:{
  //   loanType:String,
  //   dosage:Number,
  //   amount:Number,
  //   bankName:String,
  //   loanAcNumber:Number,
  //   roi:Number,
  //   tenure:Number,
  //   balance:Number,
  //   closingDate:String,
  //   date:String,
  //   IFSC:String,
  //   branchName:String,
  // },
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
    default: 0 ,
  },
  createdBy:String,
  reject:{
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  CSTApprove: {
    type: Number,
    enum: [0, 1], 
  },
  approvedAt:{
    type: Date,
  },
  approvedBY:String,
  updateStatus:{},
  rejectionSummary:String,
  is_ActiveApproved:{
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  is_ActiveSummary:String,
  updatedBy:String,
  is_ActiveRejectSummary:String,
  is_ActiveReject: {
    type: Number,
    enum: [0, 1],
    default: 0,
  }
  });


module.exports = updateShgSchema;
