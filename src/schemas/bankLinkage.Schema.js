const mongoose = require("mongoose");
const bankLinkageRowsSchema = new mongoose.Schema({
    LinkageId: Number,
    SHGId: Number,
    loanType: String,
    dosage: Number,
    amount: Number,
    bankName: String,
    loanAcNumber: Number,
    roi: Number,
    tenure: Number,
    balance: Number,
    date: String,
    closingDate: String,
    IFSC: String,
    branchName: String,
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


module.exports = bankLinkageRowsSchema;
