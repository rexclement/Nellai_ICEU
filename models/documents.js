const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
    name: String,
    category: {
        type: String,
        enum: ["minutes", "reports", "schedule", "songSheets", "others"]
    },
    fileUrl: String
});

module.exports = mongoose.model("documentmodel", documentSchema);