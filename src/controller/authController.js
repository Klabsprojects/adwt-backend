const shgSchema = require("../schemas/shg.schema");
const updateShgSchema = require("../schemas/shg.updateschema");
const shgMemberSchema = require("../schemas/shgMember.schema");
const updateShgMemberSchema = require("../schemas/updateshgMember.schema");
const inCompleteshgMemberSchema = require("../schemas/incompleteMember.Schema");
const shgSchemaInComplete = require("../schemas/inComplete.schema");
const bankLinkageRowsSchema = require("../schemas/bankLinkage.Schema");
const db = require('../db');
const nodemailer = require('nodemailer');
const CSTDetailsSchema = require("../schemas/cst.Schema");
const bankDetailsSchema = require("../schemas/bankDetails.Schema");
const bcrypt = require('bcryptjs');
const CryptoJS = require("crypto-js");
const secretKey = 'dfTVcIUDU7QOWRm+j0nupwjOir1nya6qh1UTr+AJ3+eZbfoy0R9+AjRZwRBsurya';
const JWT_SECRET='0c60f8a33b9ccb3b8a0a8a5f9b4e34c1e2dd536f2174c9a9d12e34529c313e82053b1fe7'
const jwt = require('jsonwebtoken');




const updateStatus = require('../utils/shgUpdateStatus')
const SHGDataFun = require("../utils/shgData")

const idGenerator = require('../utils/idGenerator');
const trimData = require('../utils/trimData');


// Configure transporter with Gmail and app password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // or 587 for TLS
  secure: true, // true for 465, false for 587
  auth: {
    user: 'awds62784@gmail.com',
    pass: 'rbvoxsfpqgioahky', // your regenerated app password
  },
});
const handleInvalidQuery = (res, message = "") => {
    return res.status(201).send({ message: `no data found` });
};

function decryptOpenSSL(encryptedBase64, secretKey) {
  const decrypted = CryptoJS.AES.decrypt(encryptedBase64, secretKey);
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

  if (!plaintext) {
    throw new Error("Decryption failed or wrong key");
  }

  return plaintext;
}

const login = async (req, res) => {
    const { email, password  } = req.body;
    // const password = decryptOpenSSL(req.body.password,secretKey);
    // console.log('Login request received with email:', email); // Debug log
  
    // Query to check if the user exists
    const query = `
                SELECT 
                    us.*, 
                    rls.access_type 
                FROM 
                    users us
                LEFT JOIN 
                    roles rls ON rls.role_id = us.role 
                WHERE 
                    us.email = ?
                `;
    db.query(query, [email], (err, results) => {
      if (err) {
        console.error('Database error:', err); // Log detailed database error
        return res.status(500).send({ error: 'Database error'});
      }
  
    //   console.log('Query executed, results:', results);
  
      if (results.length > 0) {
        const user = results[0];
        const hashedPassword = user.password;
  
        // Compare the plaintext password with the hashed password from the database
        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
          if (err) {
            // console.error('Error comparing passwords:', err);
            return res.status(500).send({ error: 'Error comparing passwords' });
          }
  
          if (isMatch) {
               const token = jwt.sign(
                { user_id: user.id, username: user.email },
                JWT_SECRET,
                { expiresIn: '8h' }
                // { expiresIn: '1m' }
            );
            // Passwords match, proceed to login

            // Store token in user_sessions table
            const sessionQuery = `
            INSERT INTO user_sessions (user_id, token, last_login)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE token = VALUES(token), last_login = NOW()
            `;

            db.query(sessionQuery, [user.id, token], (sessionErr) => {
            if (sessionErr) {
                // console.error('Error saving session:', sessionErr);
                return res.status(500).send({ message: 'Login failed at session tracking' });
            }
            
            const user_data = {
              id: user.id,
              name: user.name,  // Make sure 'name' is available in your user object
              role: user.role,  // Make sure 'role' is available in your user object
              email: user.email,
              district : user.district,
              police_city : user.police_city,
              access_type : user.access_type,
              profileImagePath: user.profile_image_path, // Assuming there's a column 'profile_image_path'
              token : token
            };
  
            console.log('Login successful for userId:', user.id);
            res.status(200).send({ message: 'Login successful', user_data });
            });
          } else {
            // Passwords do not match
            bcrypt.hash(password, 10, (err, hashedPassword) => {
            console.warn('Invalid password for email:', email);
            res.status(401).send({ message: 'Login failed. Please check your credentials and try again' , hash : hashedPassword });
            });
          }
        });
      } else {
        console.warn('Invalid email for email:', email);
        res.status(401).send({ message: 'Login failed. Please check your credentials and try again' });
      }
    });
  };
  
  
  



