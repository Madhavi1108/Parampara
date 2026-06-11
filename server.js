// import dotenv from "dotenv";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const itemRoutes = require("./routes/item.routes");
const pathRoutes = require("./routes/path.routes");
const progressRoutes = require("./routes/progress.routes");
const postRoutes = require("./routes/post.routes");
const chatRoutes = require("./routes/chat.routes");
const checkinRoutes = require("./routes/checkin.routes");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const initializeSampleData = require("./config/sampleData");

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true,
}));

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// Initialize Data
initializeSampleData();


// Home Route
app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});
app.get("/api/language", (req, res) => {
    res.json({
        default: "en",
        supported: ["en", "hi", "mr"]
    });
});

// API Routes
app.use("/api/items", itemRoutes);

app.use("/api/paths", pathRoutes);

app.use("/api/progress", progressRoutes);

app.use("/api/posts", postRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/checkin", checkinRoutes);

app.get("/api/map-style", async (req, res) => {
    if (!process.env.MAPTILER_KEY) {
        return res.status(503).json({
            configured: false,
            message:
                "Map tiles require a MapTiler API key. Please add MAPTILER_KEY to your .env file.",
        });
    }

    try {
        const response = await fetch(
            `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_KEY}`
        );

        if (!response.ok) {
            return res.status(502).json({
                configured: false,
                message:
                    "Unable to load map tiles. Please verify your MAPTILER_KEY is valid.",
            });
        }

        const style = await response.json();
        res.json(style);
    } catch (error) {
        res.status(502).json({
            configured: false,
            message: "Unable to load map tiles. Please try again later.",
        });
    }
});


// 404 Middleware
app.use(notFound);

// Error Middleware
app.use(errorHandler);

//map key

//custom 404 route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "./public", "404.html"));
});

// Start Server
app.listen(PORT, () => {
    console.log(
        `✨ Parampara server running on http://localhost:${PORT}`
    );
});