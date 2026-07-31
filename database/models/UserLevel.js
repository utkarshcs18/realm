const { Schema, model } = require("mongoose");

const userLevelSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastMessageAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userLevelSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = model("UserLevel", userLevelSchema);