const updateShg = async (req, res) => {
    try {
        const shgPendingModel = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const model1 = mongo.conn.model("shg", shgSchema, "shgPending");

        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");

        const data = JSON.parse(JSON.stringify({ ...req.body }));
        const SHGId = Number(data['SHGId']);
        const shgFullData = await getShgallData(SHGId, data);
        res.json({ status: true, result: shgFullData })

    }
    catch (e) {
        return res
            .status(400)
            .send({ status: false, error: `Invalid Query err: ${e.message}` });
    }

}


// Method to send OTP
const sendOtp = async (req, res) => {
  const { email } = req.body;

//   console.log('Received request to send OTP for email:', email); // Log incoming request

  // Check if user exists in the users table
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Database error:', err); // Log database error
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.length === 0) {
      console.error('Email not found in database:', email); // Log if email not found
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 300000); // OTP valid for 5 minutes

    // console.log('Generated OTP:', otp); // Log generated OTP

    // Insert OTP into otp_verification table
    db.query(
      'INSERT INTO otp_verification (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt],
      (err) => {
        if (err) {
          console.error('Database error while inserting OTP:', err); // Log database error
          return res.status(500).json({ message: 'Server error' });
        }

        // console.log('OTP successfully saved to the database for email:', email); // Log success

        // Send OTP via email
        const mailOptions = {
          to: email,
          from: 'awds62784@gmail.com',
          subject: 'Password Reset OTP',
          text: `Your OTP for password reset is: ${otp}. It is valid for 5 minutes.`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error('Failed to send OTP email:', err); // Log error if email fails
            return res.status(500).json({ message: 'Failed to send OTP email' });
          }
        //   console.log('OTP email sent successfully to:', email); // Log success
          res.status(200).json({ message: 'OTP sent to email' });
        });
      }
    );
  });
};

// Method to verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

//   console.log('Received request to verify OTP for email:', email); // Log request

  // Check if OTP is valid and not expired
  db.query(
    'SELECT * FROM otp_verification WHERE email = ? AND otp_code = ? AND expires_at > NOW() AND is_verified = 0',
    [email, otp],
    (err, results) => {
      if (err) {
        console.error('Database error while verifying OTP:', err); // Log error
        return res.status(500).json({ message: 'Server error' });
      }
      if (results.length === 0) {
        console.error('Invalid or expired OTP for email:', email); // Log invalid OTP
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      // Mark OTP as verified
      db.query(
        'UPDATE otp_verification SET is_verified = 1 WHERE id = ?',
        [results[0].id],
        (err) => {
          if (err) {
            console.error('Database error while updating OTP verification status:', err); // Log error
            return res.status(500).json({ message: 'Server error' });
          }
        //   console.log('OTP verified successfully for email:', email); // Log success
          res.status(200).json({ message: 'OTP verified' });
        }
      );
    }
  );
};

// Method to reset password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

//   console.log('Received request to reset password:', req.body); // Log entire request body

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }

  // Hash the new password
  bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing new password:', err); // Log hashing error
      return res.status(500).json({ message: 'Error hashing password' });
    }

    // Update the password in the users table
    db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
      if (err) {
        console.error('Database error while updating password:', err); // Log database error
        return res.status(500).json({ message: 'Server error' });
      }
    //   console.log('Password reset successfully for email:', email); // Log success
      res.status(200).json({ message: 'Password has been reset successfully' });
    });
  });
};



