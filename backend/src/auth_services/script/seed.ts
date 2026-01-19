import { AuthService } from '../services/auth.service';
import pool from '../config/database';

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting Database Seed...");

    // 1. Create the Admin User
    // This uses your actual PasswordService, so the hash will be 100% correct.
    const email = 'superadmin@pos.com';
    const password = 'password123';

    console.log(`... Attempting to create user: ${email}`);

    await AuthService.registerUser(email, password);
    
    console.log("✅ SUCCESS: Super Admin created!");
    console.log(`👉 Login with: ${email} / ${password}`);

  } catch (error: any) {
    if (error.message === 'User already exists') {
      console.log("ℹ️ User already exists. (That's okay!)");
    } else {
      console.error("❌ Seeding Failed:", error);
    }
  } finally {
    // 2. Close the Database Connection so the script stops
    await pool.end();
    process.exit();
  }
};

// Run the function
seedDatabase();