const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');

const uploadHandler = (req, res, next) => {
    const busboy = Busboy({ 
        headers: req.headers,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB limit
        }
    });

    const uploadPath = '/var/www/backend/uploads/fir_copy';
    let formData = {};
    let fileName;

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    busboy.on('file', (fieldname, file, filename) => {
        console.log(`Uploading file: ${filename}`);
        fileName = `${Date.now()}-${filename}`;
        const saveTo = path.join(uploadPath, fileName);
        file.pipe(fs.createWriteStream(saveTo));
        formData.uploadedFile = fileName;
    });

    busboy.on('field', (fieldname, value) => {
        formData[fieldname] = value;
    });

    busboy.on('finish', () => {
        req.body = formData;
        req.file = { filename: fileName };
        next();
    });

    req.pipe(busboy).on('error', (err) => {
        console.error('Error during file upload:', err);
        res.status(400).send('File upload error');
    });
};

module.exports = uploadHandler;
