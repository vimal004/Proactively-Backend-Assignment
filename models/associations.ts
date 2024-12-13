import { Model, Association } from 'sequelize';
import SpeakerProfile from './Speaker';
import User from './User';

// Define the associations
User.hasOne(SpeakerProfile, { foreignKey: 'userId' });
SpeakerProfile.belongsTo(User, { foreignKey: 'userId' });

export { User, SpeakerProfile };
