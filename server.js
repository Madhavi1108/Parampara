const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const itemRoutes = require("./routes/itemRoutes");
const pathRoutes = require("./routes/pathRoutes");
const progressRoutes = require("./routes/progressRoutes");
const postRoutes = require("./routes/postRoutes");
const chatRoutes = require("./routes/chatRoutes");
const checkinRoutes = require("./routes/checkinRoutes");

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

// API Routes
app.use("/api/items", itemRoutes);

app.use("/api/paths", pathRoutes);

app.use("/api/progress", progressRoutes);

app.use("/api/posts", postRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/checkin", checkinRoutes);

// 404 Middleware
app.use(notFound);

// Error Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(
        `✨ Parampara server running on http://localhost:${PORT}`
    );
});