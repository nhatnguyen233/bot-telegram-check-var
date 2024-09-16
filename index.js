const express = require("express");
const { Telegraf } = require("telegraf");
const { getTransactions, healthCheck } = require("./controllers");
const { getTransactionsAPI } = require("./apis");

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN, { polling: true });

// Simple route to test database connection
app.get("/health", healthCheck);

// Handler for text messages
app.get("/api/transactions", getTransactions);

bot.on("/bot/webhook", async (msg) => {
  console.log("Received new message::", msg);
  const chatId = msg.chat.id;
  const text = msg.text;

  try {
    const transactions = await getTransactionsAPI(text);

    if (!transactions) {
      bot.sendMessage(chatId, "No transactions found.");
      return;
    }

    bot.sendMessage(
      chatId,
      transactions.map(
        (row) =>
          `Date: ${row.date}\nAmount: ${row.amount}\nNotes: ${row.notes}\nCode: ${row.code}`
      )
    );
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
