import { writeDatabase } from "../database.js";
import { seedData } from "../data/seed.js";

await writeDatabase(seedData);
console.log("Database reset from seed data.");
