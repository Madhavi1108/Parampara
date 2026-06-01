const store = require("../data/store");

function initializeSampleData() {

  store.culturalItems.push(
    {
      id: "1",
      title: "Kantha Embroidery Patterns",
      type: "visual",
      location: "Kantha Village, Bengal",
      coordinates: [22.5726, 88.3639],
      description:
        "Traditional Kantha embroidery...",
      tags: ["embroidery", "textile"],
      timestamp: new Date().toISOString(),
    }
  );

  store.heritagePaths.push(
    {
      id: "path-1",
      title: "The Journey of Kantha Stitch",
      theme: "Embroidery Traditions",
    }
  );
}

module.exports = initializeSampleData;