const store = require("../data/store");

const getProgress = (req, res) => {
  const userId = req.params.userId;

  res.json(
    store.userProgress[userId] || {
      badges: [],
      quests: [],
    }
  );
};

const updateProgress = (req, res) => {
  const userId = req.params.userId;

  if (!store.userProgress[userId]) {
    store.userProgress[userId] = {
      badges: [],
      quests: [],
      checkIns: [],
    };
  }

  store.userProgress[userId] = {
    ...store.userProgress[userId],
    ...req.body,
  };

  res.json(store.userProgress[userId]);
};

module.exports = {
  getProgress,
  updateProgress,
};