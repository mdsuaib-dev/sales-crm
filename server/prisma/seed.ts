import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Creating seed data...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: {
      email: "admin@salescrm.com",
    },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@salescrm.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  let company = await prisma.company.findFirst({
    where: {
      name: "ABC Technologies",
    },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "ABC Technologies",
        website: "https://abc.com",
        email: "contact@abc.com",
        contactPerson: "Rahul Sharma",
        industry: "Technology",
      },
    });
  }

  const existingDeal = await prisma.deal.findFirst({
    where: {
      title: "ABC Website Project",
      companyId: company.id,
    },
  });

  const deal =
    existingDeal ||
    (await prisma.deal.create({
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
    }));

  console.log("Seed data created/verified successfully!");
  console.log("User:", user.email);
  console.log("Company:", company.name);
  console.log("Deal:", deal.title);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });