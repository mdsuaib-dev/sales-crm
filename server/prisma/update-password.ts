
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash(
    "password123",
    10
  );

  const user = await prisma.user.update({
    where: {
      email: "admin@salescrm.com",
    },
    data: {
      passwordHash,
    },
  });

  console.log("Password updated successfully!");
  console.log("Login email:", user.email);
  console.log("Login password: password123");
}

main()
  .catch((error) => {
    console.error("Password update failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
