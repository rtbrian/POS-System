import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'default_secret_please_change',
  db: {
    host: process.env.DB_HOST ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    name: process.env.DB_NAME ,
    port: parseInt(process.env.DB_PORT || '5432'),

    ssl: {
      rejectUnauthorized: false
    }
  },
};