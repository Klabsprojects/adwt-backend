const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const userController = require('../controller/userController');
const roleController = require('../controller/roleController');
const authController = require("../controller/authController");
const permissionsController = require('../controller/permissionsController');
const districtController = require('../controller/districtController');
const cityController = require('../controller/cityController');
const policeDistrictsController = require('../controller/policeDistrictsController');
const districtRevenueController = require('../controller/districtRevenueController');
const offenceController = require('../controller/offenceController');
const rolePermissionsController = require('../controller/rolePermissionsController'); // Ensure the path is correct
const offenceActController = require('../controller/offenceActController');
const offenceReliefDetailsController = require('../controller/offenceReliefDetailsController');
const firController = require('../controller/firController');
const firListController = require('../controller/firListController');
const vmcMeetingController = require('../controller/vmcMeetingController');
const monthlyreportController = require('../controller/monthlyreportController');
const monetaryReliefController = require('../controller/monetaryReliefController');
const additionalreportController = require('../controller/additionalreportController');

const ReliefController = require('../controller/ReliefController');
//const AdditinalReliefController = require('../controller/AdditinalReliefController');
const casteCommunityController = require('../controller/casteCommunityController');
const alteredCaseController = require('../controller/alteredCaseController');

const victimReliefController = require('../controller/victimReliefController');
const AdditionalReliefController = require('../controller/AdditionalReliefController');
const mistakeOfFactController = require('../controller/MistakeOfFactController');
const dashboardController = require('../controller/dashboardController');

const policeStationsController = require('../controller/policeStationsController');
const courtController = require('../controller/courtController');

const getdashboardController = require('../controller/getdashboardController');
const vmcController = require('../controller/vmcController');
const editfircontroller = require('../controller/editfirController');


const dadtwodashboardController = require('../controller/getdadtwodashboardController');
const UploadFileController = require('../controller/uploadController');


router.get('/rolepermissions/:roleId', rolePermissionsController.getRolePermissions);


// router.get('/filter-options', getdashboardController.getFilterOptionData);
// router.post('/apply-filters', getdashboardController.applyfilterData);

// router.get('/dashboard-data', getdashboardController.getDashboardData);
// router.get('/getPTCases', getdashboardController.getDashboardYearData);
// router.get('/getUICases', getdashboardController.getDashboardMonData);
// router.get('/getCaseStatusCounts', getdashboardController.getCaseStatusCounts);
// router.get('/getCaseStatus1Counts', getdashboardController.getCaseStatus1Counts);
// router.get('/chart-bar-data', getdashboardController.getBarChartCounts);
// router.get('/chart-line-data', getdashboardController.getLineChartCounts);
// router.get('/districtsmap', getdashboardController.getDistrictMap);

// Get all users
router.get('/apps/users_new', userController.getAllUsers);
// Create a new user
router.post('/apps/users_new', userController.createUser);
router.put('/apps/users_new/:id', userController.updateUser);
router.delete('/apps/users_new/:id', userController.deleteUser);
router.put('/apps/users_new/:id/status', userController.toggleUserStatus);
router.get('/apps/roles', userController.getAllRoles);
router.get('/apps/rolesnew', roleController.getAllRoles);
router.post('/apps/rolesnew', roleController.addRole);
router.put('/apps/rolesnew/:id', roleController.updateRole);
router.delete('/apps/rolesnew/:id', roleController.deleteRole);
router.put('/apps/rolesnew/:id/status', roleController.toggleRoleStatus);
router.get('/apps/permissions/', permissionsController.getAllPermissions);
router.post('/apps/permissions/', permissionsController.addPermission);
router.put('/apps/permissions/:id', permissionsController.updatePermission);
router.delete('/apps/permissions/:id', permissionsController.deletePermission);
router.get('/apps/permissions/roles', permissionsController.getAllRoles);
router.get('/apps/permissions/:roleId/permissions', permissionsController.getPermissionsByRoleId);
router.put('/apps/permissions/:roleId/permissions/:permissionId', permissionsController.updateRolePermission);
router.post("/auth/login",authController.login);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);
router.post('/auth/reset-password', authController.resetPassword);

// Multer configuration
const uploadFolder = "/home/onlinetn/adwt-backend/uploads/fir_copy";
// const uploadFolder = "uploads/fir_copy";
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });



router.get('/filter-options', getdashboardController.getFilterOptionData);

