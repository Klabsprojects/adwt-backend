const mongo = require("../utils/mongo");

const getShgCategory = async (req, res) => {
    try {
        const model = mongo.conn.model("SHG", {}, "shg");
        var data = await getConsolidatedDataForKey(model, req.params.category, req)
        // var data = await model.aggregate([
        //     { $group: { _id: { District: "$District", Category: "$Category" }, count: { $sum: 1 } } },
        //     { $group: { _id: "$_id.District", counts: { $push: { category: "$_id.Category", count: "$count" } } } },
        //     { $project: { _id: 0, districtName: "$_id", counts: 1 } }
        //   ])
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getKeyCategory = async(req,res)=>{
    try {
        const model = mongo.conn.model("SHG", {}, "shg");
        var data = await getConsolidatedDataForKey(model, req.params.category, req)
        var keys = await model.distinct(req.params.category);
        res.status(200).json({keys,data});
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const view = async(req,res)=>{
    console.log("sdfsdfsfd");
    res.sendFile(__dirname + '/index.html');
}

//get shg members and total shgs per district
const getShgMembers = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const model = mongo.conn.model("SHG", {}, "shg");
        var { startDate, endDate } = dateGetter(req)
        var data = await model.aggregate([
            {
                $match: {
                    "Formation Date": { $ne: "" },
                }
            },
            {
                $addFields: {
                    "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                }
            },
            {
                $match: {
                    $and: [
                        { "date": { $gte: startDate } },
                        { "date": { $lte: endDate } }
                    ]
                },
            },
            {
                $group: {
                    _id: '$District',
                    Members: { $sum: '$Total Members' },
                    SHGs: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    district: '$_id',
                    Members: 1,
                    SHGs: 1
                }
            }
        ]
        )
        console.log(data);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//no of block, habitation, panchayaths
const getConsolidatedDistrict = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const model = mongo.conn.model("SHG", {}, "shg");
        var { startDate, endDate } = dateGetter(req)
        var data = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                }
            },
            {
                $match: {
                    $and: [
                        { "date": { $gte: startDate } },
                        { "date": { $lte: endDate } }
                    ]
                },
            },
            {
                $group: {
                    _id: "$District",
                    uniqueBlocks: { $addToSet: "$Block" },
                    uniquePanchayats: { $addToSet: "$Panchayat" },
                    uniqueHabitations: { $addToSet: "$Habitation" }
                }
            },
            {
                $project: {
                    district: "$_id",
                    Blocks: { $size: "$uniqueBlocks" },
                    Panchayats: { $size: "$uniquePanchayats" },
                    Habitations: { $size: "$uniqueHabitations" },
                    _id: 0
                }
            }
        ])

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//get total number of branches for each unique banks
const getConsolidatedBanks = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const model = mongo.conn.model("SHG", {}, "shg");
        var { startDate, endDate } = dateGetter(req)
        var data = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                }
            },
            {
                $match: {
                    $and: [
                        { "date": { $gte: startDate } },
                        { "date": { $lte: endDate } }
                    ]
                },
            },
            {
                $group: {
                    _id: { "Bank Name": "$Bank Name", "Branch Name": "$Branch Name" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.Bank Name",
                    Branches: { $sum: "$count" }
                }
            },
            {
                $project: {
                    bankName: "$_id",
                    Branches: 1,
                    _id: 0
                }
            }
        ])

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//get monthCount financialYearCount and cumilativeCount.
//use query month and year to set month and year. no query will default to current month and year
const getConsolidatedFormation = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const model = mongo.conn.model("SHG", {}, "shg");

        var { startDate, endDate } = dateGetter(req)
        const month = endDate.getMonth() + 1;
        const year = endDate.getFullYear()-1; //TODO: remove this in prod

        const monthData = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "month": { $month: { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } } },
                    "year": { $year: { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } } }
                }
            },
            {
                $match: {
                    $and: [
                        { "month": month },
                        { "year": year }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        district: "$District"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.district": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    monthlyCount: "$count",
                    district: "$_id.district"

                }
            }
        ]);


        const fyData = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "year": { $year: { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } } }
                }
            },
            {
                $match: {
                    "year": year
                }
            },
            {
                $group: {
                    _id: {
                        district: "$District"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.district": 1
                }
            },

            {
                $project: {
                    _id: 0,
                    fyCount: "$count",
                    district: "$_id.district",

                }
            }
        ]);

        var cumilativeData = await model.aggregate([
            {
                $group: {
                    _id: '$District',
                    cumilativeCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    district: '$_id',
                    cumilativeCount: 1
                }
            }
        ]
        )


        var data = monthData.map(mc => {
            const yc = fyData.find(yc => yc.district === mc.district);
            return {
                district: mc.district,
                monthCount: mc.monthlyCount,
                cumilativeCount: yc ? yc.cumilativeCount : 0,
                fyCount: yc ? yc.fyCount : 0
            }
        });

        data = data.map(d => {
            const cc = cumilativeData.find(cc => cc.district === d.district);
            return {
                district: d.district,
                monthCount: d.monthCount,
                fyCount: d.fyCount,
                cumilativeCount: cc ? cc.cumilativeCount : 0
            }
        });


        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//get shg categorized by formation age. three months old, six months old , nine months old and more than nine months old