const shgView = async (req, res) => {
    try {
        const modelMapTest = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const modelPending = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
        const shgMembers = mongo.conn.model("SHGMember", shgMemberSchema, "SHGMember");
        const SHGId = Number(req.query.SHGId);
        const mapTestDataApproved0Update0 = await modelMapTest.find({
            SHGId: SHGId
        });
        const mapTestDataApproved0UpdateGT0Pending = await modelPending.findOne({
            SHGId: SHGId,
        }).sort({ createdAt: -1, _id: -1, updatedAt: -1 });
        if (mapTestDataApproved0UpdateGT0Pending != null && mapTestDataApproved0UpdateGT0Pending.length > 0 && mapTestDataApproved0UpdateGT0Pending[0]?.is_ActiveApproved === 1) {
            if (mapTestDataApproved0UpdateGT0Pending[0]?.animatorDetails !== 0 || mapTestDataApproved0UpdateGT0Pending[0]?.representativeOne !== 0
                || mapTestDataApproved0UpdateGT0Pending[0]?.representativeTwo !== 0) {
                const pendingUser = await SHGDataFun.fetchSHGuser(mapTestDataApproved0UpdateGT0Pending[0]);
                mapTestDataApproved0UpdateGT0Pending[0]?.animatorDetails ? mapTestDataApproved0UpdateGT0Pending[0].animatorDetails = pendingUser.animatorDetails : ''
                mapTestDataApproved0UpdateGT0Pending[0]?.representativeOne ? mapTestDataApproved0UpdateGT0Pending[0].representativeOne = pendingUser.representativeOne : ''
                mapTestDataApproved0UpdateGT0Pending[0]?.representativeTwo ? mapTestDataApproved0UpdateGT0Pending[0].representativeTwo = pendingUser.representativeTwo : '';
            }

        } else {
        }
        const bankDetailData = await bankDetailsModel.find(
            { SHGId },
            { bankId: 1, IFSC: 1, bankName: 1, accountNumber: 1, branchName: 1, _id: 0 }
        );
        const banklinkage = await bankLinkageRowsModel.find(
            { SHGId },
            {
                LinkageId: 1, loanType: 1, dosage: 1, amount: 1, bankName: 1, loanAcNumber: 1, roi: 1, tenure: 1,
                balance: 1, date: 1, closingDate: 1, IFSC: 1, branchName: 1, _id: 0
            }
        );
        const bank = await SHGDataFun.fetchBankDetails(SHGId);
        const [bankDetails, bankDetails1, bankDetails2] = [...bank];
        const linkage = await SHGDataFun.fetchBankLinkage(SHGId);
        const [bankLinkageRows, bankLinkageRows1, bankLinkageRows2] = [...linkage];
        const user = await SHGDataFun.fetchSHGuser(mapTestDataApproved0Update0[0]);
        const { animatorDetails, representativeOne, representativeTwo } = { ...user };

        let animator = { name: '', contact: 0, MemberId: 0 };
        let rep1 = { name: '', contact: 0, MemberId: 0 };
        let rep2 = { name: '', contact: 0, MemberId: 0 };

        if (bankDetailData) {
            const combinedData = {
                ...mapTestDataApproved0Update0[0]._doc,
                bankDetails,
                bankDetails1,
                bankDetails2,
                bankLinkageRows,
                bankLinkageRows1,
                bankLinkageRows2,
                animatorDetails,
                representativeOne,
                representativeTwo
            };
            if (bankDetailData) {
                let combinedData1;
                if (mapTestDataApproved0UpdateGT0Pending !== null && mapTestDataApproved0UpdateGT0Pending.length > 0 && mapTestDataApproved0UpdateGT0Pending[0]?.is_ActiveApproved === 1) {

                    combinedData1 = {
                        ...mapTestDataApproved0UpdateGT0Pending[0]._doc,
                        bankDetails: bankDetailData[0],
                        bankDetails1: bankDetailData[1],
                        bankDetails2: bankDetailData[2],
                        bankLinkageRows: banklinkage[0],
                        bankLinkageRows1: banklinkage[1],
                        bankLinkageRows2: banklinkage[2]
                    };
                } else if (mapTestDataApproved0UpdateGT0Pending !== null && mapTestDataApproved0UpdateGT0Pending.length > 0) {
                    combinedData1 = {
                        ...mapTestDataApproved0UpdateGT0Pending[0]._doc,
                    }

                }
                const results = {
                    SHGId: SHGId,
                    data: combinedData,
                    newData: combinedData1,
                };
                res.json({ status: true, data: results });
            }
        }

    } catch (e) {
        res.status(500).json({ status: false, error: "Internal server error" });
    }
}

// const getInactiveList = async (req, res) => {
//     console.log("teststttttttttttttttttttttttttttttttttt ttttttttttttttttttttttttttttttt tttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt");
//     try {
//         var { district, block, panchayat, habitation, limit, skip } = req.query;
//         limit = limit ? parseInt(limit) : 100;
//         skip = skip ? parseInt(skip) : 0;
//         var queryString = `
//         SELECT *
//         FROM shg
//         WHERE reject = 2
//           ${district ? `AND district LIKE '%${district}%'` : ''}
//           ${block ? `AND block LIKE '%${block}%'` : ''}
//           ${panchayat ? `AND panchayat LIKE '%${panchayat}%'` : ''} 
//           ${habitation ? `AND habitation LIKE '%${habitation}%'` : ''} 
//         ORDER BY created_at DESC, id DESC
//         LIMIT ${limit}
//         OFFSET ${skip};
//         `;
//         const connection = await pool.getConnection();
//         const [data] = await connection.query(queryString);
//         connection.release();
//         console.log(data);
//         console.log("rows datadfhdshf  hsdbfhsdf hbsdfhsdnf hsbdfh snf hshdbfhsnd f");
//         if (data.length <= 0) {
//             return handleInvalidQuery(
//                 res,
//                 "No SHGs found in village, create shg first"
//             );
//         }
//         res.set("SHG-Total-Count", data.length);
//         res.send(data);
//     } catch (e) {
//         return res
//             .status(400)
//             .send({ status: false, error: `Invalid Query err: ${e.message}` });
//     }
// };

module.exports = {
    
    updateShg,
    shgView,
    login,
    sendOtp,
    verifyOtp,
    resetPassword,
    // getInactiveList
    // getUpdatedshg
}


