const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;
var mysql = require('mysql2');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Upto2016",
    database: "mydb"
});

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

    con.query(
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
});

app.get('/account', (req, res) => {
    console.log('route /account was called');
    const email = req.query.email;
    const query = 'SELECT * FROM users WHERE email = ?';
    console.log(email);

    con.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error executing query', err);
            res.status(500).send('Database error');
            return;
        }
        res.json(results[0]);
    });
});

con.query('SELECT * FROM users;', (err, results) => {
    if (err) {
        console.error('Error executing query', err);
        return;
    }
    console.log('Query results', results);
});

con.connect(function(err) {
    if (err) throw err;
    console.log('Connected to mySQL');
    // con.query('SELECT * FROM users;', (err, results) => {
    //     if (err) {
    //         console.error('Error executing query', err);
    //         return;
    //     }
    //     console.log('Query results', results);
    // });
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});