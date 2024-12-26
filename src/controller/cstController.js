const CSTDetailsSchema = require("../schemas/cst.Schema");
const CSTSchema = require("../schemas/cst.Schema");
const CSTPendingSchema = require("../schemas/cstPending.schema");
// const mongo = require("../utils/mongo");
const shgSchema = require("../schemas/shg.schema");
const shgMemberSchema = require("../schemas/shgMember.schema");
const Schema = require("../schemas/shgMember.schema");
const CSTLocationSchema = require("../schemas/cstlocation.Schema");

const handleInvalidQuery = (res, message = "") => {
  return res.status(201).send({ message: `no data found` });
}; 
const getTest = async (req, res) => {
  try {
    const data = { status: true, message: "test" };
    return res.send(data);
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};
const addcst = async (req, res) => {
  try {
    const memberModel = mongo.conn.model("CST", CSTSchema, "SHGMember");
    const memberPendingModel = mongo.conn.model(
      "CST",
      CSTPendingSchema,
      "SHGMemberPending"
    );
    const shgModel = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const cstModel = mongo.conn.model("CST", CSTLocationSchema, "CSTLocation");
    const data = req.body;
    const cstData = { ...data };
    delete cstData["panchayat"];
    delete cstData["habitation"];
    delete cstData["SHGName"];
    cstData.district = cstData.district.toUpperCase();
    cstData.block = cstData.block.toUpperCase();
    cstData.is_active = 1;
    cstData.approved = 0;
    cstData.updateCount = 0;
    cstData.is_ActiveApproved = 1;

    const { panchayat, habitation } = data;

    const SHGIdList = data.SHGName;
    cstData.ApprovedStatus = {
      CSTDetail: "",
      AADHAR: "",
      smartCard: "",
      contact: "",
      nodalArea: "",
    };

    const existingMember = await memberModel.findOne({
      AADHAR: data.AADHAR,
      is_active: 1,
    });
    if (existingMember && existingMember.memberStatus === 1) {
      cstData.memberStatus = 3;
      cstData.MemberId = existingMember.MemberId;
    } else {
      cstData.memberStatus = 2;
      cstData.MemberId = await getCSTId();
    }

    /* ADD NEW CST DATA IN MEMBER TABLE */
    const newCST = new memberModel(cstData);
    const newCSTPending = new memberPendingModel(cstData);
    const response1 = await newCST.save();
    const response2 = await newCSTPending.save();

    /* update CST Id in SHG Collection */
    if (response1 && response2) {
      SHGIdList.map(async (id) => {
        const cstDataUpdate = await shgModel.findOneAndUpdate(
          { SHGId: Number(id) },
          { $set: { CST: cstData.MemberId, CSTApprove: 0 } }
        );
      });
    } else {
      return res
        .status(400)
        .json({
          status: false,
          error: `Invalid SHG data SHGId :${id} or request`,
        });
    }

    /* ADD CST LOCATION DATA */
    if (response1 && response2) {
      habitation.map(async (hab_id) => {
        const locations = await getLocationData(Number(hab_id));

        const location = JSON.parse(JSON.stringify(locations));
        const CSTDetails = {};
        CSTDetails.district = location["district"];
        CSTDetails.block = location.block;
        CSTDetails.panchayat = location.panchayat;
        CSTDetails.habitation = location.habitation;
        CSTDetails.habitation_id = location.habitation_id;
        CSTDetails.villagecode = location.villagecode;
        CSTDetails.createdBy = data.createdBy;
        CSTDetails.is_active = 1;
        CSTDetails.createdAt = new Date();
        CSTDetails.CSTId = cstData.MemberId;
        CSTDetails.approved = 0;
        CSTDetails.isDeleted = false;

        const addLocationdata = new cstModel(CSTDetails);
        const result = await addLocationdata.save();
        if (result) {
          return res
            .status(200)
            .json({ status: true, error: "Added CST Details" });
        }
      });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, error: "Invalid data or request" });
  }
};

const getCST = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");

    var { district, block, limit, skip } = req.query;
    limit = limit ? parseInt(limit) : 100;
    skip = skip ? parseInt(skip) : 0;
    var query = { isDeleted: false, is_active: 1, approved: 1, reject: 0 };
    district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
    block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
    const data = await model
      .find(
        { ...query, memberStatus: 2, is_ActiveApproved: 1, is_ActiveReject: 0 },
        { _id: 0, __v: 0 }
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .skip(skip);
    const count = await model.countDocuments(query);
    const totalCount = await model.countDocuments();
    if (data.length <= 0) {
      return handleInvalidQuery(
        res,
        "No SHGs found in village, create shg first"
      );
    }
    res.set("SHG-Total-Count", count);
    return res.send(data);
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};




