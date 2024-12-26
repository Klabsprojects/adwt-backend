const mongoose = require("mongoose");

const requiredString = {
    type: String,
    required: true,
}

const yesNoEnum = {
  type: String,
  enum: ["yes", "no",""],
}

const shgSchemaInComplete = new mongoose.Schema({
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
  SHGId:Number,
  Id:{type:Number,unique:true,required:true},
  formationDate: String,
  formationYear:Number,
  formedBy: String,
  category: String,
  specialCategory:String,
  meetingFrequency: String,
  totalMembers: {type:Number,default:0},
  bankDetails: {
    IFSC: String,
    bankName: String,
    accountNumber: String, 
    branchName:String,
    accountType:String,
    accountStatus:String,
  },
  bankDetails1: {
    IFSC: String,
    bankName: String,
    accountNumber: String, 
    branchName:String,
    accountType:String,
    accountStatus:String,
  },
  bankDetails2: {
    IFSC: String,
    bankName: String,
    accountNumber: String, 
    branchName:String,
    accountType:String,
    accountStatus:String,
  },
  animatorDetails: {
    name: String,
    contact: String,
    MemberId:Number
    
  },
  representativeOne: {
    name: String,
    contact: String,
    MemberId:Number
  },
  representativeTwo: {
    name: String,
    contact: String,
    MemberId:Number

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
  CST: {name:String,contact:Number,MemberId:Number},
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
  bankLinkageRows:{
    loanType:String,
    dosage:Number,
    amount:Number,
    bankName:String,
    loanAcNumber:Number,
    roi:Number,
    tenure:Number,
    balance:Number,
    date:String,
    closingDate:String,
    IFSC:String,
    branchName:String
  },
  bankLinkageRows1:{
    loanType:String,
    dosage:Number,
    amount:Number,
    bankName:String,
    loanAcNumber:Number,
    roi:Number,
    tenure:Number,
    balance:Number,
    date:String,
    closingDate:String,
    IFSC:String,
    branchName:String
  },
  bankLinkageRows2:{
    loanType:String,
    dosage:Number,
    amount:Number,
    bankName:String,
    loanAcNumber:Number,
    roi:Number,
    tenure:Number,
    balance:Number,
    closingDate:String,
    date:String,
    IFSC:String,
    branchName:String

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
  updatedBy:String,
  is_ActiveApproved:{
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  Status:{
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  is_ActiveReject:{
    type:Number,
    enum:[0,1],
    default:0
  }
  });


module.exports = shgSchemaInComplete;