const shgFulfill = async (reqData) => {
    const data = { ...reqData }
    data.SHGId = await idGenerator.getSHGID(data.villagecode);
    data.district = data.district.toUpperCase();
    data.block = data.block.toUpperCase();
    data.panchayat = data.panchayat.toUpperCase();
    data.habitation = data.habitation.toUpperCase();
    data.createdAt = new Date();
    data.approved = 0;
    data.CST = Number(data.CST.MemberId) || 0;
    const animator = data.animatorDetails;
    const rep1 = data.representativeOne;
    const rep2 = data.representativeTwo;
    data.animatorDetails = 0;
    data.representativeOne = 0;
    data.representativeTwo = 0;

    const returnData = {
        data,
        animator,
        rep1,
        rep2
    }

    return returnData
}

const addSHGBankData = async (SHGId, data) => {
    const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
    const bankDetailsPendingModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailPendingshg");
    const bankId = await idGenerator.getBankId(SHGId)
    const bankDetailsInstance = new bankDetailsModel({
        SHGId: SHGId,
        bankId: bankId,
        IFSC: data?.IFSC,
        bankName: data?.bankName,
        accountNumber: data?.accountNumber,
        branchName: data.branchName,
        accountType: data.accountType,
        accountStatus: data.accountStatus,
    });

    const bankDetailsPendingInstance = new bankDetailsPendingModel({
        SHGId: SHGId,
        bankId: bankId,
        IFSC: data?.IFSC,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        branchName: data.branchName,
        accountType: data.accountType,
        accountStatus: data.accountStatus,
    });

    const payload = {
        bankDetailsInstance,
        bankDetailsPendingInstance
    }
    return payload
}
const addSHGBankLinkageData = async (SHGId, data) => {
    const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
    const bankLinkageRowsPendingModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowPendingShg");

    const LinkageId = await idGenerator.getBankLinkageId(SHGId);
    const bankLinakageInstance = new bankLinkageRowsModel({
        SHGId: SHGId,
        LinkageId: LinkageId,
        loanType: data.loanType,
        dosage: data.dosage,
        amount: data.amount,
        bankName: data.bankName,
        loanAcNumber: data.loanAcNumber,
        roi: data.roi,
        tenure: data.tenure,
        balance: data.balance,
        date: data.date,
        closingDate: data.closingDate,
        IFSC: data.IFSC,
        branchName: data.branchName,
    });
    const bankLinakagePendingInstance = new bankLinkageRowsPendingModel({
        SHGId: SHGId,
        LinkageId: LinkageId,
        loanType: data.loanType,
        dosage: data.dosage,
        amount: data.amount,
        bankName: data.bankName,
        loanAcNumber: data.loanAcNumber,
        roi: data.roi,
        tenure: data.tenure,
        balance: data.balance,
        date: data.date,
        closingDate: data.closingDate,
        IFSC: data.IFSC,
        branchName: data.branchName,
    });
    const linkage = {
        bankLinakageInstance,
        bankLinakagePendingInstance
    }
    return linkage
}

const checkBankData = async (data) => {
    const bankDetailInstances = []
    const bankDetailPendingInstances = []
    if (data.bankDetails && !trimData.isEmptyBankDetails(data.bankDetails)) {
        const returnData = await addSHGBankData(data.SHGId, data.bankDetails);

        bankDetailInstances.push(returnData.bankDetailsInstance);
        bankDetailPendingInstances.push(returnData.bankDetailsPendingInstance);
    }
    if (data?.bankDetails1 && !trimData.isEmptyBankDetails(data.bankDetails1)) {
        const returnData = await addSHGBankData(data.SHGId, data?.bankDetails1);

        bankDetailInstances.push(returnData.bankDetailsInstance);
        bankDetailPendingInstances.push(returnData.bankDetailsPendingInstance);
    }
    if (data.bankDetails2 && !trimData.isEmptyBankDetails(data.bankDetails2)) {
        const returnData = await addSHGBankData(data.SHGId, data.bankDetails2);

        bankDetailInstances.push(returnData.bankDetailsInstance);
        bankDetailPendingInstances.push(returnData.bankDetailsPendingInstance);
    }

    const reqData = {
        bankDetailInstances,
        bankDetailPendingInstances
    }
    return reqData
}


const checkBankLinkageData = async (data) => {
    const bankLinkageRowsInstances = []
    const bankLinkageRowsPendingInstances = []
    if (data.bankLinkageRows && !trimData.isEmptyBankLinkageRows(data.bankLinkageRows)) {
        const returnData = await addSHGBankLinkageData(data.SHGId, data.bankLinkageRows)
        bankLinkageRowsInstances.push(returnData.bankLinakageInstance);
        bankLinkageRowsPendingInstances.push(returnData.bankLinakagePendingInstance);
    }
    if (data.bankLinkageRows1 && !trimData.isEmptyBankLinkageRows(data.bankLinkageRows1)) {
        const returnData = await addSHGBankLinkageData(data.SHGId, data.bankLinkageRows1)
        bankLinkageRowsInstances.push(returnData.bankLinakageInstance);
        bankLinkageRowsPendingInstances.push(returnData.bankLinakagePendingInstance);
    }
    if (data.bankLinkageRows2 && !trimData.isEmptyBankLinkageRows(data.bankLinkageRows2)) {
        const returnData = await addSHGBankLinkageData(data.SHGId, data.bankLinkageRows2)
        bankLinkageRowsInstances.push(returnData.bankLinakageInstance);
        bankLinkageRowsPendingInstances.push(returnData.bankLinakagePendingInstance);
    }

    let reqData = {
        bankLinkageRowsInstances,
        bankLinkageRowsPendingInstances
    }
    return reqData
}


