import express from "express";
import cors from "cors";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Sales CRM backend is running",
  });
});

//Command to get the companies

app.get("/api/companies", async (req, res) => {
  try {
    const companies = await prisma.company.findMany();

    res.json(companies);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch companies",
    });
  }
});

app.get("/api/companies/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const company = await prisma.company.findUnique({
      where: {
        id: id,
      },
    });

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    res.json(company);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch company",
    });
  }
});

app.post("/api/companies", async (req, res) => {
  try {
    const { name, website, email, contactPerson, industry } = req.body;

    const company = await prisma.company.create({
      data: {
        name,
        website,
        email,
        contactPerson,
        industry,
      },
    });

    res.status(201).json(company);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create company",
    });
  }
});

app.put("/api/companies/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { name, website, email, contactPerson, industry } = req.body;

    const company = await prisma.company.update({
      where: {
        id: id,
      },
      data: {
        name,
        website,
        email,
        contactPerson,
        industry,
      },
    });

    res.json(company);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update company",
    });
  }
});

app.delete("/api/companies/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const company = await prisma.company.delete({
      where: {
        id: id,
      },
    });

    res.json({
      message: "Company deleted successfully",
      company,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete company",
    });
  }
});

//Deal
app.get("/api/deals", async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        company: true,
        owner: true,
      },
    });

    res.json(deals);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch deals",
    });
  }
});
app.get("/api/deals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const deal = await prisma.deal.findUnique({
      where: {
        id,
      },
      include: {
        company: true,
        owner: true,
      },
    });

    if (!deal) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    res.json(deal);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch deal",
    });
  }
});

app.post("/api/deals", async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      value,
      stage,
      expectedCloseDate,
      companyId,
      ownerId,
    } = req.body;

    const deal = await prisma.deal.create({
      data: {
        title,
        description,
        requirements,
        value,
        stage,
        expectedCloseDate: expectedCloseDate
          ? new Date(expectedCloseDate)
          : null,
        companyId: Number(companyId),
        ownerId: Number(ownerId),
      },
      include: {
        company: true,
        owner: true,
      },
    });

    res.status(201).json(deal);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create deal",
    });
  }
});
app.put("/api/deals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      title,
      description,
      requirements,
      value,
      stage,
      expectedCloseDate,
      companyId,
      ownerId,
    } = req.body;

    const deal = await prisma.deal.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        requirements,
        value,
        stage,
        expectedCloseDate: expectedCloseDate
          ? new Date(expectedCloseDate)
          : null,
        companyId: Number(companyId),
        ownerId: Number(ownerId),
      },
      include: {
        company: true,
        owner: true,
      },
    });

    res.json(deal);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update deal",
    });
  }
});
app.delete("/api/deals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const deal = await prisma.deal.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Deal deleted successfully",
      deal,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete deal",
    });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

//Login Password

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Don't reveal whether email exists
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check whether account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "8h",
    }
    );

    // Never send passwordHash to frontend
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});