/* GET CST DETAILS IN SPECIFIC CST ID */

const getCSTs = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");
    const pendingModel = mongo.conn.model(
      "CST",
      CSTPendingSchema,
      "SHGMemberPending"
    );
    const shgModel = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const cstLocationModel = mongo.conn.model(
      "CST",
      CSTLocationSchema,
      "CSTLocation"
    );

    const MemberId = Number(req.params.MemberId);
    const data = await model.findOne({ MemberId, memberStatus: 2 });
    const shglist = await shgModel.find(
      { CST: MemberId, CSTApprove: 1 },
      { _id: 0 }
    );
    const shgPending = await shgModel.find(
      { CST: MemberId, CSTApprove: 0 },
      { _id: 0 }
    );
    const locationList = await cstLocationModel.find({ CSTId: MemberId });
    const panchayatList = [];
    const habitationList = [];
    locationList.map((list) => {
      panchayatList.push(list.panchayat);
      habitationList.push(list.habitation_id);
    });
    const panchayat =
      panchayatList.length > 1 ? [...new Set(panchayatList)] : [...panchayatList];
    data.shg = [...shglist];
    data.panchayat = [...panchayat];
    data.habitation = [...habitationList];
    let pendingData;
    let pendingMerge;
    if (data.approved === 0) {
      pendingData = await pendingModel.findOne(
        { MemberId, approved: 0 },
        { _id: 0 }
      );
    }

    const result = {
      status: "Success",
      data: {
        ...data["_doc"],
        shg: [...shglist],
        panchayat,
        habitation: [...habitationList],
      },
      newData:
        data.approved === 0
          ? { ...pendingData["_doc"], shg: [...shgPending] }
          : "",
    };
    return res.send({ ...result });
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};

const getPendingCST = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");

    var { district, block, panchayat, habitation, limit, skip } = req.query;
    limit = limit ? parseInt(limit) : 100;
    skip = skip ? parseInt(skip) : 0;
    var query = {
      isDeleted: false,
      is_active: 1,
      approved: 0,
      reject: 0,
      is_ActiveApproved: 1,
      is_ActiveReject: 0,
    };
    district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
    block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
    panchayat
      ? (query.panchayat = { $regex: new RegExp(panchayat, "i") })
      : null;
    habitation
      ? (query.habitation = { $regex: new RegExp(habitation, "i") })
      : null;
    const data = await model
      .find(
        {
          ...query,
          memberStatus: 2,
          approved: 0,
          reject: 0,
          is_ActiveApproved: 1,
          is_ActiveReject: 0,
        },
        { _id: 0, __v: 0 }
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .skip(skip);
    const count = await model.countDocuments(query);
    const totalCount = await model.countDocuments();
    if (data.length <= 0) {
      return handleInvalidQuery(
        res,
        "No SHGs found in village, create shg first"
      );
    }
    res.set("SHG-Total-Count", count);
    return res.send(data);
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};
const getRejectCST = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");

    var { district, block, limit, skip } = req.query;
    limit = limit ? parseInt(limit) : 100;
    skip = skip ? parseInt(skip) : 0;
    var query = { isDeleted: false, is_active: 1, approved: 1, reject: 1 };
    district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
    block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
    const data = await model
      .find(
        {
          ...query,
          memberStatus: 2,
          reject: 1,
          is_ActiveApproved: 1,
          is_ActiveReject: 0,
        },
        { _id: 0, __v: 0 }
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .skip(skip);

    const count = await model.countDocuments(query);
    const totalCount = await model.countDocuments();
    if (data.length <= 0) {
      return handleInvalidQuery(
        res,
        "No SHGs found in village, create shg first"
      );
    }
    res.set("SHG-Total-Count", count);
    return res.send(data);
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};

