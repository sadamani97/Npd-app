import dotenv from 'dotenv';
import sequelize from './config/db.js';
import { SuperAdmin } from './models/superAdmin.model.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';

dotenv.config();

const DEFAULT_PASSWORD = process.env.SUPERADMIN_RESET_PWD || 'superadmin123';
const CREDENTIALS_FILE = './superadmin_credentials.txt';

const resetPassword = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const superAdmin = await SuperAdmin.findOne({ where: { email: 'superadmin@hostel.com' } });
    if (!superAdmin) {
      console.error('SuperAdmin account not found.');
      process.exit(1);
    }

    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await superAdmin.update({ password: hashed, is_active: true });

    const creds = `email: superadmin@hostel.com\npassword: ${DEFAULT_PASSWORD}\n`;
    fs.writeFileSync(CREDENTIALS_FILE, creds, { encoding: 'utf8', flag: 'w' });

    console.log(`SuperAdmin password reset. Credentials written to ${CREDENTIALS_FILE}`);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting SuperAdmin password:', err.message);
    process.exit(1);
  }
};

resetPassword();