router.post('/apply-filters', 
  getdashboardController.applyfilterData, 
  getdashboardController.getDashboardData,
);

router.get('/dashboard-data', getdashboardController.getDashboardData);


// Get all districts
router.get('/districts', districtController.getAllDistricts);

// Add a new district
router.post('/districts', districtController.addDistrict);

// Update a district
router.put('/districts/:id', districtController.updateDistrict);

// Delete a district
router.delete('/districts/:id', districtController.deleteDistrict);

// Toggle district status
router.patch('/districts/:id/toggleStatus', districtController.toggleDistrictStatus);

router.get('/cities', cityController.getAllCities);
router.post('/cities', cityController.addCity);


router.put('/cities/:id', cityController.updateCity);
router.delete('/cities/:id', cityController.deleteCity);
router.put('/cities/:id/status', cityController.toggleCityStatus);


// // Get all police districts
router.get('/police-division', policeDistrictsController.getAllPoliceDivisions);

// Get all districts for dropdown selection
router.get('/police-division/districts', policeDistrictsController.getAllDistricts);

// Add a new police district
router.post('/police-division', policeDistrictsController.addPoliceDivision);

// Update a specific police district
router.put('/police-division/:id', policeDistrictsController.updatePoliceDivision);

// Delete a specific police district
router.delete('/police-division/:id', policeDistrictsController.deletePoliceDivision);
// Routes for Nature of Offences
router.get('/nature-of-offences-new', alteredCaseController.getNatureOfOffences_new);


// Routes for Offence Acts
router.get('/offence-acts-new', alteredCaseController.getOffenceActs_new);



// Get all police station
router.get('/police-station', policeStationsController.getAllPoliceStations);

// Get all station for dropdown selection
router.get('/police-station/districts', policeStationsController.getAllDistricts);

// Add a new police station
router.post('/police-station', policeStationsController.addPoliceStation);

// Update a specific police station
router.put('/police-station/:id', policeStationsController.updatePoliceStation);

// Delete a specific police district
router.delete('/police-station/:id', policeStationsController.deletePoliceStation);


// Get all court
router.get('/court', courtController.getAllcourt);

// Add a new court
router.post('/court', courtController.addCourt);

// Update a specific court
router.put('/court/:id', courtController.updateCourt);

// Delete a specific court
router.delete('/court/:id', courtController.deleteCourt);




// Get all revenue districts
router.get('/revenue-districts', districtRevenueController.getAllRevenueDistricts);

// Get all districts for dropdown selection
router.get('/districts', districtRevenueController.getAllDistricts);

// Add a new revenue district
router.post('/revenue-districts', districtRevenueController.addRevenueDistrict);

// Update a specific revenue district
router.put('/revenue-districts/:id', districtRevenueController.updateRevenueDistrict);

// Delete a specific revenue district
router.delete('/revenue-districts/:id', districtRevenueController.deleteRevenueDistrict);

// Get all offences
router.get('/offences', offenceController.getAllOffences);

// Add a new offence
router.post('/offences', offenceController.addOffence);

// Update a specific offence
router.put('/offences/:id', offenceController.updateOffence);

// Delete a specific offence
router.delete('/offences/:id', offenceController.deleteOffence);


// Define routes
router.get('/offenceact', offenceActController.getAllOffenceActs);
router.post('/offenceact', offenceActController.addOffenceAct);
router.put('/offenceact/:id', offenceActController.updateOffenceAct);
router.delete('/offenceact/:id', offenceActController.deleteOffenceAct);
router.patch('/offenceact/:id/toggle-status', offenceActController.toggleOffenceActStatus);

router.get('/caste', casteCommunityController.getAllCastes);
router.post('/caste', casteCommunityController.addCaste);
router.put('/caste/:id', casteCommunityController.updateCaste);
router.delete('/caste/:id', casteCommunityController.deleteCaste);
router.patch('/caste/:id/toggle-status', casteCommunityController.toggleCasteStatus);

// Route to get user details
router.post('/fir/user-details', firController.getUserDetails);

router.get('/fir/details', firController.getFirDetails);

router.get('/fir/firEditdetails', editfircontroller.getFirDetailsFirEdit);

router.get('/fir/police-stations', firController.getPoliceStations);

// Route to get police division details
router.get('/fir/police-division', firController.getPoliceDivisionDetails);
router.get('/fir/police-divisionedit', editfircontroller.getPoliceDivisionDetailsedit);

