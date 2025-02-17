import { connectToDatabase } from './db.js';
import authenticateToken from './auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const user = authenticateToken(req); 

      const client = await connectToDatabase();

      const result = await client.query('SELECT * FROM users WHERE email = $1;', [user.email]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }


      res.status(200).json(result.rows[0]); 
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
