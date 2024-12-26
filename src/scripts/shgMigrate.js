const shgSchema = require("../schemas/shg.schema");
const mongo = require("../utils/mongo");

async function shgMigrate() {
    try {
        var skip = 0;
        //run until 282389 shgs are migrated
        var limit = 10000
        let newShgModel = await mongo.conn.model("shg", shgSchema, "shgMapTest");
        while (skip < 282389) {
            let shgs = await getShgs(limit, skip);
            console.log(shgs.length)
            let newShgs = [];
            for (let shg of shgs) {
                const newShg = await mapper(shg);
                if(!newShg.SHGName){
                    newShg.SHGName = "No Name"
                }
                newShgs.push(newShg);
            }

            await newShgModel.insertMany(newShgs,{ordered:false}).catch(e=>console.log(e.message));

            skip += limit;
            console.log(skip,'done')
        }
        console.log("fully done")
    } catch (e) {
        console.log(e.message);
    }
}

async function getShgs(limit, skip) {
    try {
        let model = await mongo.conn.model("shgOld", {}, "shg")
        let shgs = await model.find({}).limit(limit).skip(skip).lean();
        return shgs;
    } catch (e) {
        console.log(e);
    }
}

async function mapper(input) {
    // console.log(input["SHG Name"])
    let newShg = {
        district: input["District"]?.toUpperCase(),
        block: input["Block"]?.toUpperCase(),
        panchayat: input["Panchayat"]?.toUpperCase(),
        habitation: input["Habitation"]?.toUpperCase(),
        projectsInSHGArea: {
          TNSRLM: input["Formed By"] === "TNSRLM",
          TNRTP: false,
          PTSLP: false,
          NRETP: false,
        },
        SHGCode: input["SHG Code"],
        SHGName: input["SHG Name"],
        SHGId: input["SHG ID"],
        formationDate: input["Formation Date"],
        formationYear: input["Formation year"],
        formedBy: input["Formed By"],
        category: input["Category"],
        specialCategory:input["Special Category"],
        meetingFrequency: input["Meeting Frequency"],
        totalMembers: input["Total Members"]?input["Total Members"]:0,
        bankDetails: {
          IFSC: "",
          bankName: input["Bank Name"],
          accountNumber: input["Account Number"],
          branchName: input["Branch Name"],
        },
        animatorDetails: {
          name: input["Animator Name"],
          contact: input["Contact Number"],
        },
        representativeOne: {
          name: input["Rep 1"],
          contact: "",
        },
        representativeTwo: {
          name: input["Rep 2"],
          contact: "",
        },
        monitoredBy: input["Monitored by"],
        ifCST: "no",
        CST: {
          name: "",
          contact: "",
        },
        PLF: {
          shgFederated: input["Federated with PLF"] === "Y"?"yes":"no",
          dateAffiliated: input["Federated Date"],
          amountOfAnnualSubscription: input["Annual Subscription"],
          dateOfLastSubscription: "",
        },
        SHGSavings: {
          memberSaving: input["Member Savings"],
          shgSaving: input["Total Amount"],
          totalSaving: input["Total Savings"],
        },
        grading: {
          grading: input["grading"]==="Y"?"yes":"no",
          category: input["Grade"],
          date: input["Graded Date"],
          auditingDate: input["Audited Date"],
        },    
        economicAssistance: {
          received: {
            value: input["SHG Audited"] === "Y"? "yes":"no",
          },
          date: "",
        },
        rf: {
          received: input["RF Received"]==="Y"?"yes":"no",
          amount: input["RF Amount"],
          date: "",
        },
        cif: {
          received: input["CIF Received"]==="Y"?"yes":"no",
          amount: input["CIF Amount"],
        },
        asf: {
          received: input["ASF Received"]==="Y"?"yes":"no",
          amount: input["ASF Amount"],
        },
        cap: {
          received: input["CAP Received"]==="Y"?"yes":"no",
          amount: input["CAP Amount"],
          date: input["CAP Received"] === "Y" ? input["Audited Date"] : "",
        },
        bulkLoan: {
          received: input["Bulk Loan Received"]==="Y"?"yes":"no",
          amount: input["Bulk Loan Amount"],
          balanceLoan: input["Balance Outstanding"],
        },
      }
      // console.log('after',newShg.SHGName)
    return newShg;
}
shgMigrate()