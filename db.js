const { Pool } = require("pg");
require("dotenv").config();

let pool;

const createPool = () => {
  if (!pool) {
    pool = new Pool({
      user: process.env.DATABASE_USERNAME,
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_SCHEMA,
      password: process.env.DATABASE_PASSWORD,
      port: process.env.DATABASE_PORT,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : false, // SSL configuration
    });

    // Event listener for errors on the pool
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      process.exit(-1); // Exit the process or handle reconnection logic here
    });
  }

  return pool;
};

const dbClient = async () => {
  const pool = createPool();

  try {
    const client = await pool.connect(); // Attempt to get a client
    console.log("Database connected successfully");
    return client;
  } catch (err) {
    console.error("Error acquiring client from the pool:", err.message);
    throw err; // Throw to be handled by the caller
  }
};

// Function to close the pool
const closePool = async () => {
  await pool.end();
};

// Function to create the transactions table if it does not exist
const createTableIfNotExists = async (client) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      amount INTEGER NOT NULL,
      notes TEXT,
      code TEXT
    );
  `;
  await client.query(createTableQuery);
};

module.exports = { dbClient, closePool, createTableIfNotExists };
