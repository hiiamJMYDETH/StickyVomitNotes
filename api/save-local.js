import { connectToDatabase } from "./db.js";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { notesSaved, titlesSaved, contentsSaved, stylesSaved, email } = req.body;
            if (!notesSaved || !titlesSaved || !contentsSaved || !stylesSaved || !email) {
                return res.status(400).json({ error: "Missing notes to be saved in database." })
            }
            const values = [notesSaved, titlesSaved, contentsSaved, stylesSaved, email];
            const query = 'UPDATE users SET notes_saved = $1, note_title_array = $2, note_content_array = $3, note_style_array = $4 WHERE email = $5';
            const client = await connectToDatabase();
            const result = await client.query(query, values);
            if (result.rowCount === 0) {
                return res.status(404).send("Not found");
            }
            return res.status(200).json({message: "Saving to local storage successful"});
        }
        catch (error) {
            return res.status(500).send("Saving to local storage error");
        }
    }
    else {
        res.status(405).json({ error: "Method not allowed" });
    }
}