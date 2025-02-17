import { connectToDatabase } from "./db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    message: 'Missing email or password',
                });
            }

            const client = await connectToDatabase();
            const result = await client.query('SELECT * FROM users WHERE email = $1;', [email]);

            if (result.rows.length === 0) {
                return res.status(401).json({ 
                    message: 'Incorrect/missing information', 
                    logMessage: 'Login failed' 
                });
            }

            const user = result.rows[0]; 

            const match = await bcrypt.compare(password, user.pwd); 
            if (!match) {
                return res.status(401).json({
                    message: 'Incorrect/missing information',
                    logMessage: 'Login failed'
                });
            }

            const token = jwt.sign({ email: user.email, id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.json({ message: "Login successful", token });
        }
        catch (error) {
            console.error('Error during login:', error);
            res.status(500).json({ error: "Error processing login" });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