router.get('/fir/status/:firId', firController.getFirStatus);

router.get('/fir/police-revenue', firController.getAllRevenues);

// Route to save an investigation officer
// router.post('/fir/save-officer', firController.saveInvestigationOfficer);

// Define routes for fetching data from tables
router.get('/fir/offences', firController.getAllOffences); // Fetch offence names from offence table
router.get('/fir/offence-acts', firController.getAllOffenceActs); // Fetch offence acts from offence_acts table
router.get('/fir/scst-sections', editfircontroller.getAllCastes); // Fetch SC/ST sections from caste_community table
// Route to fetch all court divisions
router.get('/fir/court-divisions', firController.getAllCourtDivisions);

router.get('/fir/remove-chargesheet-image', editfircontroller.removechargesheet);
router.get('/fir/remove-chargesheet-relief', editfircontroller.removechargesheetrelief);

// Get all offences relief details
router.get('/fir/offence/relief/details', offenceReliefDetailsController.getAllOffenceReliefDetails);

// Route to fetch court ranges by division
router.get('/fir/court-ranges', firController.getCourtRangesByDivision);
// Route to fetch all districts
router.get('/fir/districts', firController.getAllDistricts);


// Route to fetch all accused communities
router.get('/fir/accused-communities', firController.getAllAccusedCommunities);

// Route to fetch accused castes based on community
router.get('/fir/accused-castes-by-community', firController.getAccusedCastesByCommunity);


// Route to fetch all communities
router.get('/fir/communities', firController.getAllCommunities);

// Route to fetch castes based on community
router.get('/fir/castes-by-community', firController.getCastesByCommunity);


router.post('/fir/handle-step-one', firController.handleStepOne);

router.post('/fir/handle-Step-Two', firController.handleStepTwo);
// Add this route for Step 3 in your routes file
router.post('/fir/handle-step-three', firController.handleStepThree);
router.post('/fir/handle-step-four', firController.handleStepFour);
router.post('/fir/handle-step-five', firController.handleStepFive);

// router.post('/fir/save-step-six', firController.handleStepSix);