const getrep1Data = async (MemberId) => {

}
const getrep2Data = async (MemberId) => {

}






// view specific shg
const getUpdatedshg = async (req, res) => {
    try {
        const modelMapTest = mongo.conn.model("SHG", shgSchema, "shgMapTest");
        const modelPending = mongo.conn.model("UpdateData", updateShgSchema, "shgPending");
        const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
        const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");

        const SHGId = Number(req.query.SHGId);
        const mapTestDataApproved0Update0 = await modelMapTest.find({
            SHGId: SHGId,
            // approved: 0,
            // updateCount: 0,
        });
        const mapTestDataApproved0UpdateGT0Pending = await modelPending.find({
            SHGId: SHGId,
            approved: 0,
            // updateCount: { $gt: 0 },
        });
        const bankDetailData = await bankDetailsModel.find(
            { SHGId },
            { bankId: 1, IFSC: 1, bankName: 1, accountNumber: 1, branchName: 1, _id: 0 }
        );
        const banklinkage = await bankLinkageRowsModel.find(
            { SHGId },
            {
                LinkageId: 1, loanType: 1, dosage: 1, amount: 1, bankName: 1, loanAcNumber: 1, roi: 1, tenure: 1,
                balance: 1, date: 1, closingDate: 1, IFSC: 1, branchName: 1, _id: 0
            }
        );
        const repOne = getrep1Data(mapTestDataApproved0Update0[0].representativeOne)
        const repTwo = getrep2Data(mapTestDataApproved0Update0[0].representativeOne)
        if (bankDetailData) {
            const combinedData = {
                ...mapTestDataApproved0Update0[0]._doc,
                bankDetails: bankDetailData[0],
                bankDetails1: bankDetailData[1],
                bankDetails2: bankDetailData[2],
                bankLinkageRows: banklinkage[0],
                bankLinkageRows1: banklinkage[1],
                bankLinkageRows2: banklinkage[2]
            };
            if (bankDetailData) {
                const combinedData1 = {
                    ...mapTestDataApproved0UpdateGT0Pending[0]._doc,
                    bankDetails: bankDetailData[0],
                    bankDetails1: bankDetailData[1],
                    bankDetails2: bankDetailData[2],
                    bankLinkageRows: banklinkage[0],
                    bankLinkageRows1: banklinkage[1],
                    bankLinkageRows2: banklinkage[2]
                };
                const results = {
                    SHGId: SHGId,
                    updated: combinedData1.length > 0 ? true : false,
                    data: combinedData,
                    newData: combinedData1,
                };
                res.json({ status: true, data: results });
            }
        }
    } catch (error) {
        console.error("Error retrieving data:", error);
        res.status(500).json({ status: false, error: "Internal server error" });
    }
};

