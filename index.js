const express = require("express");
const { Telegraf } = require("telegraf");
const { getTransactions, healthCheck } = require("./controllers");
const { getTransactionsAPI } = require("./apis");
const { message } = require("telegraf/filters");

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN, { polling: true });

// Simple route to test database connection
app.get("/health", healthCheck);

// Handler for text messages
app.get("/api/transactions", getTransactions);

// Route for webhook
app.use(bot.webhookCallback("/bot/webhook"));

bot.on(message("text"), async (ctx) => {
  console.log("Received new message::", ctx);
  const text = ctx.update.message.text;

  try {
    const transactions = await getTransactionsAPI(text);

    if (!transactions) {
      await ctx.reply("No transactions found.");
      return;
    }

    const message = transactions
      .map(
        (row) =>
          `Date: ${row.date}\nAmount: ${row.amount}\nNotes: ${row.notes}\nCode: ${row.code}`
      )
      .join("\n\n");

    await ctx.reply(message);
  } catch (err) {
    console.error("Error executing query", err.stack);
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
