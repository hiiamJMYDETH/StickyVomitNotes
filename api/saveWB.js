import { connectToDatabase } from "./db.js";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const {words, email} = req.body;
            if (!words || !email) {
                return res.status(400).json({error: "Missing either notes, note styles, or words inputted by the user"});
            }
        
            const values = [words, email];
            const client = await connectToDatabase();
            const result = await client.query('UPDATE users SET word_bank = $1 WHERE email = $2', values);
            if (result.rowCount === 0) {
                return res.status(404).send("Not found");
            }
            return res.status(200).json({message: "Saving word bank successful"});
        }
        catch (error) {
            return res.status(500).send("Saving word bank error");
        }
    }
    else {
        res.status(405).json({ error: "Method not allowed" });
    }
}