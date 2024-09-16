const { getTransactionsAPI, healthCheckAPI } = require("./apis");

const healthCheck = async (req, res) => {
  const health = await healthCheckAPI();
  if (!health) {
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
  res.json(health);
};

const getTransactions = async (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res
      .status(400)
      .json({ error: 'Query parameter "text" is required' });
  }

  const transactions = await getTransactionsAPI(text);

  res.json(transactions ?? []);
};

module.exports = { healthCheck, getTransactions };
