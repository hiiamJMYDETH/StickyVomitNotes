require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const bcrypt = require('bcrypt');
const PORT = 8080;
const mysql = require('mysql2/promise');
const { hash } = require('crypto');
// const {Client} = require('pg');
let server1Toggle = false;
let server2Toggle = false;

let db1, db2;
db2 = 'blah';

// db1 = 'blah';



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

app.post('/login-json', async (req, res) => {
    const { email, password } = req.body;


    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email/password' });
    }

    try {
        let rows;
        
        if (server1Toggle) {
            const result = await db1.execute('SELECT * FROM users WHERE email = ?;', [email]);
            rows = result[0];
        } 
        else if (server2Toggle) {
            const result = await db2.execute('SELECT pwd FROM users WHERE email = $1;', [email]);
            rows = result.rows || result[0]; 
        }

        if (!rows || rows.length === 0) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = rows[0].pwd;

        console.log("Password received:", password);
        console.log("Hashed password:", hashedPassword);

        const match = await bcrypt.compare(password, hashedPassword);

        if (match) {
            return res.json({ 
                message: 'Login successful', 
                queryResults: rows[0], 
                logMessage: 'Query was logged on the server' 
            });
        } else {
            return res.status(401).json({ 
                message: 'Incorrect/missing information', 
                logMessage: 'Query was logged on the server' 
            });
        }

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


app.post('/add-account-json', async (req, res) => {
    const {name, email, password} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        if (!name || !email || !password) {
            return res.status(400).json({error: 'Missing username/email/password'});
        }
    
        const values = [email, name, hashedPassword];
        console.log('Name', name);
        console.log('Email', email);
        console.log('Password', hashedPassword);

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
    }
    catch (error) {
        return res.status(500).send("Error registering user to database");
    }
});

app.get('/account', async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).json({ error: 'Missing email' });
    }

    try {
        if (server1Toggle) {
            const query = 'SELECT * FROM users WHERE email = ?;';
            const [rows] = await db1.execute(query, [email]);  
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json(rows[0]);  
        }

        if (server2Toggle) {
            const query = 'SELECT * FROM users WHERE email = $1;';
            const result = await db2.query(query, [email]);  
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json(result.rows[0]);  
        }

        return res.status(400).json({ error: 'Both servers are disabled' });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Database error');
    }
});

app.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';


    if (server1Toggle) {
        db1.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
            res.json(results);
        });
    }

    if (server2Toggle) {
        db2.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).send('Database error');
                return;
            }
            res.json(results);
        });
    }
});

app.post('/change-password', async (req, res) => {
    const {pwd, email} = req.body;

    if (!pwd || !email) {
        return res.status(400).json({error: 'Missing password'});
    }
    try {
        const hashedPassword = await bcrypt.hash(pwd, 10);
        const values = [hashedPassword, email];
        if (server1Toggle) {
            await db1.execute('UPDATE users SET pwd = ? WHERE email = ?', values);
        }
        else if (server2Toggle) {
            await db2.execute('UPDATE users SET pwd = $1 WHERE email = $2', values);
        }
    }
    catch (error) {
        return res.status(500).send("Change password error");
    }
});

app.post('/store-wordBank', async (req, res) => {
    const {words, email} = req.body;
    if (!words || !email) {
        return res.status(400).json({error: "Missing either notes, note styles, or words inputted by the user"});
    }

    const values = [words, email];

    try {
        if (server1Toggle) {
            await db1.execute('UPDATE users SET word_bank = ? WHERE email = ?', values);
        }
        if (server2Toggle) {
            await db2.execute('UPDATE users SET word_bank = $1 WHERE email = $2', values);
        }
    }
    catch (error) {
        return res.status(500).send("Saving bank error");
    }
    // if (server1Toggle) {
    //     const query = 'UPDATE users SET word_bank = ? WHERE email = ?';
    //     db1.query(query, values, (err, results) => {
    //         if (err) {
    //             console.error('Error executing query', err);
    //             res.status(500).send('Database error');
    //             return;
    //         }
    //     });
    // }
    // if (server2Toggle) {
    //     const query = 'UPDATE users SET word_bank = $1 WHERE email = $2';
    //     db2.query(query, values, (err, results) => {
    //         if (err) {
    //             console.error('Error executing query', err);
    //             res.status(500).send('Database error');
    //             return;
    //         }
    //     });
    // }
});

app.post('/upload-ls-json', async (req, res) => {
    const {notesSaved, titlesSaved, contentsSaved, stylesSaved, email} = req.body;
    if (!notesSaved || !titlesSaved || !contentsSaved || !stylesSaved || !email) {
        return res.status(400).json({error: "Missing notes to be saved in database."})
    }
    const values = [notesSaved, titlesSaved, contentsSaved, stylesSaved, email];
    try {
        if (server1Toggle) {
            const query = 'UPDATE users SET notes_saved = ?, note_title_array = ?, note_content_array = ?, note_style_array = ? WHERE email = ?';
            await db1.execute(query, values);
        }
        if (server2Toggle) {
            const query = 'UPDATE users SET notes_saved = $1, note_title_array = $2, note_content_array = $3, note_style_array = $4 WHERE email = $5';
            await db2.execute(query, values);
        }
    }
    catch (error) {
        return res.status(500).send("Saving to local storage error");
    }
    // if (server1Toggle) {
    //     const query = 'UPDATE users SET notes_saved = ?, note_title_array = ?, note_content_array = ?, note_style_array = ? WHERE email = ?';
    //     db1.query(query, values, (err, results) => {
    //         if (err) {
    //             console.error('Error executing query', err);
    //             res.status(500).send('Database error');
    //             return;
    //         }
    //     });
    // }
    // if (server2Toggle) {
    //     const query = 'UPDATE users SET notes_saved = $1, note_title_array = $2, note_content_array = $3, note_style_array = $4 WHERE email = $5';
    //     db2.query(query, values, (err, results) => {
    //         if (err) {
    //             console.error('Error executing query', err);
    //             res.status(500).send('Database error');
    //             return;
    //         }
    //     });
    // }
});

async function connectToDatabase() {
    try {
        if (db1 === 'blah') {
            db2 = await Client.createConnection({
                    host: process.env.DB1_HOST,
                    port: process.env.DB1_PORT || 5432,
                    user: process.env.DB1_USER,
                    password: process.env.DB1_PASSWORD,
                    database: process.env.DB1_NAME,
                    ssl: process.env.DB1_SSL === 'true' ? {rejectUnauthorized: false} : false
            });
            console.log("Database connection established");
            server2Toggle = true;
        }
        else {
            db1 = await mysql.createConnection({
                host: process.env.DB2_HOST,
                user: process.env.DB2_USER,
                password: process.env.DB2_PASSWORD,
                database: process.env.DB2_NAME,
            });
            
            console.log("Database connection established");
            server1Toggle = true;
        }
    } catch (err) {
        console.error('Error during DB connection:', err);
    }
}

app.listen(PORT);

connectToDatabase();