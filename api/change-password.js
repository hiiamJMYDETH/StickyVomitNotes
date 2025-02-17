import { connectToDatabase } from "./db.js";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const {pwd, email} = req.body;
            if (!pwd || !email) {
                return res.status(400).json({error: 'Missing password'});
            }
            const hashedPassword = await bcrypt.hash(pwd, 10);
            const values = [hashedPassword, email];
            const client = await connectToDatabase();
            const result = client.query('UPDATE users SET pwd = $1 WHERE email = $2', values);
            if (result.rowCount === 0) {
                return res.status(404).send("Email not found");
            }
            return res.status(200).json({message: "Change password successful"});
        }
        catch (error) {
            return res.status(500).send("Change password error");
        }
    }
    else {
        res.status(405).json({ error: "Method not allowed" });
    }
}