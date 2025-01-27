require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const bcrypt = require('bcrypt');
const PORT = 8080;
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const secretKey = process.env.ACCESS_TOKEN_SECRET;
const { hash } = require('crypto');
// const {Client} = require('pg');
let server1Toggle = false;
let server2Toggle = false;

let db1, db2;
db2 = 'blah';

// db1 = 'blah';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]
    if (token === null) return res.sendStatus(401);
    console.log("token", token)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    })
}

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

app.post('/api/login', (req,res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        console.error("Missing user");
    }

    const user = {
        email: email,
        password: password
    }

    console.log(user);

    const token = jwt.sign(user, secretKey);

    res.json({token});
});

app.post('/users/login', async (req, res) => {
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
    
        const match = await bcrypt.compare(password, hashedPassword);
        if (!match)  {
            return res.status(401).json({ 
                message: 'Incorrect/missing information', 
                logMessage: 'Login failed' 
            });
        }
    
        const response = await fetch(`http://localhost:${PORT}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: rows[0].email, password: rows[0].pwd })
        });
    
        if (!response.ok) {
            throw new Error(`Server error! Status: ${response.status}`);
        }
    
        const data = await response.json();
        console.log('Received token:', data);
        
        return res.json({
            message: 'Login successful',
            token: data.token
        });
    
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
    
});

app.post('/users/signup', async (req, res) => {
    const {name, email, password} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        if (!name || !email || !password) {
            return res.status(400).json({error: 'Missing username/email/password'});
        }
    
        const values = [email, name, hashedPassword];
        let rows;

        if (server1Toggle) {
            const query = "INSERT IGNORE INTO users (email, username, pwd, creation_date) VALUES (?, ?, ?, CURRENT_DATE)";
            const result = await db1.execute(query, values);
            console.log(result);
            rows = result[0];
        }
        else if (server2Toggle) {
            const query = "INSERT INTO users (email, username, pwd, creation_date) VALUES ($1, $2, $3, CURRENT_DATE) ON CONFLICT (email) DO NOTHING;";
            const result = await db2.execute(query, values);
        }

        const response = await fetch(`http://localhost:${PORT}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: hashedPassword })
        });
    
        if (!response.ok) {
            throw new Error(`Server error! Status: ${response.status}`);
        }
    
        const data = await response.json();
        console.log('Received token:', data);
        
        return res.json({
            message: 'Successfully created an account',
            token: data.token
        });

        // if (server1Toggle) {
        //     const query = "INSERT IGNORE INTO users (email, username, pwd, creation_date) VALUES (?, ?, ?, CURRENT_DATE)";
        //     db1.query(query, values, (err, results) => {
        //         if (err) {
        //             console.error("Error executing query");
        //             return;
        //         }
        //         res.json({message: 'Successfully created an account', queryResults: results, logMessage: 'Query was created on the server'});
        //     });
        // }
        
        // if (server2Toggle) {
        //     const query = "INSERT INTO users (email, username, pwd, creation_date) VALUES ($1, $2, $3, CURRENT_DATE) ON CONFLICT (email) DO NOTHING;";
        //     db2.query(query, values, (err, results) => {
        //         if (err) {
        //             console.error("Error executing query");
        //             return;
        //         }
        //         res.json({message: 'Successfully created an account', queryResults: results, logMessage: 'Query was created on the server'});
        //     })
        // }
    }
    catch (error) {
        return res.status(500).send("Error registering user to database");
    }
});

app.get('/users', authenticateToken, async (req, res) => {
    const query = 'SELECT * FROM users';

    try {
        if (server1Toggle) {
            const [results] = await db1.execute(query);
            const exists = results.some(user => user.email === req.user.email);
            const matchedUser = results.find(user => user.email === req.user.email);
            console.log("exists:", exists);
            return res.json({ match: exists, user: matchedUser });
        }
        else if (server2Toggle) {
            const results = await db2.execute(query);
            return res.json(results);
        }
    }
    catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Database error');
    }
});

app.post('/users/change-password', async (req, res) => {
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

app.post('/users/saveWB', async (req, res) => {
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
});

app.post('/users/save-local', async (req, res) => {
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