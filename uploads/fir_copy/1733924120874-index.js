const express = require("express");
const router = express.Router();

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
const firController = require('../controller/firController'); 
const firListController = require('../controller/firListController'); 

const ReliefController = require('../controller/ReliefController');
const casteCommunityController = require('../controller/casteCommunityController');
const alteredCaseControllerNew = require('../controller/alteredCaseController');

const AdditionalReliefController = require('../controller/AdditionalReliefController');
const policeStationsController = require('../controller/policeStationsController');
const courtController = require('../controller/courtController');

const dashboardController = require('../controller/getdashboardController');






router.get('/rolepermissions/:roleId', rolePermissionsController.getRolePermissions);

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


router.get('/filter-options', dashboardController.getFilterOptionData);
router.post('/apply-filters', dashboardController.applyfilterData);

router.get('/dashboard-data', dashboardController.getDashboardData);
router.get('/getPTCases', dashboardController.getDashboardYearData);
router.get('/getUICases', dashboardController.getDashboardMonData);
router.get('/getCaseStatusCounts', dashboardController.getCaseStatusCounts);
router.get('/getCaseStatus1Counts', dashboardController.getCaseStatus1Counts);
router.get('/chart-bar-data', dashboardController.getBarChartCounts);
router.get('/chart-line-data', dashboardController.getLineChartCounts);
router.get('/districtsmap', dashboardController.getDistrictMap);
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

// Route to get police division details
router.get('/fir/police-division', firController.getPoliceDivisionDetails);



router.get('/fir/police-revenue', firController.getAllRevenues);

// Route to save an investigation officer
// router.post('/fir/save-officer', firController.saveInvestigationOfficer);

// Define routes for fetching data from tables
router.get('/fir/offences', firController.getAllOffences); // Fetch offence names from offence table
router.get('/fir/offence-acts', firController.getAllOffenceActs); // Fetch offence acts from offence_acts table
router.get('/fir/scst-sections', firController.getAllCastes); // Fetch SC/ST sections from caste_community table


router.post('/fir/handle-step-one', firController.handleStepOne);

router.post('/fir/handle-Step-Two', firController.handleStepTwo);
// Add this route for Step 3 in your routes file
router.post('/fir/handle-step-three', firController.handleStepThree);

router.post('/fir/handle-step-four', firController.handleStepFour);

router.post('/fir/handle-step-five', firController.handleStepFive);

//router.post('/fir/save-step-six', firController.saveStepSix);
router.get('/fir_list/list', firListController.getFirList);


// Route for fetching number of victims and victim names by FIR ID
router.get('/fir/victims-details/:firId', firController.getVictimsDetailsByFirId);
// Add this route for updating FIR status
// routes.js or similar route file
router.put('/fir/update-status', firController.updateFirStatus);




// Route to delete a FIR by ID
router.delete('/fir_list/delete/:id', firListController.deleteFir);



// Route to update FIR status
router.put('/fir_list/update-status/:id', firListController.updateFirStatus);

router.get('/fir-relief', ReliefController.getFIRReliefList);
router.get('/fir-additional-relief', AdditionalReliefController.getFIRAdditionalReliefList);
router.get('/victims', AdditionalReliefController.getVictimDetailsByFirId);
router.post('/save-additional-relief', AdditionalReliefController.saveAdditionalRelief);







router.get('/alteredPoAOptions', alteredCaseControllerNew.getAlteredPoAOptions);


router.get('/natureOfOffenceOptions', alteredCaseControllerNew.getNatureOfOffenceOptions);

router.post('/altered-case/:firId', alteredCaseControllerNew.addAlteredCase);








module.exports = router; 