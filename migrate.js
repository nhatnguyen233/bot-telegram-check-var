// migrate.js
const fs = require("fs");
const { dbClient, closePool, createTableIfNotExists } = require("./db");

const filePath = "./transactions.json"; // Update with your JSON file path
const CHUNK_SIZE = 1000; // Number of records per chunk

async function migrateData() {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const client = await dbClient();

    try {
      await client.query("BEGIN");

      // Ensure the transactions table exists
      await createTableIfNotExists(client);

      const insertQuery = `
        INSERT INTO transactions (date, amount, notes, code)
        VALUES ($1, $2, $3, $4)
      `;

      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);

        const promises = chunk.map((record) =>
          client.query(insertQuery, [
            record.date,
            record.amount,
            record.notes,
            record.code,
          ])
        );

        await Promise.all(promises);
      }

      await client.query("COMMIT");
      console.log("Data migration completed successfully!");
    } catch (error) {
      console.error("Error during migration:", error);
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error reading JSON file:", error);
  } finally {
    await closePool();
  }
}

// Run the migration script
migrateData();