const getShgallData = async (SHGId, datas) => {
    const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
    const bankDetailsPendingModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailPendingshg");

    const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
    const bankLinkageRowsPendingModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowPendingShg");

    const data = JSON.parse(JSON.stringify({ ...datas }));

    const model = mongo.conn.model("SHG", shgSchema, "shgMapTest");
    const model1 = mongo.conn.model("shg", shgSchema, "shgPending");

    const data2 = await model.find({ SHGId, isDeleted: false }, { _id: 0, reject: 0, createdBy: 0, is_ActiveApproved: 0, is_completed: 0, approved: 0, is_active: 0, createdAt: 0, is_ActiveReject: 0, __v: 0, updateStatus: 0, update: 0, approvedAt: 0, approvedBY: 0, bankLinkageRows: 0, isDeleted: 0, approved: 0 });

    const updateCount = data2[0].updateCount;
    const updatedBy = data?.updatedBy || 0;
    delete data2[0].updateCount;
    const oldData = { ...data2[0]._doc };

    const { bankLinkageRows, bankLinkageRows1, bankLinkageRows2 } = { ...data };
    const { bankDetails, bankDetails1, bankDetails2 } = { ...data };

    delete data?.bankDetails
    delete data?.bankDetails1
    delete data?.bankDetails2
    delete data?.bankLinkageRows
    delete data?.bankLinkageRows1
    delete data?.bankLinkageRows2
    delete data?.approved
    delete data?.isDeleted

    data.animatorDetails = data.animatorDetails.MemberId
    data.representativeOne = data.representativeOne.MemberId
    data.representativeTwo = data.representativeTwo.MemberId
    data.CST = data.CST.MemberId
    const updateStatus = {}
    if (bankDetails?.bankId > 0 && Object.keys(bankDetails).length > 0) {
        const compareBank = await compareBankData(SHGId, bankDetails, updateCount, updatedBy);
        compareBank ? updateStatus.bankDetails = '' : '';

    } else {
        const bankId = await idGenerator.getBankId(Number(SHGId));
        let payload = {
            SHGId: Number(SHGId),
            ...bankDetails,
            bankId: bankId,
            is_active: 1,
            createdAt: new Date(),
            approved: 0,
            updateCount: 0,
            createdBy: updatedBy
        };
        const bankDetail = new bankDetailsModel(payload);
        const bankResult = await bankDetail.save();

        const bankPending = new bankDetailsPendingModel(payload);
        const bankPendingResult = await bankPending.save();
        updateStatus.bankDetails = ''

    }
    if (typeof bankDetails1 === "object") {

        if (bankDetails1?.bankId > 0 && Object.keys(bankDetails1).length > 0) {

            const compareBank = await compareBankData(SHGId, bankDetails1, updateCount, updatedBy);
            compareBank ? updateStatus.bankDetails1 = '' : ''
        } else {
            const bankId = await idGenerator.getBankId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankDetails1,
                bankId: bankId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: 0,
                createdBy: updatedBy
            };
            const bankDetail = new bankDetailsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankDetailsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankDetails1 = ''
        }
    }
    if (typeof bankDetails2 === "object") {

        if (bankDetails2?.bankId > 0 && Object.keys(bankDetails2).length > 0) {

            const compareBank = await compareBankData(SHGId, bankDetails2, updateCount, updatedBy);
            compareBank ? updateStatus.bankDetails2 = '' : ''
        } else {
            const bankId = await idGenerator.getBankId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankDetails2,
                bankId: bankId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: 0,
                createdBy: updatedBy
            };
            const bankDetail = new bankDetailsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankDetailsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankDetails2 = ''
        }
    }

    if (typeof bankLinkageRows === "object") {

        if (bankLinkageRows?.LinkageId > 0 && Object.keys(bankLinkageRows).length > 0) {
            const compareBank = await compareBankLinkageData(SHGId, bankLinkageRows, updateCount, updatedBy);
            compareBank ? updateStatus.bankLinkageRows = '' : '';

        } else {
            const LinkageId = await idGenerator.getBankLinkageId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankLinkageRows,
                bankId: LinkageId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: Number(updateCount) + 1,
                createdBy: updatedBy
            };
            const bankDetail = new bankLinkageRowsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankLinkageRowsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankLinkageRows = ''
        }
    }
    if (typeof bankLinkageRows1 === "object") {

        if (bankLinkageRows1?.LinkageId > 0 && Object.keys(bankLinkageRows1).length > 0) {

            const compareBank = await compareBankLinkageData(SHGId, bankLinkageRows, updateCount, updatedBy);
            compareBank ? updateStatus.bankLinkageRows1 = '' : ''
        } else {
            const LinkageId = await idGenerator.getBankLinkageId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankLinkageRows1,
                bankId: LinkageId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: Number(updateCount) + 1,
                createdBy: updatedBy
            };
            const bankDetail = new bankLinkageRowsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankLinkageRowsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankLinkageRows = ''
        }
    }
    if (typeof bankLinkageRows2 === "object") {

        if (bankLinkageRows2?.LinkageId > 0 && Object.keys(bankLinkageRows).length > 0) {

            const compareBank = await compareBankLinkageData(SHGId, bankLinkageRows, updateCount, updatedBy);
            compareBank ? updateStatus.bankLinkageRows1 = '' : ''
        } else {
            const LinkageId = await idGenerator.getBankLinkageId(Number(SHGId));
            let payload = {
                SHGId: Number(SHGId),
                ...bankLinkageRows1,
                bankId: LinkageId,
                is_active: 1,
                createdAt: new Date(),
                approved: 0,
                updateCount: Number(updateCount) + 1,
                createdBy: updatedBy
            };
            const bankDetail = new bankLinkageRowsModel(payload);
            const bankResult = await bankDetail.save();

            const bankPending = new bankLinkageRowsPendingModel(payload);
            const bankPendingResult = await bankPending.save();
            updateStatus.bankLinkageRows2 = ''
        }
    }



    const compare = await compareObjects(oldData, data);
    const filed = await getupdateField(compare);
    Object.assign(updateStatus, filed);
    const payloads = {
        SHGId,
        district: data?.district,
        block: data?.block,
        panchayat: data?.panchayat,
        habitation: data?.habitation,
        SHGName: data?.SHGName,
        ...compare,
        updateCount: updateCount + 1,
        updatedBy,
        updatedAt: new Date(),
        approved: 0,
        reject: 0,
        updateStatus
    }

    const addPendingData = new model1(payloads);
    const pendingResult = await addPendingData.save();
    const mainModel = await model.findOneAndUpdate({ SHGId }, { approved: 0 }, { new: true })
    return pendingResult
    // return data2;
}


