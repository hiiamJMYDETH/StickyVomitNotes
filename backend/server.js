const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;
var mysql = require('mysql2');
require('dotenv').config();
const {Client} = require('pg');
let server1Toggle = false;
let server2Toggle = false;

var db1 = mysql.createConnection({
    host: process.env.DB2_HOST,
    user: process.env.DB2_USER,
    password: process.env.DB2_PASSWORD,
    database: process.env.DB2_NAME
});

const db2 = new Client({
    host: process.env.DB1_HOST,
    port: process.env.DB1_PORT || 5432,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASSWORD,
    database: process.env.DB1_NAME,
    ssl: process.env.DB1_SSL === 'true' ? {rejectUnauthorized: false} : false // Use this for Render's default SSL
});


app.use(express.static(path.join(__dirname, '../docs')));

app.use(express.json()); 

app.post('/upload-blob-json', (req, res) => {
    const { fileName, content } = req.body;
    if (!fileName || !content) {
        return res.status(400).json({ error: 'Invalid file data' });
    }

    console.log('File name:', fileName);
    console.log('File content:', content);

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(content));
});

app.post('/login-json', (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({error: 'Missing username/password'});
    }

    console.log('Email:', email);
    console.log('Password:', password);

    if (server1Toggle) {
        db1.query(
            'SELECT * FROM users WHERE email = ? AND usr_pwd = ?',
            [email, password],
            (err, results) => {
                if (err) {
                    console.error('Error executing query', err);
                    return res.status(500).json({error: 'Internal server error', details: err.message});
                }
                if (results.length === 0) {
                    res.json({message: 'Incorrect/missing information', queryResults: results, logMessage: 'Query was logged on the server'});
                    return;
                }
                console.log('Query results:', results);
                res.json({message: 'Login successful', queryResults: results, logMessage: 'Query was logged on the server'});
            }
        );
    }

    if (server2Toggle) {
        db2.query(
            'SELECT * FROM users WHERE email = $1 AND pwd = $2;',
            [email, password],
            (err, results) => {
                if (err) {
                    console.error('Error executing query', err);
                    return res.status(500).json({error: 'Internal server error', details: err.message});
                }
                if (results.length === 0) {
                    res.json({message: 'Incorrect/missing information', queryResults: results, logMessage: 'Query was logged on the server'});
                    return;
                }
                res.json({message: 'Login successful', queryResults: results, logMessage: 'Query was logged on the server'});
            }
        );
    }
});

app.get('/account', (req, res) => {
    console.log('route /account was called');
    const email = req.query.email;
    const query = 'SELECT * FROM users WHERE email = ?';
    console.log(email);

    if (server1Toggle) {
        db1.query(query, [email], (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
            res.json(results[0]);
        });
    }

    if (server2Toggle) {
        db2.query('SELECT * FROM users WHERE email = $1;', [email], (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
            res.json(results.rows[0]);
        });
    }
});

function showTables() {
    if (server1Toggle) {
        db1.query('SELECT * FROM users;', (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                return;
            }
            console.log('Query results', results);
        });
    }

    if (server2Toggle) {
        db2.query('SELECT * FROM users;', (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                return;
            }
            console.log('Query results', results);
        });
    }
}

async function connectToDatabase() {
    try {
        await db1.connect();
        console.log('Connected to db1');
        server1Toggle = true;
    }
    catch (err) {
        console.error('db1 error', err);
    }
    if (server1Toggle) {
        showTables();
        return;
    }
    try {
        await db2.connect();
        console.log('Connected to db2');
        server2Toggle = true;
    }
    catch (err) {
        console.error('db2 error', err);
    }
    showTables();
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

connectToDatabase();