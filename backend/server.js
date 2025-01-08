require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;
// const mysql = require('mysql2');
const {Client} = require('pg');
let server1Toggle = false;
let server2Toggle = false;

// const db1 = mysql.createConnection({
//     host: process.env.DB2_HOST,
//     user: process.env.DB2_USER,
//     password: process.env.DB2_PASSWORD,
//     database: process.env.DB2_NAME,
// });

// const db2 = 'blah';

const db1 = 'blah';

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
    let finalContent = '';
    if (!fileName || !content) {
        return res.status(400).json({ error: 'Invalid file data' });
    }

    finalContent = content.join('\n');

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(finalContent);
});

app.post('/login-json', (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({error: 'Missing email/password'});
    }

    console.log('Email:', email);
    console.log('Password:', password);

    if (server1Toggle) {
        db1.query(
            'SELECT * FROM users WHERE email = ? AND pwd = ?',
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
                console.log(results.rows[0]);
                if (err) {
                    console.error('Error executing query', err);
                    return res.status(500).json({error: 'Internal server error', details: err.message});
                }
                if (results.length === 0 || !results.rows[0]) {
                    res.json({message: 'Incorrect/missing information', queryResults: results, logMessage: 'Query was logged on the server'});
                    return;
                }
                res.json({message: 'Login successful', queryResults: results, logMessage: 'Query was logged on the server'});
            }
        );
    }
});

app.post('/add-account-json', (req, res) => {
    const {name, email, password} = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({error: 'Missing username/email/password'});
    }

    const values = [email, name, password];
    console.log('Name', name);
    console.log('Email', email);
    console.log('Password', password);

    if (server1Toggle) {
        const query = "INSERT IGNORE INTO users (email, username, pwd, creation_date) VALUES (?, ?, ?, CURRENT_DATE)";
        db1.query(query, values, (err, results) => {
            if (err) {
                console.error("Error executing query");
                return;
            }
            res.json({message: 'Successfully created an account', queryResults: results, logMessage: 'Query was created on the server'});
        });
    }
    
    if (server2Toggle) {
        const query = "INSERT INTO users (email, username, pwd, creation_date) VALUES ($1, $2, $3, CURRENT_DATE) ON CONFLICT (email) DO NOTHING;";
        db2.query(query, values, (err, results) => {
            if (err) {
                console.error("Error executing query");
                return;
            }
            res.json({message: 'Successfully created an account', queryResults: results, logMessage: 'Query was created on the server'});
        })
    }
});

app.get('/account', (req, res) => {
    const email = req.query.email;
    const query = 'SELECT * FROM users WHERE email = ?';

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

app.post('/change-password', (req, res) => {
    const {pwd, email} = req.body;

    if (!pwd || !email) {
        return res.status(400).json({error: 'Missing password'});
    }
    const values = [pwd, email];
    console.log('New password', pwd);
    console.log('From email', email);
    if (server1Toggle) {
        const query = 'UPDATE users SET usr_pwd = ? WHERE email = ?';
        db1.query(query, values, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
        });
    }
    if (server2Toggle) {
        const query = 'UPDATE users SET pwd = $1 WHERE email = $2';
        db2.query(query, values, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
        });
    }
});

app.post('/store-wordBank', (req, res) => {
    const {words, email} = req.body;
    if (!words || !email) {
        return res.status(400).json({error: "Missing either notes, note styles, or words inputted by the user"});
    }

    const values = [words, email];

    if (server1Toggle) {
        const query = 'UPDATE users SET wordBank = ? WHERE email = ?';
        db1.query(query, values, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
        });
    }
    if (server2Toggle) {
        const query = 'UPDATE users SET wordBank = $1 WHERE email = $2';
        db2.query(query, values, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
        });
    }
});

app.post('/upload-ls-json', (req, res) => {
    const {notesSaved, titlesSaved, contentsSaved, stylesSaved, email} = req.body;
    if (!notesSaved || !titlesSaved || !contentsSaved || !stylesSaved || !email) {
        return res.status(400).json({error: "Missing notes to be saved in database."})
    }
    const values = [notesSaved, titlesSaved, contentsSaved, stylesSaved, email];
    if (server1Toggle) {
        const query = 'UPDATE users SET notes_saved = ?, note_title_array = ?, note_content_array = ?, note_style_array = ? WHERE email = ?';
        db1.query(query, values, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
        });
    }
    if (server2Toggle) {
        const query = 'UPDATE users SET notes_saved = $1, note_title_array = $2, note_content_array = $3, note_style_array = $4 WHERE email = $5';
        db2.query(query, values, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
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
    // try {
    //     await db1.connect();
    //     console.log('Connected to db1');
    //     server1Toggle = true;
    // }
    // catch (err) {
    //     console.error('db1 error', err);
    // }
    // if (server1Toggle) {
    //     return;
    // }
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