function compareObjects(oldData, newData) {
    let obj1 = JSON.parse(JSON.stringify(oldData))
    let obj2 = JSON.parse(JSON.stringify(newData))
    const diff = {};

    for (const key in obj2) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null) {
            if (!obj1.hasOwnProperty(key) || typeof obj1[key] !== 'object' || obj1[key] === null) {
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
function compareObjects1(obj1, obj2) {
    const diff = {};

    for (const key in obj2) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null) {
            if (!obj1.hasOwnProperty(key) || typeof obj1[key] !== 'object' || obj1[key] === null) {
                // Include the full object from obj2 when there is a difference.
                diff[key] = obj2[key];
            } else {
                // Recursively compare nested objects.
                const nestedDiff = compareObjects(obj1[key], obj2[key]);
                if (Object.keys(nestedDiff).length > 0) {
                    diff[key] = nestedDiff;
                }
            }
        } else if (obj1[key] !== obj2[key]) {
            // Include the full object from obj2 when there is a difference.
            diff[key] = obj2[key];
        }
    }
    if (Object.keys(diff).length !== 0) {
        return obj2;
    } else {
        return ''
    }

}

const getupdateField = async (updatedData) => {
    const basicDetails = [
        "SHGName",
        "formationDate",
        "formationYear",
        "formedBy",
        "category",
        "specialCategory",
        "meetingFrequency",
        "monitoredBy",
        "ifCST",
        "auditingDate",
        "projectsInSHGArea"
    ];

    const bankLinkageRows = [
        "loanType",
        "dosage",
        "amount",
        "bankName",
        "loanAcNumber",
        "roi",
        "tenure",
        "balance",
        "date",
        "closingDate",
        "IFSC",
        "branchName"
    ];

    const bankDetails = [
        "IFSC",
        "bankName",
        "accountNumber",
        "branchName",
        "accountType",
        "accountStatus"
    ];

    const animatorDetails = [
        "name",
        "contact",
        "liveihood",
        "liveihoodvalue"
    ];

    const representativeOne = [
        "name",
        "contact",
        "liveihoodOne",
        "liveihoodvalueOne"
    ];

    const representativeTwo = [
        "name",
        "contact",
        "liveihoodOne",
        "liveihoodvalueOne"
    ];

    const PLF = [
        "shgFederated",
        "dateAffiliated",
        "amountOfAnnualSubscription",
        "dateOfLastSubscription"
    ];

    const SHGSavings = [
        "memberSaving",
        "shgSaving",
        "totalSaving"
    ];

    const grading = [
        "grading",
        "category",
        "date"
    ];

    const economicAssistance = [
        "received",
        "date"
    ];

    const rf = [
        "received",
        "date",
        "amount"
    ];

    const cif = [
        "received",
        "amount"
    ];

    const asf = [
        "received",
        "amount"
    ];

    const cap = [
        "received",
        "amount",
        "date"
    ];

    const bulkLoan = [
        "received",
        "amount",
        "balanceLoan"
    ];

    const CST = [
        "name",
        "contact"
    ];

    // Initialize empty objects to store updated values
    const updatedBankDetail = {};
    const updatedBasicDetails = {};
    // const updatedProjectsInSHGArea = {};
    const updatedBankLinkageRows = {};
    const updatedAnimatorDetails = {};
    const updatedRepresentativeOne = {};
    const updatedRepresentativeTwo = {};
    const updatedPLF = {};
    const updatedSHGSavings = {};
    const updatedGrading = {};
    const updatedEconomicAssistance = {};
    const updatedRF = {};
    const updatedCIF = {};
    const updatedASF = {};
    const updatedCAP = {};
    const updatedBulkLoan = {};
    const updatedCST = {};

    // Loop through updatedData and populate corresponding updated objects
    for (const field of Object.keys(updatedData)) {
        if (basicDetails.includes(field)) {
            updatedBasicDetails[field] = "";
        } else if (bankLinkageRows.includes(field)) {
            updatedBankLinkageRows[field] = String(updatedData[field]);
        } else if (bankDetails.includes(field)) {
            updatedBankDetail[field] = String(updatedData[field]);
        } else if (field === "animatorDetails") {
            updatedAnimatorDetails[field] = "";
        } else if (field === "representativeOne") {

            updatedRepresentativeOne[field] = "";
        } else if (field === "representativeTwo") {
            updatedRepresentativeTwo[field] = "";
        } else if (field === "PLF") {
            updatedPLF[field] = "";
        } else if (field === "SHGSavings") {
            updatedSHGSavings[field] = "";
        } else if (field === "grading" || field === "auditingDate") {

            updatedGrading.grading = "";
        } else if (field === "economicAssistance") {
            updatedEconomicAssistance[field] = "";
        } else if (field === "rf") {
            updatedRF[field] = "";
        } else if (field === "cif") {
            updatedCIF[field] = "";
        } else if (field === "asf") {
            updatedASF[field] = "";
        } else if (field === "CAP") {
            updatedCAP[field] = "";
        } else if (field === "bulkLoan") {
            updatedBulkLoan[field] = "";
        } else if (field === CST) {
            updatedCST[field] = "";
        }
    }
    const updateStatus = {};

    // Check and update updateStatus based on each object
    if (Object.keys(updatedBankDetail).length > 0) {
        updateStatus.bankDetails = "";
    }

    if (Object.keys(updatedBasicDetails).length > 0) {
        updateStatus.basicDetails = "";
    }

    if (Object.keys(updatedBankLinkageRows).length > 0) {
        updateStatus.bankLinkageRows = "";
    }

    if (Object.keys(updatedAnimatorDetails).length > 0) {
        updateStatus.animatorDetails = "";
    }

    if (Object.keys(updatedRepresentativeOne).length > 0) {
        updateStatus.representativeOne = "";
    }

    if (Object.keys(updatedRepresentativeTwo).length > 0) {
        updateStatus.representativeTwo = "";
    }

    if (Object.keys(updatedPLF).length > 0) {
        updateStatus.PLF = "";
    }

    if (Object.keys(updatedSHGSavings).length > 0) {
        updateStatus.SHGSavings = "";
    }

    if (Object.keys(updatedGrading).length > 0) {
        updateStatus.grading = "";
    }

    if (Object.keys(updatedEconomicAssistance).length > 0) {
        updateStatus.economicAssistance = "";
    }

    if (Object.keys(updatedRF).length > 0) {
        updateStatus.rf = "";
    }

    if (Object.keys(updatedCIF).length > 0) {
        updateStatus.cif = "";
    }

    if (Object.keys(updatedASF).length > 0) {
        updateStatus.asf = "";
    }

    if (Object.keys(updatedCAP).length > 0) {
        updateStatus.cap = "";
    }

    if (Object.keys(updatedBulkLoan).length > 0) {
        updateStatus.bulkLoan = "";
    }

    if (Object.keys(updatedCST).length > 0) {
        updateStatus.CST = "";
    }
    return updateStatus

}

