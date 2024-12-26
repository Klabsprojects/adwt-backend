// const mongo = require("../utils/mongo");

var keyPairs = [

    {
        colName: "Bank Name",
        arrayName: "bankData"
    },
    {
        colName: "Formation year",
        arrayName: "formationData"
    },
    {
        colName: "Category",
        arrayName: "categoryData"
    },
    {
        colName: "SHG Graded",
        arrayName: "gradedData"
    },
    {
        colName: "SHG Audited",
        arrayName: "auditedData"
    },
    {
        colName: "Formed By",
        arrayName: "formedData"
    },
    {
        colName: "Federated with PLF",
        arrayName: "federatedData"
    },
    {
        colName: "Grade",
        arrayName: "gradeData"
    }, {
        colName: "Credit Linked",
        arrayName: "creditLinkedData"
    }, {
        colName: "RF Received",
        arrayName: "rfReceivedData"
    },
    {
        colName: "CIF Received",
        arrayName: "cifReceivedData"
    }, {
        colName: "ASF Received",
        arrayName: "asfReceivedData"
    },
    {
        colName: 'Formed By',
        arrayName: 'formedData'
    }
]

const getAllDistricts = async (req, res) => {
    try {
        const districts = mongo.conn.model("District", {}, "shg");
        var data = await districts
            .find({}, { District: 1, _id: 0 })
            .distinct("District");
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getDistrictData = async (req, res) => {
    try {
        const model = mongo.conn.model("District", {}, "shg");
        var matchQuery = {
            District: req.params.district,
        };
        var resData = {
            districtName: req.params.district,
        }
        if (req.query.block) {
            matchQuery.Block = req.query.block;
            resData.blockName = req.query.block;
        }
        if(req.params.district==='all'){
            matchQuery = {}
            resData.districtName = 'All Districts'
            delete resData.blockName
        }
        var reqDataArray =req.query.reqData? req.query.reqData.split(",") : keyPairs.map((item) => item.arrayName);



        for (var i = 0; i < reqDataArray.length; i++) {
            var keyPair = keyPairs.find((item) => item.arrayName === reqDataArray[i]);
            var data = await getKeyUniqueValue(model, keyPair.colName, matchQuery);
            resData[keyPair.arrayName] = data;
        }


        res.status(200).json(resData);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: error.message });
    }
}

const getDistrictStats = async (req, res) => {
    try {
        const model = mongo.conn.model("District", {}, "shg");
        var matchQuery = {
            District: req.params.district,
        };
        var resData = {
            districtName: req.params.district,
        }
        if(req.params.district==='all'){
            matchQuery = {}
            resData.districtName = 'All Districts'
        }
        if (req.query.block) {
            matchQuery.Block = req.query.block;
            resData.blockName = req.query.block;
        }
        console.log(matchQuery);
        if(req.params.district!=='all'){
            resData.blocks = await getKeyUniqueValue(model, "Block", matchQuery);
        }else{
            resData.blocks=[]
        }
        resData.stats = await getStats(model, matchQuery);
        res.status(200).json(resData);

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: error.message });
    }

}

const getStats = async (model, matchQuery) => {
    var data = await model.find(matchQuery, { "RF Amount": 1, "CIF Amount": 1, "RF Received": 1, "CIF Received": 1, "ASF Amount": 1, "ASF Received": 1, "Total Amount": 1, "Total Savings": 1 },).lean();
    const rfAmount = data.reduce((acc, curr) => acc + curr["RF Amount"], 0);
    const rfReceived = data.filter(
        (item) => item["RF Received"] === "Y"
    ).length;
    const cifAmount = data.reduce((acc, curr) => acc + curr["CIF Amount"], 0);
    const cifReceived = data.filter(
        (item) => item["CIF Received"] === "Y"
    ).length;
    const asfAmount = data.reduce((acc, curr) => acc + curr["ASF Amount"], 0);
    const asfReceived = data.filter(
        (item) => item["ASF Received"] === "Y"
    ).length;
    const totalAmount = data.reduce(
        (acc, curr) => acc + curr["Total Amount"],
        0
    );
    const totalSavings = data.reduce(
        (acc, curr) => acc + curr["Total Savings"],
        0
    );

    const creditLinked = data.filter(
        (item) => item["Credit Linked"] === "Y"
    ).length;
    const shg = data.length;
    let statsData = [rfAmount, cifAmount, asfAmount, totalAmount, totalSavings];

    statsData = statsData.map((number) => {
        let currency = number;
        if (currency >= 10000000)
            currency =
                (number / 10000000).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: "INR",
                }) + " CR";
        else if (currency >= 100000)
            currency =
                (number / 100000).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: "INR",
                }) + " L";
        else if (currency >= 1000)
            currency =
                (number / 1000).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: "INR",
                }) + " k";
        return currency;
    });

    const stats = {
        shg,
        rfReceived,
        rfAmount: statsData[0],
        cifReceived,
        cifAmount: statsData[1],
        asfReceived,
        asfAmount: statsData[2],
        creditLinked,
        totalAmount: statsData[3],
        totalSavings: statsData[4],
    }

    return stats
}



const getKeyUniqueValue = async (model, key, matchQuery) => {
    try {
        const data = await model
            .aggregate([
                {
                    $match: matchQuery,
                },
                {
                    $group: {
                        _id: `$${key}`,
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        string: "$_id",
                        count: 1,
                        _id: 0
                    },
                }
            ])
            .exec();
        return data;
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: error.message });
    }

}

module.exports = {
    getAllDistricts,
    getDistrictData,
    getDistrictStats
};

module.exports.helper = {
    getKeyUniqueValue,
}