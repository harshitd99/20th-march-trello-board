const mongoose = require("mongoose");

// =========================
// DATABASE CONNECTION
// =========================

mongoose.connect(process.env.MONGO_URI);

// =========================
// USER SCHEMA
// =========================

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },
});

// =========================
// ORGANIZATION SCHEMA
// =========================

const organizationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// =========================
// BOARD SCHEMA
// =========================

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// =========================
// LIST SCHEMA
// =========================

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  },

  position: {
    type: Number,
    required: true,
  },
});

// =========================
// CARD SCHEMA
// =========================

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  },

  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "List",
    required: true,
  },

  position: {
    type: Number,
    required: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// =========================
// MODELS
// =========================

const userModel = mongoose.model("User", userSchema);

const organizationModel = mongoose.model("Organization", organizationSchema);

const boardModel = mongoose.model("Board", boardSchema);

const listModel = mongoose.model("List", listSchema);

const cardModel = mongoose.model("Card", cardSchema);

// =========================
// EXPORT
// =========================

module.exports = {
  userModel,
  organizationModel,
  boardModel,
  listModel,
  cardModel,
};
