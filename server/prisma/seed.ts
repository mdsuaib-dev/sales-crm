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
  const admin = await prisma.user.upsert({
  where: {
    email: "admin@salescrm.com",
  },
  update: {
    name: "Admin User",
    passwordHash,
    role: "ADMIN",
    isActive: true,
  },
  create: {
    name: "Admin User",
    email: "admin@salescrm.com",
    passwordHash,
    role: "ADMIN",
    isActive: true,
  },
});

const manager = await prisma.user.upsert({
  where: {
    email: "manager@test.com",
  },
  update: {
    name: "Manager User",
    passwordHash,
    role: "MANAGER",
    isActive: true,
  },
  create: {
    name: "Manager User",
    email: "manager@test.com",
    passwordHash,
    role: "MANAGER",
    isActive: true,
  },
});

const salesRep = await prisma.user.upsert({
  where: {
    email: "rep@salescrm.com",
  },
  update: {
    name: "Sales Representative",
    passwordHash,
    role: "SALES",
    isActive: true,
  },
  create: {
    name: "Sales Representative",
    email: "rep@salescrm.com",
    passwordHash,
    role: "SALES",
    isActive: true,
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
        ownerId: salesRep.id,
      },
    }));

  console.log("Seed data created/verified successfully!");
  console.log("Users:", admin.email, manager.email, salesRep.email);
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