router.post(
  "/fir/handle-step-four",
  upload.single("uploadFIRCopy"), // Multer middleware
  (req, res) => {
    //console.log("Route hit: /fir/handle-step-four");
    //console.log("File details:", req.file); // File details will be populated
    //console.log("Request body:", req.body); // Non-file fields

    if (!req.file) {
      console.error("File upload failed: No file received");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadedFilePath = `/uploads/fir_copy/${req.file.filename}`;
    //console.log("Uploaded file path:", uploadedFilePath);

    firController.handleStepFour(req, res, uploadedFilePath);
  }
);


router.post(
  "/vmcmeeting/submit-meeting",
  upload.single("uploadedFile"), // Multer middleware for file upload
  (req, res) => {
    // Validate file upload
    if (!req.file) {
      console.error("File upload failed: No file received");
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Construct the file path for storage in the database
    const uploadedFilePath = `/uploads/fir_copy/${req.file.filename}`;
    console.log("Uploaded file path:", uploadedFilePath);

    // Pass the request to the controller, including the file path
    vmcMeetingController.submitMeeting(req, res, uploadedFilePath);
  }
);

router.post('/vmcmeeting/getAttendeesByDistrictbysk', vmcMeetingController.getAttendeesByDistrictbysk);
// Reports
router.get('/monthlyreport/get-monthly-report-details', monthlyreportController.getmonthlyreportdetail);
router.get('/monetaryRelief/get-monetary-relief-details', monetaryReliefController.getmonetaryReliefDetails);
router.get('/additionalreport/getadditionalreportdetail', additionalreportController.getadditionalreportdetail);

router.post('/fir/handle-step-five', firController.handleStepFive);

router.post('/fir/save-step-six', firController.handleStepSix);
router.get('/fir_list/list', firListController.getFirList);
router.get('/fir_list/view', firListController.getFirView);


// Route for fetching number of victims and victim names by FIR ID
router.get('/fir/victims-details/:firId', firController.getVictimsReliefDetails);
// Add this route for updating FIR status
// routes.js or similar route file
router.put('/fir/update-status', firController.updateFirStatus);
router.get('/fir-relief/victims-details_1/:firId', ReliefController.getVictimsReliefDetails_1);

router.get('/fir-relief/second-installment/:firId', ReliefController.getSecondInstallmentDetails);

// Route to delete a FIR by ID
router.delete('/fir_list/delete/:id', firListController.deleteFir);



// Route to update FIR status
router.put('/fir_list/update-status/:id', firListController.updateFirStatus);

router.get('/fir-relief', ReliefController.getFIRReliefList);
//router.get('/fir-additinal-relief', AdditinalReliefController.getFIRAdditionalReliefList);


//router.post('/offence-acts', OffenceController.getOffenceActsBySections);

router.get('/scstSectionsOptions', alteredCaseController.getAlteredPoAOptions);


router.get('/natureOfOffenceOptions', alteredCaseController.getNatureOfOffenceOptions);

//router.post('/altered-case/:firId', alteredCaseController.addAlteredCase);
// Route to get victim relief details by FIR ID
router.get('/victims-details/:firId', victimReliefController.getVictimReliefDetails);


router.post('/fir/update-status_1', firController.updateFirStatus_1);




router.get('/fir-additional-relief', AdditionalReliefController.getFIRAdditionalReliefList);
router.get('/fir-additional-relief-ByVictim', AdditionalReliefController.getFIRAdditionalReliefListByVictim);

router.get('/victims', AdditionalReliefController.getVictimDetailsByFirId);


router.get('/victims_new', alteredCaseController.getVictimsByFirId);
router.post('/update-victims', alteredCaseController.updateVictims);


router.post('/update-victim-count-and-details', alteredCaseController.updateVictimCountAndDetails);

router.post('/mistake-of-fact', mistakeOfFactController.addOfficerDetails);

router.post('/offence-acts_victim', alteredCaseController.getOffenceActsBySections);
router.post('/offence-acts_victim_new', alteredCaseController.getOffenceActsBySections_new);
router.get('/get-victim-names/:firId', alteredCaseController.getVictimNames);
router.post('/save-accused-data', alteredCaseController.handleAccusedData);


router.post('/fir-relief/save-first-installment', ReliefController.saveFirstInstallment);
router.post('/fir-relief/save-second-installment', ReliefController.saveSecondInstallment);
router.post('/fir-relief/trial_relief_save', ReliefController.saveThirdInstallmentDetails);
router.post('/fir-relief/Fetch_relief_details', ReliefController.AllReliefDetails);
router.post('/fir/save-step-seven', firController.saveStepSevenAsDraft);
// router.post('/fir/save-step-sevenedit', editfircontroller.editStepSevenAsDraft);
router.post('/fir/save-step-sevenedit', editfircontroller.saveEditStepSevenAsDraft);
router.get('/fir-relief/trial_relief/:firId', ReliefController.getTrialReliefDetails);
router.post('/fir/save-step-fiveedit', editfircontroller.updateStepFive);
router.post('/fir/save-step-sixedit', editfircontroller.Update_step6);

//router.get('/dashboard-data/:roleId', dashboardController.getDashboardData);

router.get('/user/:id', dashboardController.getUserById);


// Get all users
router.get('/vmc', vmcController.getAllMembers);
// Create a new user
router.post('/vmc', vmcController.createMember);
router.put('/vmc/:id', vmcController.updateMember);
router.delete('/vmc/:id', vmcController.deleteMember);
router.put('/vmc/:id/status', vmcController.toggleMemberStatus);

router.get('/vmc/districts', vmcController.getAllDistricts);
router.get('/vmc/subdivisions', vmcController.getSubdivisionsByDistrict);


router.get('/vmcmeeting/districts', vmcMeetingController.getDistricts);
router.get('/vmcmeeting/attendees/', vmcMeetingController.getAttendeesByLocation);

router.get('/dadtwo-dashboard-data', dadtwodashboardController.getDashboardData);

router.post('/applybarchartgivenDataFilters',dadtwodashboardController.applybarchartgivenDataFilters);
router.post('/applybarchartpendingDataFilters',dadtwodashboardController.applybarchartpendingDataFilters);
// router.get('/vmcmeeting/statuses', vmcMeetingController.getMeetingStatuses);

router.post('/FileUpload', UploadFileController.UploadFiles);
router.post('/save-additional-relief', AdditionalReliefController.saveAdditionalRelief);

router.get('/get-additional-relief-details', AdditionalReliefController.getAdditionalReliefByFirId);

module.exports = router;