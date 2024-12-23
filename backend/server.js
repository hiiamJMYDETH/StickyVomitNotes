const express = require('express');
const path = require('path');
const app = express();
const PORT = 10000;
// var mysql = require('mysql2');
require('dotenv').config();
const {Client} = require('pg');

// var con = mysql.createConnection({
//     host: process.env.DB2_HOST,
//     user: process.env.DB2_USER,
//     password: process.env.DB2_PASSWORD,
//     database: process.env.DB2_NAME
// });

const client = new Client({
    host: process.env.DB1_HOST,
    port: process.env.DB1_PORT || 5432,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASSWORD,
    database: process.env.DB1_NAME,
    ssl: process.env.DB1_SSL === 'true' ? {rejectUnauthorized: false} : false // Use this for Render's default SSL
});

// (async () => {
//     try {
//         await client.connect();
//         console.log('Connected to PostgreSQL');
//     } catch (err) {
//         console.error('Connection error', err.stack);
//     } finally {
//         await client.end(); // Always close the connection
//     }
// })();

app.use(express.static(path.join(__dirname, '../docs')));

app.use(express.json()); // Middleware to parse JSON requests

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

    // con.query(
    //     'SELECT * FROM users WHERE email = ? AND usr_pwd = ?',
    //     [email, password],
    //     (err, results) => {
    //         if (err) {
    //             console.error('Error executing query', err);
    //             return res.status(500).json({error: 'Internal server error', details: err.message});
    //         }
    //         if (results.length === 0) {
    //             res.json({message: 'Incorrect/missing information', queryResults: results, logMessage: 'Query was logged on the server'});
    //             return;
    //         }
    //         console.log('Query results:', results);
    //         res.json({message: 'Login successful', queryResults: results, logMessage: 'Query was logged on the server'});
    //     }
    // );

    client.query(
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
            // console.log('Query results:', results);
            res.json({message: 'Login successful', queryResults: results, logMessage: 'Query was logged on the server'});
        }
    );
});

app.get('/account', (req, res) => {
    console.log('route /account was called');
    const email = req.query.email;
    const query = 'SELECT * FROM users WHERE email = ?';
    console.log(email);

    // con.query(query, [email], (err, results) => {
    //     if (err) {
    //         console.error('Error executing query', err);
    //         res.status(500).send('Database error');
    //         return;
    //     }
    //     res.json(results[0]);
    // });

    client.query('SELECT * FROM users WHERE email = $1;', [email], (err, results) => {
        if (err) {
            console.error('Error executing query', err);
            res.status(500).send('Database error');
            return;
        }
        // res.json({message: "There's a user here", queryResults: results, logMessage: 'Query was logged on the server'});
        res.json(results.rows[0]);
    });
});

// con.query('SELECT * FROM users;', (err, results) => {
//     if (err) {
//         console.error('Error executing query', err);
//         return;
//     }
//     console.log('Query results', results);
// });

// client.query('SELECT * FROM users;', (err, results) => {
//     if (err) {
//         console.error('Error executing query', err);
//         return;
//     }
//     console.log('Query results', results);
// });

// con.connect(function(err) {
//     if (err) throw err;
//     console.log('Connected to mySQL');
// });

// client.connect(function(err) {
//     if (err) {
//         console.error('Connection error', err);
//         return;
//     }
//     console.log('Connected to postgreSQL');
// });

client.connect()
  .then(() => console.log('Connected to Render database!', {
    host: process.env.DB1_HOST,
    port: process.env.DB1_PORT,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASSWORD,
    database: process.env.DB1_NAME,
  }))
  .catch(err => console.error('Connection error:', err));

process.on('SIGSEGV', () => {
    console.error('Segmentation fault detected. Shutting down gracefully...');
    client.end();
    // Perform cleanup if necessary
    process.exit(1); // Exit the process to avoid undefined behavior
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});