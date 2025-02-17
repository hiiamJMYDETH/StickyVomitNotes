import { connectToDatabase } from './db.js';
import authenticateToken from './auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Authenticate token (get user info from the token)
      const user = authenticateToken(req); // This contains {email: 'user@example.com'}

      // Connect to DB
      const client = await connectToDatabase();

      // Match user in DB by email (or use user ID)
      const result = await client.query('SELECT * FROM users WHERE email = $1;', [user.email]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If user is found, return the user data
      res.status(200).json(result.rows[0]); // Or return whatever you need from DB
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
