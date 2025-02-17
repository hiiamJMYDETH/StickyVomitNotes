import { connectToDatabase } from "./db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { name, email, password } = req.body;
        if (!name || !email, !password) {
            return res.status(400).json({ error: 'Missing username/email/password' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const values = [email, name, hashedPassword];
        const client = await connectToDatabase();
        const result = await client.query("INSERT INTO users (email, username, pwd, creation_date) VALUES ($1, $2, $3, CURRENT_DATE) ON CONFLICT (email) DO NOTHING", values);

        if (result.rowCount === 0) {
            return res.status(401).json({
                message: 'Email already exists',
                logMessage: 'Sign up failed'
            });
        }

        const token = jwt.sign({ email: values[0], password: values[2] }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

        res.json({ message: "Successfully created an account", token });
    }
    else {
        res.status(405).json({ error: "Method not allowed" });
    }
}