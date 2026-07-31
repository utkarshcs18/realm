const { Schema, model } = require("mongoose");

const ticketSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    closed: { type: Boolean, default: false },
    closedBy: { type: String, default: null },
    transcriptUrl: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = model("Ticket", ticketSchema);
