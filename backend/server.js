const express = require('express');
const path = require('path');
const os = require('os');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var fs = require('fs');
const process = require('process');
const app = express();
const PORT = 8080;

app.use(express.static(path.join(__dirname, '../docs')));

app.use(express.json()); // Middleware to parse JSON requests

app.post('/upload-blob-json', (req, res) => {
    const { fileName, content } = req.body;
    const uploadPath = path.join(os.homedir(), 'Downloads');
    const tempPath = path.join(os.tmpdir(), fileName);
    const localPath = path.join(uploadPath, fileName);
    
    if (!fileName || !content) {
        return res.status(400).json({ error: 'Invalid file data' });
    }

    console.log('File name:', fileName);
    console.log('File content:', content);


    fs.appendFile(tempPath, JSON.stringify(content), (err) => {
        if (err) {
            console.error('Error writing temporary file', err);
            return res.status(500).send('Could not create file.');
        }
        console.log('File written successfully:', tempPath); // Log success
        res.download(tempPath, fileName, (err) => {
            if (err) {
                console.error('Error sending file to the client', err);
            }
            else {
                fs.unlink(tempPath, (err) => {
                    if (err) {
                        console.error('Error deleting file', err);
                    }
                    else {
                        console.log(`File ${tempPath} deleted`);
                    }
                });
            }
        });
    });

    if (localPath) {
        fs.appendFile(localPath, JSON.stringify(content), (err) => {
            if (err) {
                console.error('Cannot download local file', err);
                return;
            }
            console.log('File written successfully', localPath);
        })
    }
});

process.on('SIGINT', (code) => {
    console.log('Caught SIGINT. Exiting gracefully...');
    process.exit(0);
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});