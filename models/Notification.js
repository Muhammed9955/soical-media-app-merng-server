const { model, Schema } = require("mongoose");

const NotificationSchema = new Schema({
  sender: String,
  recipient: String,
  screamId: String,
  type: String,
  read: String,
  createdAt: String,
});

module.exports = model("notification", NotificationSchema);