//use query month and year to set month and year. no query will default to current month and year
const getShgAge = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        var { startDate, endDate } = dateGetter(req)
        var month = endDate.getMonth() + 1;
        var year = endDate.getFullYear();

        const model = mongo.conn.model("SHG", {}, "shg");

        const threeMonthsAgo = new Date(year, month - 2, 1);
        const sixMonthsAgo = new Date(year, month - 5, 1);
        const nineMonthsAgo = new Date(year, month - 8, 1);
        console.log(threeMonthsAgo, sixMonthsAgo, nineMonthsAgo);
        month = month.toString()
        year = year.toString()
        const data = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    fmDate: { $toDate: "$Formation Date" }
                }
            },
            {
                $group: {
                    _id: {
                        District: "$District",

                    },
                    TotalSHGs: { $sum: 1 },
                    ThreeMonthsOld: {
                        $sum: {
                            $cond: {
                                if: { $gte: ["$fmDate", threeMonthsAgo] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                    SixMonthsOld: {
                        $sum: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $lt: ["$fmDate", threeMonthsAgo] },
                                        { $gte: ["$fmDate", sixMonthsAgo] },
                                    ],
                                },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                    NineMonthsOld: {
                        $sum: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $lt: ["$fmDate", sixMonthsAgo] },
                                        { $gte: ["$fmDate", nineMonthsAgo] },
                                    ],
                                },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                    MoreThanNineMonthsOld: {
                        $sum: {
                            $cond: {
                                if: { $lte: ["$fmDate", nineMonthsAgo] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    district: "$_id.District",
                    TotalSHGs: 1,
                    ThreeMonthsOld: 1,
                    SixMonthsOld: 1,
                    NineMonthsOld: 1,
                    MoreThanNineMonthsOld: 1
                }
            }
        ]);
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//get consolidated plf data
const getConsolidatedPlfData = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const model = mongo.conn.model("SHG", {}, "shg");
        var { startDate, endDate } = dateGetter(req)
        var data = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                }
            },
            {
                $match: {
                    $and: [
                        { "date": { $gte: startDate } },
                        { "date": { $lte: endDate } }
                    ]
                },
            },
            {
                $group: {
                    _id: {
                        District: "$District",
                    },
                    TotalSHGs: { $sum: 1 },
                    TotalCSTs: { $sum: { $cond: { if: { $eq: ["$Monitored by", "CST"] }, then: 1, else: 0 } } },
                    TotalPLFs: { $sum: { $cond: { if: { $eq: ["$Federated with PLF", "Y"] }, then: 1, else: 0 } } },
                    PLFAnnualSubscription: { $sum: { $convert: { input: "$Annual Subscription", to: "long", onError: 0, onNull: 0 } } },
                    TotalSavings: { $sum: { $convert: { input: "$Total Savings", to: "long", onError: 0, onNull: 0 } } },
                }
            },
            {
                $project: {
                    _id: 0,
                    district: "$_id.District",
                    TotalSHGs: 1,
                    TotalCSTs: 1,
                    TotalPLFs: 1,
                    PLFAnnualSubscription: 1,
                    TotalSavings: 1
                }
            }
        ]);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
//get audit data
const getConsolidatedAuditData = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        console.log(req.query);
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const model = mongo.conn.model("SHG", {}, "shg");
        var { startDate, endDate } = dateGetter(req)
        var data = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                }
            },
            {
                $match: {
                    $and: [
                        { "date": { $gte: startDate } },
                        { "date": { $lte: endDate } }
                    ]
                },
            },
            {
                $group: {
                    _id: {
                        District: "$District",
                    },
                    TotalSHGs: { $sum: 1 },
                    TotalAudited: { $sum: { $cond: { if: { $eq: ["$SHG Audited", "Y"] }, then: 1, else: 0 } } },
                    TotalGraded: { $sum: { $cond: { if: { $eq: ["$SHG Graded", "Y"] }, then: 1, else: 0 } } },


                }
            },
            {
                $project: {
                    _id: 0,
                    district: "$_id.District",
                    TotalSHGs: 1,
                    TotalAudited: 1,
                    TotalGraded: 1
                }
            }
        ]);

        var gradeData = await getConsolidatedDataForKey(model, "Grade",req)

        data = data.map((item) => {
            var grade = gradeData.find((gradeItem) => gradeItem.district === item.district);
            if (grade) {
                item = { ...item, ...grade };
            }
            return item;
        });


        res.status(200).json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}
//get finance asist details, type should only be = RF, CIF,ASF,Bulk Loan,CAP
const getFinanceAssistData = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const type = req.params.type;
        const model = mongo.conn.model("SHG", {}, "shg");
        var { startDate, endDate } = dateGetter(req)
        var data = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                }
            },
            {
                $match: {
                    $and: [
                        { "date": { $gte: startDate } },
                        { "date": { $lte: endDate } }
                    ]
                },
            },
            {
                $group: {
                    _id: {
                        District: "$District",
                    },
                    TotalSHGs: { $sum: 1 },
                    [`NoOfSHGReceived${type}`]: { $sum: { $cond: { if: { $eq: [`$${type} Received`, "Y"] }, then: 1, else: 0 } } },
                    [`TotalAmount${type}Received`]: { $sum: `$${type} Amount`, }
                }

            },
            {
                $project: {
                    _id: 0,
                    district: "$_id.District",
                    TotalSHGs: 1,
                    [`NoOfSHGReceived${type}`]: 1,
                    [`TotalAmount${type}Received`]: 1,

                }
            }
        ]);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//linkage data with amount
const getBankLinkageData = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const model = mongo.conn.model("SHG", {}, "shg");
        console.log(req.query.formed);
        var { startDate, endDate } = dateGetter(req)
        var data = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                }
            },
            {
                $match: {
                    $and: [
                        { "date": { $gte: startDate } },
                        { "date": { $lte: endDate } }
                    ]
                },
            },
            {
                $group: {
                    _id: {
                        District: "$District",
                    },
                    TotalSHGs: { $sum: 1 },
                    SHGReceivedLinkage: { $sum: { $cond: { if: { $eq: ["$Credit Linked", "Y"] }, then: 1, else: 0 } } },
                    TotalAmount: { $sum: { $cond: { if: { $eq: ["$Credit Linked", "Y"] }, then: "$Total Amount", else: 0 } } },
                    SHGWithLink1: { $sum: { $cond: { if: { $eq: ["$No of Linkages", 1] }, then: 1, else: 0 } } },
                    Link1Amount: { $sum: { $cond: { if: { $eq: ["$No of Linkages", 1] }, then: "$Total Amount", else: 0 } } },
                    SHGWithLink2: { $sum: { $cond: { if: { $eq: ["$No of Linkages", 2] }, then: 1, else: 0 } } },
                    Link2Amount: { $sum: { $cond: { if: { $eq: ["$No of Linkages", 2] }, then: "$Total Amount", else: 0 } } },
                    SHGWithLink3: { $sum: { $cond: { if: { $eq: ["$No of Linkages", 3] }, then: 1, else: 0 } } },
                    Link3Amount: { $sum: { $cond: { if: { $eq: ["$No of Linkages", 3] }, then: "$Total Amount", else: 0 } } },
                    SHGWithMoreThanLink3: { $sum: { $cond: { if: { $gt: ["$No of Linkages", 3] }, then: 1, else: 0 } } },
                    MoreThanLink3Amount: { $sum: { $cond: { if: { $gt: ["$No of Linkages", 3] }, then: "$Total Amount", else: 0 } } },
                    NoLinkage: { $sum: { $cond: { if: { $eq: ["$Credit Linked", "N"] }, then: 1, else: 0 } } },
                }
            },
            {
                $project: {
                    _id: 0,
                    district: "$_id.District",
                    TotalSHGs: 1,
                    SHGReceivedLinkage: 1,
                    TotalAmount: 1,
                    SHGWithLink1: 1,
                    Link1Amount: 1,
                    SHGWithLink2: 1,
                    Link2Amount: 1,
                    SHGWithLink3: 1,
                    Link3Amount: 1,
                    SHGWithMoreThanLink3: 1,
                    MoreThanLink3Amount: 1,
                    NoLinkage: 1,
                    NoLinkageTest: 1,
                }
            }
        ]);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
