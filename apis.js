const { dbClient } = require("./db");

const healthCheckAPI = async () => {
  let client;
  try {
    client = await dbClient(); // Get the database client
    const result = await client.query("SELECT NOW()"); // Example query to get the current time
    return result.rows[0]; // Return the result back to the client
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    if (client) client.release(); // Release the client back to the pool
  }
};

const getTransactionsAPI = async (text) => {
  let query = "SELECT * FROM transactions WHERE TRUE";
  const queryParams = [];

  // Full-text search on notes
  if (text) {
    query += " AND notes ILIKE $" + (queryParams.length + 1);
    queryParams.push(`%${text}%`);
  }

  // Search by amount (text can be matched to amount)
  if (text && !isNaN(parseFloat(text))) {
    query += `
        OR amount::text ILIKE $${queryParams.length + 1}
      `;
    queryParams.push(text);
  }

  // Add sorting by date and limit to 100 results
  query += " ORDER BY date DESC LIMIT 100";

  try {
    const client = await dbClient();
    const result = await client.query(query, queryParams);
    client.release();

    // Format result for Telegram bot
    return result.rows.map((row) => ({
      date: row.date,
      amount: row.amount,
      notes: row.notes,
      code: row.code,
    }));
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { healthCheckAPI, getTransactionsAPI };
