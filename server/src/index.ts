import express from "express";
import cors from "cors";
import prisma from "./prisma";

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});