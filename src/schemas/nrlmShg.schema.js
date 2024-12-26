const mongoose = require("mongoose");

const yesNoEnum = {
    type: String,
    enum: ["Yes", "No"]
}

const nrlmShgSchema = new mongoose.Schema({
    state_name: String,
    district_name: String,
    block_name: String,
    grampanchayat_name: String,
    village_name: String,
    shg_name: String,
    shg_code: Number,
    Shg_type: String,
    promoted_by: String,
    group_formation_date: String,
    micro_plan_prepared: yesNoEnum,
    basic_shg_training: yesNoEnum,
    bookkeeper_identified: yesNoEnum,
    standard_bookkeeping_practices: yesNoEnum,
    meeting_frequency: String,
    usual_amount_of_saving: Number,
    bank_name: String,
    bank_branch_name: String,
    bank_account_no: Number,
    op_date_of_account:String,
    No_of_member: Number,
    sc: Number,
    st: Number,
    obc: Number,
    other: Number,
    minority: Number,
    male: Number,
    female: Number,
    apl: Number,
    bpl: Number,
    POP: Number,
    poor: Number,
    nonpoor: Number,
    having_aadhaar: Number,
    mobile_number: Number,
    PWD: Number,
    cooption_date: String,
    active_status: yesNoEnum,
    completed_status: yesNoEnum,
    cif_status: yesNoEnum,
    cif_amount: Number,
    rf_status: yesNoEnum,
    rf_amount: Number,
    federated_with_VO: yesNoEnum,
    date_of_joining_with_VO: String,
    VO_code: String,
    VO_name: String,
    federated_with_CLF: yesNoEnum,
    date_of_joining_with_CLF: String,
    CLF_code: Number,
    CLF_name: String,
    start_up_fund_amt: Number,
    source_type: String,
    start_up_fund_release_date: String,
    createdBy: String,
    updatedBy: String,
    updatedAt:Date,
    createdAt:Date,
    member_update_status: {
        type: Number,
        enum: [0, 1],
        default: 0,
    },

})
module.exports = nrlmShgSchema;