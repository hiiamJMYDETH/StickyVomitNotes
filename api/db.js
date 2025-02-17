import pkg from 'pg';
import dotenv from 'dotenv';
const {Client} = pkg;

dotenv.config(); 

let client;

const connectToDatabase = async () => {
  if (client) return client; 
  client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  return client;
};

export { connectToDatabase };
