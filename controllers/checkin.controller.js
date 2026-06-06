const store = require("../data/store");

const checkIn = (req, res) => {

  const { userId, village, coordinates } = req.body;

  if (!store.userProgress[userId]) {
    store.userProgress[userId] = {
      badges: [],
      quests: [],
      checkIns: []
    };
  }

  const checkIn = {
    village,
    coordinates,
    timestamp: new Date().toISOString()
  };

  store.userProgress[userId].checkIns.push(checkIn);

  // Award badge for first check-in
  if (store.userProgress[userId].checkIns.length === 1) {
    store.userProgress[userId].badges.push({
      name: "First Explorer",
      description: "Visited your first village",
      date: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    checkIn,
    badges: store.userProgress[userId].badges
  });
};

module.exports = {
  checkIn
};