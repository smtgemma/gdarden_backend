/* eslint-disable no-console */
import mongoose from "mongoose";
import { envVars } from "../config/env";
import { seedSuperAdmin } from "../utils/seedSuperAdmin";

const runMigrationsAndSeed = async () => {
  try {
    console.log("Connecting to Database for Seeding...");
    await mongoose.connect(envVars.DB_URL);
    console.log("Connected to DB successfully.");

    console.log("Seeding Super Admin...");
    await seedSuperAdmin();
    console.log("Seeding completed successfully.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
};

runMigrationsAndSeed();
