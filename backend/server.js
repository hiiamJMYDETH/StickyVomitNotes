const express = require('express');
const path = require('path');
const os = require('os');
var fs = require('fs');
const process = require('process');
const app = express();
const PORT = 8080;

app.use(express.static(path.join(__dirname, '../docs')));

app.use(express.json()); // Middleware to parse JSON requests

app.post('/upload-blob-json', (req, res) => {
    const { fileName, content } = req.body;
    const uploadPath = path.join(os.homedir(), 'Downloads');

    if (!fileName || !content) {
        return res.status(400).json({ error: 'Invalid file data' });
    }

    console.log('File name:', fileName);
    console.log('File content:', content);

    // Respond back to the client
    res.json({ message: 'File received successfully', fileName });
    const tempPath = path.join(os.tmpdir(), fileName);
    fs.writeFile(tempPath, content, (err) => {
        if (err) throw err;
        console.log('Note saved at temp');
    });
    if (fs.existsSync(uploadPath)) {
        const filePath = path.join(uploadPath, fileName);
        fs.appendFile(filePath, content, (err) => {
            if (err) throw err;
            console.log('Note saved');
        });
    }
});

process.on('exit', (code) => {
    const tempPath = path.join(os.tmpdir());
    fs.unlink(tempPath, (err) => {
        if (err) {
            console.error('Error deleting file', err);
        }
        else {
            console.log(`File ${tempPath} deleted`);
        }
    });
});

process.on('SIGINT', (code) => {
    console.log('Caught SIGINT. Exiting gracefully...');
    process.exit(0);
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});