const approveCST = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");
    const pendingModel = mongo.conn.model(
      "CST",
      CSTPendingSchema,
      "SHGMemberPending"
    );
    const shgModel = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const cstLocationModel = mongo.conn.model(
      "CST",
      CSTLocationSchema,
      "CSTLocation"
    );
    const { MemberId, ApprovedStatus, approvedBY } = req.body;

    /* GET CST (UPDATED OR NEW) DETAILS USING ID  */
    const getCSTData = await pendingModel.findOne({
      MemberId: Number(MemberId),
    });
    if (!getCSTData) {
      return res.status(404).json({
        status: false,
        error: `No unapproved cst ${MemberId} in CST pending`,
      });
    }

    if (getCSTData.updateCount === 0) {
      const sendquery = {};
      const allStatusTrue = Object.values(ApprovedStatus).every(
        (item) => item.status === "true"
      );
      let approveMember, approvePendingMember, approveCSTLocation, approveshg;
      if (allStatusTrue) {
        /* MEMBER COLLECTION */
        approveMember = await model.findOneAndUpdate(
          { MemberId: Number(MemberId), approved: 0 },
          {
            $set: {
              approved: 1,
              approvedBY,
              reject: 0,
              rejectionSummary: "",
              ApprovedStatus: { ...ApprovedStatus },
              approvedAt: new Date(),
            },
          },
          { new: true }
        );
        /* MEMBER PENDING COLLECTION */
        approvePendingMember = await pendingModel.findOneAndUpdate(
          { MemberId: Number(MemberId) },
          {
            $set: {
              approved: 1,
              ApprovedStatus: { ...ApprovedStatus },
              approvedBY,
              reject: 0,
              rejectionSummary: "",
              approvedAt: new Date(),
            },
          },
          { new: true }
        );

        /* SHG COLLECTION */
        approveshg = await shgModel.updateMany(
          { CST: Number(MemberId) },
          { $set: { CSTApprove: 1 } },
          { new: true }
        );

        /* SHG COLLECTION */
        approveCSTLocation = await cstLocationModel.updateMany(
          { CSTId: Number(MemberId) },
          {
            $set: {
              approved: 1,
              reject: 0,
              rejectionSummary: "",
              approvedAt: new Date(),
            },
          },
          { new: true }
        );
      } else if (ApprovedStatus.AADHAR.status === "false") {
        const rejectionSummary = ApprovedStatus.AADHAR.rejectSummary;
        /* MEMBER COLLECTION */
        approveMember = await model.findOneAndUpdate(
          { MemberId: Number(MemberId), approved: 0 },
          {
            $set: {
              approved: 1,
              approvedBY,
              reject: 1,
              rejectionSummary,
              ApprovedStatus: { ...ApprovedStatus },
              approvedAt: new Date(),
            },
          },
          { new: true }
        );
        /* MEMBER PENDING COLLECTION */
        approvePendingMember = await pendingModel.findOneAndUpdate(
          { MemberId: Number(MemberId) },
          {
            $set: {
              approved: 1,
              ApprovedStatus: { ...ApprovedStatus },
              approvedBY,
              approvedAt: new Date(),
            },
          },
          { new: true }
        );

        /* SHG COLLECTION */
        approveshg = await shgModel.updateMany(
          { CST: Number(MemberId) },
          { $set: { CST: 0 } },
          { new: true }
        );

        /* SHG COLLECTION */
        approveCSTLocation = await cstLocationModel.updateMany(
          { CSTId: Number(MemberId), approved: 0 },
          {
            $set: {
              approved: 1,
              reject: 1,
              rejectionSummary,
              approvedBY,
              approvedAt: new Date(),
            },
          },
          { new: true }
        );
      } else {
        const sendquery = {};

        if (ApprovedStatus.CSTDetail.status === "false") {
          const data = {
            fatherName: "",
            cstAge: 0,
            DOB: "",
            gender: "",
            education: "",
            email: "",
            roleofCST: "",
          };

          /* MEMBER COLLECTION */
          approveMember = await model.findOneAndUpdate(
            { MemberId: Number(MemberId), approved: 0 },
            {
              $set: {
                approved: 1,
                approvedBY,
                rejectionSummary: "",
                ApprovedStatus: { ...ApprovedStatus },
                ...data,
                approvedAt: new Date(),
              },
            },
            { new: true }
          );
          /* MEMBER PENDING COLLECTION */
          approvePendingMember = await pendingModel.findOneAndUpdate(
            { MemberId: Number(MemberId) },
            {
              $set: {
                approved: 1,
                ApprovedStatus: { ...ApprovedStatus },
                approvedBY,
                rejectionSummary: "",
                approvedAt: new Date(),
              },
            },
            { new: true }
          );

          /* SHG COLLECTION */
          approveshg = await shgModel.updateMany(
            { CST: Number(MemberId) },
            { $set: { CSTApprove: 1 } },
            { new: true }
          );

          /* SHG COLLECTION */
          approveCSTLocation = await cstLocationModel.updateMany(
            { CSTId: Number(MemberId), approved: 0 },
            {
              $set: {
                approved: 1,
                reject: 0,
                rejectionSummary: "",
                approvedBY,
                approvedAt: new Date(),
              },
            },
            { new: true }
          );
        } else if (ApprovedStatus.nodalArea.status === "false") {
          const rejectionSummary = ApprovedStatus.nodalArea.rejectSummary;

          /* MEMBER COLLECTION */
          approveMember = await model.findOneAndUpdate(
            { MemberId: Number(MemberId), approved: 0 },
            {
              $set: {
                approved: 1,
                approvedBY,
                rejectionSummary: "",
                ApprovedStatus: { ...ApprovedStatus },
                approvedAt: new Date(),
              },
            },
            { new: true }
          );
          /* MEMBER PENDING COLLECTION */
          approvePendingMember = await pendingModel.findOneAndUpdate(
            { MemberId: Number(MemberId) },
            {
              $set: {
                approved: 1,
                ApprovedStatus: { ...ApprovedStatus },
                approvedBY,
                rejectionSummary: "",
                approvedAt: new Date(),
              },
            },
            { new: true }
          );

          /* SHG COLLECTION */
          approveshg = await shgModel.updateMany(
            { CST: Number(MemberId) },
            { $set: { CST: 0 } },
            { new: true }
          );

          /* SHG COLLECTION */
          approveCSTLocation = await cstLocationModel.updateMany(
            { CSTId: Number(MemberId), approved: 0 },
            {
              $set: {
                approved: 1,
                reject: 1,
                rejectionSummary,
                approvedBY,
                approvedAt: new Date(),
              },
            },
            { new: true }
          );
        }
      }
    }else{
        const query ={}
        const CSTDetail={
            memberName:'',
            fatherName:'',
            memberAge:'',
            DOB:'',
            gender:'',
            education:'',
            aknowlege:'',
            email:'',
            roleofCST:''
        };
        const allStatusTrue = Object.values(ApprovedStatus).every(item => item.status === "true");

        if(allStatusTrue){
            update1 = await cstPending.findOneAndUpdate(
                { MemberId, approved: 0 },
                { $set: { ApprovedStatus, reject: 0, approved: 1, approvedBY, approvedAt: new Date() } },
                { new: true }
            );
            update2 = await model.findOneAndUpdate(
                { MemberId },
                {
                    $set: {
                        ...updatedData, approved: 1, reject: 0,approvedAt: new Date(), ApprovedStatus,approvedBY
                    }
                },
                { new: true }
            );
            if(ApprovedStatus?.nodalArea?.status==='true'){
                const locationUpdate = await cstLocationModel.updateMany({MemberId},{$set:{approvedBY,approved:1, approvedAt:new Date()}},{new:true});
                const shgUpdates = await shgModel.updateMany({CST:Number(MemberId)},{CSTApprove:1},{new:true})
            }
        }else{
            
            if(ApprovedStatus?.AADHAR?.status==='false'){
                let rejectSummary;
                if (ApprovedStatus.AADHAR?.status == 'false') {
                    rejectSummary = ApprovedStatus.AADHAR.rejectSummary
                }
                update2 = await model.findOneAndUpdate(
                    { MemberId },
                    { $set: { approved: 1, reject: 1, rejectSummary, approvedBY, approvedAt: new Date(), ApprovedStatus } },
                    { new: true }
                );

                update1 = await cstPending.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { ApprovedStatus, approved: 1, approvedBY, approvedAt: new Date(), reject: 1 } },
                    { new: true }
                );
            }
            if(ApprovedStatus?.CSTDetail?.status==='true'){
                update1 = await cstPending.findOneAndUpdate(
                    { MemberId, approved: 0 },
                    { $set: { ApprovedStatus, reject: 0, approved: 1, approvedBY, approvedAt: new Date() } },
                    { new: true }
                );
                update2 = await model.findOneAndUpdate(
                    { MemberId },
                    {
                        $set: {
                            ...updatedData, approved: 1, reject: 0,approvedAt: new Date(), ApprovedStatus,approvedBY
                        }
                    },
                    { new: true }
                );
            }
            if(ApprovedStatus?.nodalArea?.status==='true'){
                const locationUpdate = await cstLocationModel.updateMany({MemberId},{$set:{approvedBY,approved:1, approvedAt:new Date()}},{new:true});
                const shgUpdates = await shgModel.updateMany({CST:Number(MemberId)},{CSTApprove:1},{new:true})
            }
        }
        
    }
    return res
      .status(200)
      .json({ status: true, message: "Approved Successfully!!!" });
  } catch (error) {
    return res.status(404).json({
      status: false,
      error: `No member found with MemberId: `,
    });
  }
};
/* INACTIVE CST MACKER */
const inactiveCST = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");
    const pendingModel = mongo.conn.model(
      "CST",
      CSTPendingSchema,
      "SHGMemberPending"
    );

    const { MemberId, updatedBy, is_ActiveSummary } = req.body;
    /* INACTIVE CST(MEMBER)  COLLECTION */
    const cst = await model.findOneAndUpdate(
      { MemberId: Number(MemberId) },
      { $set: { is_ActiveApproved: 0, approved: 0 } }
    );
    /* INACTIVE CST(MEMBER) PENDING COLLECTION */
    const query = {
      MemberId: Number(MemberId),
      is_ActiveApproved: 0,
      approved: 0,
      is_active: 0,
      is_ActiveSummary,
      updatedBy,
      updateAt: new Date(),
    };
    const inactiveRequest = new pendingModel(query);
    const cstPending = await inactiveRequest.save();
    if (cst && cstPending) {
      return res.status(200).json({
        status: true,
        message: "Incative Succefully",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, error: "Error retrieving member data" });
  }
};