//grouped by banks and no of shgs linked with total amount
const getBanksInfo = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed

        const model = mongo.conn.model("SHG", {}, "shg");
        var { startDate, endDate } = dateGetter(req)
        var data = await model.aggregate([
            {
                $match: matchObj
            },
            {
                $addFields: {
                    "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                }
            },
            {
                $match: {
                    $and: [
                        { "date": { $gte: startDate } },
                        { "date": { $lte: endDate } }
                    ]
                },
            },
            {
                $group: {
                    _id: {
                        bankName: "$Bank Name",
                    },
                    TotalSHGs: { $sum: 1 },
                    TotalAmount: { $sum: "$Total Amount" },
                }
            },
            {
                $project: {
                    _id: 0,
                    bankName: "$_id.bankName",
                    TotalSHGs: 1,
                    TotalAmount: 1,
                }
            }
        ])
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getUniqueCategories = async (req, res) => {
    try {
        var matchObj = { "Formation Date": { $ne: "" } }
        if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
        const model = mongo.conn.model("SHG", {}, "shg");
        const data = await model.distinct(req.params.uniqueCategory);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


module.exports = {
    getShgCategory,
    getShgMembers,
    getConsolidatedFormation,
    getConsolidatedDistrict,
    getConsolidatedBanks,
    getConsolidatedPlfData,
    getConsolidatedAuditData,
    getFinanceAssistData,
    getBankLinkageData,
    getBanksInfo,
    getShgAge,
    getUniqueCategories,
    getKeyCategory,
    view
}

const getConsolidatedDataForKey = async (model, key, req) => {
    return new Promise(async (resolve, reject) => {
        try {
            var matchObj = { "Formation Date": { $ne: "" } }
            if (req.query.formed !== "" && req.query.formed) matchObj["Formed By"] = req.query.formed
            var { startDate, endDate } = dateGetter(req)
            var data = await model.aggregate([
                {
                    $match: {
                        "Formation Date": { $ne: "" }
                    }
                },
                {
                    $addFields: {
                        "date": { $dateFromString: { dateString: "$Formation Date", format: "%d-%m-%Y" } }
                    }
                },
                {
                    $match: {
                        $and: [
                            { "date": { $gte: startDate } },
                            { "date": { $lte: endDate } }
                        ]
                    },
                },
                { $addFields: { [key]: { $toString: `$${key}` } } },
                { $group: { _id: { District: "$District", [key]: `$${key}` }, count: { $sum: 1 } } },
                { $group: { _id: "$_id.District", counts: { $push: { k: `$_id.${key}`, v: "$count" } } } },
                { $replaceRoot: { newRoot: { $mergeObjects: [{ district: "$_id" }, { $arrayToObject: "$counts" }] } } }
            ]);
            resolve(data);
        } catch (e) {
            reject(e);
        }
    });

}

const getUniqueKeys = async (model, category) => {
    return new Promise(async (resolve, reject) => {
        try {
            var data = await model.distinct(category);
            resolve(data);
        } catch (e) {
            reject(e);
        }
    });
}


const dateGetter = (req) => {
    console.log(req.query.startDate, req.query.endDate);
    var startDate, endDate
    
    if (req.query.startDate && req.query.endDate) {
        
        startDate = new Date(req.query.startDate)
        endDate = new Date(req.query.endDate)
    }
    else if (req.query.endDate && !req.query.startDate) {
        startDate = new Date("01-01-1900")
        endDate = new Date(req.query.endDate)
    }
    else if (!req.query.endDate && req.query.startDate) {
        startDate = new Date(req.query.startDate)
        endDate = new Date()
    }
    else {
        startDate = new Date("01-01-1900")
        endDate = new Date()
    }
    return { startDate, endDate }
}