const compareBankData = async (SHGId, bankDetails, updateCount, updatedBy) => {
    const bankDetailsModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailshg");
    const bankDetailsPendingModel = mongo.conn.model("bankDetailshgs", bankDetailsSchema, "bankDetailPendingshg");

    const bankDetailData = await bankDetailsModel.find(
        { bankId: Number(bankDetails.bankId) },
        { IFSC: 1, bankName: 1, accountNumber: 1, branchName: 1, accountType: 1, accountStatus: 1, _id: 0, bankId: 1 }
    );
    const bankCompare = await compareObjects(bankDetailData[0], bankDetails);
    if (Object.keys(bankCompare).length > 0) {
        let payload = {
            SHGId: Number(SHGId),
            ...bankDetails,
            is_active: 1,
            createdAt: new Date(),
            approved: 0,
            updateCount: Number(updateCount) + 1,
            updatedBy
        }
        const bankPending = new bankDetailsPendingModel(payload);
        const bankPendingResult = await bankPending.save();
        await bankDetailsModel.findOneAndUpdate({ bankId: Number(bankDetails.bankId) }, { approved: 0 }, { new: true })
        return true
    } else {
        return false
    }

    // const bankmodel = 

}
const compareBankLinkageData = async (SHGId, bankLinkage, updateCount, updatedBy) => {
    const bankLinkageRowsModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowShg");
    const bankLinkageRowsPendingModel = mongo.conn.model("bankLinkageShg", bankLinkageRowsSchema, "bankLinkageRowPendingShg");

    const bankLinkagedata = await bankLinkageRowsModel.find({ LinkageId: bankLinkage.LinkageId }, {
        loanType: 1, dosage: 1, amount: 1, IFSC: 1, bankName: 1,
        loanAcNumber: 1, roi: 1, tenure: 1, balance: 1, branchName: 1, date: 1, closingDate: 1, LinkageId: 1
    })
    const bankCompare = await compareObjects(bankLinkagedata[0], bankLinkage);
    if (Object.keys(bankCompare).length > 0) {
        let payload = {
            SHGId: Number(SHGId),
            ...bankLinkage,
            is_active: 1,
            createdAt: new Date(),
            approved: 0,
            updateCount: Number(updateCount) + 1,
            updatedBy
        }
        const banklinkagePending = new bankLinkageRowsPendingModel(payload);
        const bankLinkagePendingResult = await banklinkagePending.save();
        await bankLinkageRowsModel.findOneAndUpdate({ LinkageId: Number(bankLinkage.LinkageId) }, { approved: 0 }, { new: true })

        return true
    } else {
        return false
    }
}