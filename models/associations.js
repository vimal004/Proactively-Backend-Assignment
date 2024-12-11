const SpeakerProfile = require("./speaker");
const User = require("./user");

// Define the associations
User.hasOne(SpeakerProfile, { foreignKey: "userId" });
SpeakerProfile.belongsTo(User, { foreignKey: "userId" });

module.exports = { User, SpeakerProfile };