/* INACTIVE UN APPROVED CST GET LIST  */
const getInactiveUnapproved = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");

    var { district, block, limit, skip } = req.query;
    limit = limit ? parseInt(limit) : 100;
    skip = skip ? parseInt(skip) : 0;
    var query = { isDeleted: false, is_active: 1 };
    district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
    block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
    const data = await model
      .find(
        {
          ...query,
          memberStatus: 2,
          is_ActiveApproved: 0,
          is_ActiveReject: 0,
          approved: 0,
        },
        { _id: 0, __v: 0 }
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .skip(skip);
    const count = await model.countDocuments(query);
    const totalCount = await model.countDocuments();
    if (data.length <= 0) {
      return handleInvalidQuery(
        res,
        "No SHGs found in village, create shg first"
      );
    }
    res.set("SHG-Total-Count", count);
    return res.send(data);
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};

/* INACTIVE APPROVED */
const inactiveCSTApprove = async (req, res) => {
  try {
    const { MemberId, approvedBY } = req.body;
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");
    const pendingModel = mongo.conn.model(
      "CST",
      CSTPendingSchema,
      "SHGMemberPending"
    );
    const shgModel = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const cstLocationModel = mongo.conn.model(
      "CST",
      CSTLocationSchema,
      "CSTLocation"
    );

    const getUpdatedData = await pendingModel.findOne({
      MemberId: Number(MemberId),
      approved: 0,
      is_ActiveApproved: 0,
    });

    if (!getUpdatedData) {
      return res.status(201).json({
        status: "error",
        message: `This CST ${MemberId} not found in pending list`,
      });
    }

    const inactiveCST = await model.findOneAndUpdate(
      { MemberId: Number(MemberId), approved: 0 },
      {
        $set: {
          approved: 1,
          is_active: 0,
          is_ActiveApproved: 1,
          is_ActiveReject: 0,
          is_ActiveRejectSummary: "",
          is_ActiveSummary: getUpdatedData.is_ActiveSummary,
          updatedBy: getUpdatedData.updatedBy,
          updateAt: getUpdatedData.updateAt,
          approvedBY,
          approvedAt: new Date(),
        },
      }
    );

    const inactivePendingCST = await pendingModel.findOneAndUpdate(
      { MemberId: Number(MemberId), approved: 0 },
      {
        $set: {
          approved: 1,
          is_active: 0,
          is_ActiveApproved: 1,
          is_ActiveSummary: getUpdatedData.is_ActiveSummary,
          updatedBy: getUpdatedData.updatedBy,
          updateAt: getUpdatedData.updateAt,
          approvedBY,
          approvedAt: new Date(),
        },
      }
    );

    const shgUpdate = await shgModel.findOneAndUpdate(
      { CST: Number(MemberId) },
      { $set: { CST: 0 } }
    );
    const cstLocationUpdate = await cstLocationModel.updateMany(
      { CSTId: Number(MemberId) },
      { is_active: 0, closingDate: getUpdatedData.updateAt }
    );

    if (inactiveCST && inactivePendingCST && shgUpdate && cstLocationUpdate) {
      return res
        .status(200)
        .send({ status: true, message: `Approved Successfully` });
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};

/* INACTIVE APPROVED LIST */
const getInactiveApproved = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");

    var { district, block, limit, skip } = req.query;
    limit = limit ? parseInt(limit) : 100;
    skip = skip ? parseInt(skip) : 0;
    var query = { isDeleted: false };
    district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
    block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
    const data = await model
      .find(
        {
          ...query,
          memberStatus: 2,
          is_ActiveApproved: 1,
          is_ActiveReject: 0,
          approved: 1,
          is_active: 0,
        },
        { _id: 0, __v: 0 }
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .skip(skip);
    const count = await model.countDocuments(query);
    const totalCount = await model.countDocuments();
    if (data.length <= 0) {
      return handleInvalidQuery(
        res,
        "No SHGs found in village, create shg first"
      );
    }
    return res.send(data);
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};

/* INACTIVE REJECT  */
const inactiveCSTReject = async (req, res) => {
  try {
    const { MemberId, approvedBY, is_ActiveRejectSummary } = req.body;
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");
    const pendingModel = mongo.conn.model(
      "CST",
      CSTPendingSchema,
      "SHGMemberPending"
    );

    const getUpdatedData = await pendingModel.findOne({
      MemberId: Number(MemberId),
      approved: 0,
      is_ActiveApproved: 0,
    });

    if (!getReason) {
      return res.status(201).json({
        status: "error",
        message: `This CST ${MemberId} not found in pending list`,
      });
    }

    const inactiveCST = await model.findOneAndUpdate(
      { MemberId: Number(MemberId), approved: 0 },
      {
        $set: {
          approved: 1,
          is_active: 1,
          is_ActiveApproved: 1,
          is_ActiveReject: 1,
          is_ActiveRejectSummary,
          approvedBY,
          approvedAt: new Date(),
        },
      }
    );

    const inactivePendingCST = await pendingModel.findOneAndUpdate(
      { MemberId: Number(MemberId), approved: 0 },
      {
        $set: {
          approved: 1,
          is_active: 0,
          is_ActiveApproved: 1,
          is_ActiveReject: 1,
          is_ActiveRejectSummary,
          approvedBY,
          approvedAt: new Date(),
        },
      }
    );

    if (inactiveCST && inactivePendingCST) {
      return res
        .status(200)
        .send({ status: true, message: `Approved Successfully` });
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};
/* INACTIVE REJECT LIST */

const getInactiveReject = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");

    var { district, block, limit, skip } = req.query;
    limit = limit ? parseInt(limit) : 100;
    skip = skip ? parseInt(skip) : 0;
    var query = { isDeleted: false };
    district ? (query.district = { $regex: new RegExp(district, "i") }) : null;
    block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
    const data = await model
      .find(
        {
          ...query,
          memberStatus: 2,
          is_ActiveApproved: 1,
          is_ActiveReject: 1,
          approved: 1,
          is_active: 1,
        },
        { _id: 0, __v: 0 }
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .skip(skip);
    const count = await model.countDocuments(query);
    const totalCount = await model.countDocuments();
    if (data.length <= 0) {
      return handleInvalidQuery(
        res,
        "No SHGs found in village, create shg first"
      );
    }
    res.set("SHG-Total-Count", count);
    return res.send(data);
  } catch (e) {
    return res
      .status(400)
      .send({ status: false, error: `Invalid Query err: ${e.message}` });
  }
};

/* UPDATE CST */
const updateCST = async (req, res) => {
  try {
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");
    const pendingModel = mongo.conn.model(
      "CST",
      CSTPendingSchema,
      "SHGMemberPending"
    );
    const shgModel = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const cstLocationModel = mongo.conn.model(
      "CST",
      CSTLocationSchema,
      "CSTLocation"
    );
    /* DECLARE NEW DATA */
    const newData = req.body;
    const MemberId = Number(req.body.MemberId);
    const updatedBy = req.body.updatedBy;
   const memberData =await getCSTOldData(MemberId) ;
   const {updateCount, oldData} ={...memberData};
   const comapredData= await compareObjects(oldData,newData);
   const CSTDetail=[
    "memberName",
    "fatherName",
    "memberAge",
    "DOB",
    "gender",
    "education",
    "aknowlege",
    "email",
    "roleofCST",
   ];
   ApprovedStatus={}

   for (const field of Object.keys(comapredData)) {
        if (CSTDetail.includes(field)) {
            ApprovedStatus['CSTDetail'] = '';
        } else if (field==='AADHAR') {
            ApprovedStatus['AADHAR'] = '';
        } else if (field==='smartCard') {
            ApprovedStatus['smartCard'] = '';
        } else if (field==='contact') {
            ApprovedStatus['contact'] = '';
        } else if (field=== 'SHGName' ||field=== 'panchayat'||field=== 'habitation') {
            ApprovedStatus['nodalArea'] = '';
        }
    }

    const cstUpdates = await model.updateOne({MemberId},{$set:{approved:0}},{new:true});
    const updatedDataList={
        MemberId,
        ...comapredData,
        updateAt:new Date(),
        updatedBy,
        updateCount:updateCount+1,
        ApprovedStatus:{...ApprovedStatus},
        approved:0,
        is_ActiveApproved:1
    }    
    const cstPendingUpdate =  new pendingModel(updatedDataList);
    const cstPendingSave = await cstPendingUpdate.save();
     if(comapredData?.habitation?.length>0){
        comapredData?.habitation.map(async (hab_id) => {
            const locations = await getLocationData(Number(hab_id));
    
            const location = JSON.parse(JSON.stringify(locations));
            const CSTDetails = {};
            CSTDetails.district = location["district"];
            CSTDetails.block = location.block;
            CSTDetails.panchayat = location.panchayat;
            CSTDetails.habitation = location.habitation;
            CSTDetails.habitation_id = location.habitation_id;
            CSTDetails.villagecode = location.villagecode;
            CSTDetails.createdBy = updatedBy;
            CSTDetails.is_active = 1;
            CSTDetails.createdAt = new Date();
            CSTDetails.CSTId = MemberId;
            CSTDetails.approved = 0;
            CSTDetails.isDeleted = false;
    
            const addLocationdata = new cstLocationModel(CSTDetails);
            const result = await addLocationdata.save();
            
          });

    }
    if(comapredData?.SHGName?.length>0){
        comapredData?.SHGName.map(async (id) => {
            const cstDataUpdate = await shgModel.updateMany(
              { SHGId: Number(id) },
              { $set: { CST: MemberId, CSTApprove: 0 } },{new:true}
            );
          });
    }
    return res.status(200).json({status:'Success', message:"Updated successfully!!!"})

  } catch (e) {
    return res.status(400).json({status:'false', error:e})

  }
};
const addcst1 = async (req, res) => {
  try {
    const model1 = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const data = req.body;
    const SHGIds = data.SHGId;
    const MemberId = data.MemberId;
    const CST = {
      MemberId: MemberId,
    };
    const SHGIdArray = Array.isArray(SHGIds) ? SHGIds : [SHGIds];
    for (const SHGId of SHGIdArray) {
      const query = { SHGId };
      const update = {
        $set: { CST: CST },
      };
      await model1.updateOne(query, update);
    }

    return res
      .status(200)
      .send({ status: true, message: "CST updated successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, error: "Invalid data or request" });
  }
};

const getcstdetails = async (req, res) => {
  try {
    const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
    const memberStatus2Data = await model.find({ memberStatus: 2 });
    const totalCountMemberStatus2 = memberStatus2Data.length;
    const memberStatus3Data = await model.find({ memberStatus: 3 });
    const totalCountMemberStatus3 = memberStatus3Data.length;
    return res.status(200).json({
      status: true,
      memberStatus2: {
        totalCount: totalCountMemberStatus2,
        data: memberStatus2Data,
      },
      memberStatus3: {
        totalCount: totalCountMemberStatus3,
        data: memberStatus3Data,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, error: "Internal server error" });
  }
};

const getCSTForMember = async (req, res) => {
  try {
    const Member = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
    const memberId = req.params.memberId;
    // Find the member by MemberId
    const member = await Member.findOne({ MemberId: memberId });
    if (!member) {
      return res.status(404).json({
        status: false,
        error: `No member found with MemberId: ${memberId}`,
      });
    }
    return res.status(200).json({
      status: true,
      member: {
        contact: member.contact,
        shgName: member.SHGName,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, error: "Error retrieving member data" });
  }
};

const shgList = async (req, res) => {
  try {
    const data = await getLocationData(req.query.id);
    if (data) {
      let datas = JSON.parse(JSON.stringify(data));
      const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
      let { district, block, panchayat, habitation } = datas;
      var query = { isDeleted: false, is_active: 1, approved: 1, reject: 0 };
      district
        ? (query.district = { $regex: new RegExp(district, "i") })
        : null;
      block ? (query.block = { $regex: new RegExp(block, "i") }) : null;
      panchayat
        ? (query.panchayat = { $regex: new RegExp(panchayat, "i") })
        : null;
      habitation
        ? (query.habitation = { $regex: new RegExp(habitation, "i") })
        : null;
      const list = await model.find({ ...query, CST: 0 }, { _id: 0, __v: 0 });
      return res.send(list);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, error: "Error habitation data" });
  }
};

module.exports = {
  getcstdetails,
  addcst,
  addcst1,
  getCSTForMember,
  shgList,
  getCST,
  getCSTs,
  getPendingCST,
  getRejectCST,
  approveCST,
  inactiveCST,
  inactiveCSTApprove,
  getInactiveUnapproved,
  getInactiveApproved,
  inactiveCSTReject,
  getInactiveReject,
  updateCST,
  getTest,
};

const updateCstId = async (cstId, shgId) => {
  const shgModel = mongo.conn.model("SHG", shgSchema, "shgMapTest");

  const cstUpdate = await shgModel.findOne({ SHGId: Number(shgId) });
  return cstUpdate;
};

const getLocationData = async (habitationId) => {
  const model = mongo.conn.model("locationData", {}, "locationData");
  const locationData = await model.findOne(
    { habitation_id: Number(habitationId) },
    { _id: 0 }
  );
  return locationData;  
};

const getCSTId = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const model = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
      var data = await model.find({ memberStatus: 2 }, { MemberId: 1, _id: 0 });
      var memberId = 2;
      if (!data.length <= 0) {
        data.sort((a, b) => parseInt(a.MemberId) - parseInt(b.MemberId));
        var lastMember = data[data.length - 1];
        const MemId = JSON.parse(JSON.stringify(lastMember));
        memberId = MemId.MemberId + 1;
      } else {
        memberId = 2 * 10000 + 1;
      }
      return resolve(memberId);
    } catch (e) {
      return reject(e);
    }
  });
};

/* COMAPARE VALUE */
function compareObjects(oldData, newData) {
  let obj1 = JSON.parse(JSON.stringify(oldData));
  let obj2 = JSON.parse(JSON.stringify(newData));
  const diff = {};

  for (const key in obj2) {
    if (typeof obj2[key] === "object" && obj2[key] !== null) {
      if (
        !obj1.hasOwnProperty(key) ||
        typeof obj1[key] !== "object" ||
        obj1[key] === null
      ) {
        diff[key] = obj2[key];
      } else {
        const nestedDiff = compareObjects1(obj1[key], obj2[key]);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      }
    } else if (obj1[key] !== obj2[key]) {
      diff[key] = obj2[key];
    }
  }

  return diff;
}
function compareObjects1(arr1, arr2) {
  const diff1 = arr1.filter((item) => !arr2.includes(item));
  const diff2 = arr2.filter((item) => !arr1.includes(item));
  const differences = [...diff1, ...diff2];
  return differences;
}


const getCSTOldData=async(id)=>{
    MemberId=Number(id)
    const model = mongo.conn.model("CST", CSTSchema, "SHGMember");
    const pendingModel = mongo.conn.model(
      "CST",
      CSTPendingSchema,
      "SHGMemberPending"
    );
    const shgModel = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const cstLocationModel = mongo.conn.model(
      "CST",
      CSTLocationSchema,
      "CSTLocation"
    );
    /* DECLARE NEW DATA */
    
    /* GET OLD DATA */
    const memData = await model.findOne(
      { MemberId },
      {
        _id: 0,
        isDeleted: 0,
        memberStatus: 0,
        reject: 0,
        is_active: 0,
        approved: 0,
        createdBy:0,
        is_ActiveApproved:0,
        is_ActiveReject:0,
        ApprovedStatus:0,
        approvedAt:0,
        rejectionSummary:0,
        __v:0
      }
    );
    const memberData = JSON.parse(JSON.stringify(memData))
    const memUpdateCount =memberData.updateCount;
    delete memberData.updateCount;
    
    /* GET PANCHAYAT AND HABITATION LIST */
    const locationList = await cstLocationModel.find({CSTId:MemberId});
    const panchayatList = [];
    const habitationList =[];
    locationList.map((key)=>{
        panchayatList.push(key.panchayat);
        habitationList.push(key.habitation_id)
    });
    const panchayat =[...new Set(panchayatList)]
    memberData.panchayat=panchayat;
    memberData.habitation=habitationList;

    /* GET HABITATION LIST */
    const shgList = await shgModel.find({CST:MemberId},{SHGId:1,_id:0});
    const SHGName = []
    shgList.map((list)=>{
        SHGName.push(list.SHGId)
    });
    memberData.SHGName =SHGName;
    const data={        
        updateCount:memUpdateCount,
        oldData:memberData
    }
    return data
}