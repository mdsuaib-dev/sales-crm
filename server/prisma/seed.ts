import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Creating seed data...");

  const passwordHash = await bcrypt.hash(
  "password123",
  10
);

  const user = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@salescrm.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const company = await prisma.company.create({
    data: {
      name: "ABC Technologies",
      website: "https://abc.com",
      email: "contact@abc.com",
      contactPerson: "Rahul Sharma",
      industry: "Technology",
    },
  });

  const deal = await prisma.deal.create({
    data: {
      title: "ABC Website Project",
      description: "Development of company website",
      requirements: "React, Node.js and PostgreSQL",
      value: 500000,
      stage: "PROPOSAL",
      expectedCloseDate: new Date("2026-12-31"),
      companyId: company.id,
      ownerId: user.id,
    },
  });

  console.log("Seed data created successfully!");
  console.log("User:", user);
  console.log("Company:", company);
  console.log("Deal:", deal);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });