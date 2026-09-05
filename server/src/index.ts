import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticate, authorize } from "./middleware/auth";
const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());
// ==================== DEAL LIFECYCLE ====================

const DEAL_STAGES = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

const STAGE_INDEX: Record<string, number> = {
  NEW: 0,
  QUALIFIED: 1,
  PROPOSAL: 2,
  NEGOTIATION: 3,
  WON: 4,
  LOST: 4,
};

function isValidDealStage(stage: string) {
  return DEAL_STAGES.includes(stage as any);
}

function validateStageTransition(
  currentStage: string,
  newStage: string,
  reason?: string
) {
  if (!isValidDealStage(newStage)) {
    return "Invalid deal stage";
  }

  if (currentStage === newStage) {
    return null;
  }

  // Closed deals cannot be changed through normal stage update
  if (currentStage === "WON" || currentStage === "LOST") {
    return "Won or Lost deals cannot be changed directly. A Manager must reopen the deal.";
  }

  // Cannot move directly from one closing stage to the other
  if (
    (currentStage === "WON" && newStage === "LOST") ||
    (currentStage === "LOST" && newStage === "WON")
  ) {
    return "Closed deals cannot change stage.";
  }

  const currentIndex = STAGE_INDEX[currentStage];
  const newIndex = STAGE_INDEX[newStage];

  if (currentIndex === undefined) {
    return "Current deal has an invalid stage";
  }

  if (newIndex === undefined) {
    return "Invalid new deal stage";
  }

  // Forward movement: exactly one stage
  if (newIndex > currentIndex) {
    if (newIndex - currentIndex !== 1) {
      return "Deal cannot skip stages";
    }

    // WON and LOST can only be reached from NEGOTIATION
    if (
      (newStage === "WON" || newStage === "LOST") &&
      currentStage !== "NEGOTIATION"
    ) {
      return "A deal can only be closed from NEGOTIATION";
    }

    return null;
  }

  // Backward movement: exactly one stage + reason required
  if (currentIndex - newIndex === 1) {
    if (!reason || !reason.trim()) {
      return "A reason is required when moving a deal backward";
    }

    return null;
  }

  return "Deal can only move one stage at a time";
}

app.get("/api/companies", authenticate, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    const sortBy = String(req.query.sortBy || "name");
    const order = String(req.query.order || "asc");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 5, 1),
      100
    );

    if (req.query.all === "true") {
      const companies = await prisma.company.findMany({
        where: { isArchived: false },
        orderBy: { name: "asc" },
      });

      return res.json({
        companies,
        total: companies.length,
        page: 1,
        limit: companies.length,
        totalPages: 1,
      });
    }

    const allowedSortFields = ["name", "createdAt"];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "name";

    const safeOrder = order === "desc" ? "desc" : "asc";

    const where = {
      isArchived: false,
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                contactPerson: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                industry: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const total = await prisma.company.count({
      where,
    });

    const companies = await prisma.company.findMany({
      where,
      orderBy: {
        [safeSortBy]: safeOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Fetch companies error:", error);

    res.status(500).json({
      message: "Failed to fetch companies",
    });
  }
});
// Get archived companies - ADMIN and MANAGER
app.get(
  "/api/companies/archived",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const companies = await prisma.company.findMany({
        where: {
          isArchived: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      res.json(companies);
    } catch (error) {
      console.error("Fetch archived companies error:", error);

      res.status(500).json({
        message: "Failed to fetch archived companies",
      });
    }
  }
);
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

app.post("/api/companies",authenticate,
  authorize("ADMIN", "MANAGER"), async (req, res) => {
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

app.put("/api/companies/:id",authenticate,
  authorize("ADMIN", "MANAGER"), async (req, res) => {
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
// Archive company - ADMIN and MANAGER
app.post(
  "/api/companies/:id/archive",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const company = await prisma.company.findUnique({
        where: {
          id,
        },
      });

      if (!company) {
        return res.status(404).json({
          message: "Company not found",
        });
      }

      if (company.isArchived) {
        return res.status(400).json({
          message: "Company is already archived",
        });
      }

      const archivedCompany = await prisma.company.update({
        where: {
          id,
        },
        data: {
          isArchived: true,
        },
      });

      res.json({
        message: "Company archived successfully",
        company: archivedCompany,
      });
    } catch (error) {
      console.error("Archive company error:", error);

      res.status(500).json({
        message: "Failed to archive company",
      });
    }
  }
);
// Restore company - ADMIN and MANAGER
app.post(
  "/api/companies/:id/restore",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const company = await prisma.company.findUnique({
        where: {
          id,
        },
      });

      if (!company) {
        return res.status(404).json({
          message: "Company not found",
        });
      }

      if (!company.isArchived) {
        return res.status(400).json({
          message: "Company is not archived",
        });
      }

      const restoredCompany = await prisma.company.update({
        where: {
          id,
        },
        data: {
          isArchived: false,
        },
      });

      res.json({
        message: "Company restored successfully",
        company: restoredCompany,
      });
    } catch (error) {
      console.error("Restore company error:", error);

      res.status(500).json({
        message: "Failed to restore company",
      });
    }
  }
);

app.delete("/api/companies/:id",authenticate,
  authorize("ADMIN"), async (req, res) => {
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

app.get("/api/deals", authenticate, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const stage = String(req.query.stage || "").trim();
    const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
    const isAll = req.query.all === "true";

    const sortBy = String(req.query.sortBy || "createdAt");
    const order = String(req.query.order || "desc");

    const allowedSortFields = [
      "createdAt",
      "value",
      "title",
      "expectedCloseDate",
      "stage",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const safeOrder = order === "asc" ? ("asc" as const) : ("desc" as const);

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const where: any = {};

    if (stage) {
      where.stage = stage;
    }

    if (companyId && !isNaN(companyId)) {
      where.companyId = companyId;
    }

    if (ownerId && !isNaN(ownerId)) {
      where.ownerId = ownerId;
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          requirements: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          company: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
        {
          owner: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
      ];
    }

    if (isAll) {
      const deals = await prisma.deal.findMany({
        where,
        include: {
          company: true,
          owner: true,
        },
        orderBy: {
          [safeSortBy]: safeOrder,
        },
      });

      return res.json({
        deals,
        total: deals.length,
        page: 1,
        limit: deals.length,
        totalPages: 1,
      });
    }

    const total = await prisma.deal.count({
      where,
    });

    const deals = await prisma.deal.findMany({
      where,
      include: {
        company: true,
        owner: true,
      },
      orderBy: {
        [safeSortBy]: safeOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      deals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Fetch deals error:", error);

    res.status(500).json({
      message: "Failed to fetch deals",
    });
  }
});
app.get("/api/deals/:id", authenticate,async (req, res) => {
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

app.post(
  "/api/deals",
  authenticate,
  authorize("ADMIN", "MANAGER", "SALES"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        requirements,
        value,
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

          // Every new deal starts at NEW
          stage: "NEW",

          previousStage: null,
          stageChangeReason: null,

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
      console.error("Create deal error:", error);

      res.status(500).json({
        message: "Failed to create deal",
      });
    }
  }
);
app.put(
  "/api/deals/:id",
  authenticate,
  authorize("ADMIN", "MANAGER", "SALES"),
  async (req, res) => {
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
        stageChangeReason,
      } = req.body;

      const existingDeal = await prisma.deal.findUnique({
        where: {
          id,
        },
      });

      if (!existingDeal) {
        return res.status(404).json({
          message: "Deal not found",
        });
      }

      let newStage = existingDeal.stage;
      let previousStage = existingDeal.previousStage;
      let reason = existingDeal.stageChangeReason;

      // Only validate lifecycle when the stage is actually changed
      if (stage && stage !== existingDeal.stage) {
        const errorMessage = validateStageTransition(
          existingDeal.stage,
          stage,
          stageChangeReason
        );

        if (errorMessage) {
          return res.status(400).json({
            message: errorMessage,
          });
        }

        // Save the stage before closing
        if (stage === "WON" || stage === "LOST") {
          previousStage = existingDeal.stage;
        }

        // Save reason for backward movement
        if (
          STAGE_INDEX[stage] < STAGE_INDEX[existingDeal.stage]
        ) {
          reason = stageChangeReason.trim();
        } else {
          reason = null;
        }

        newStage = stage;
      }

      const deal = await prisma.deal.update({
        where: {
          id,
        },
        data: {
          title,
          description,
          requirements,
          value,

          stage: newStage,
          previousStage,
          stageChangeReason: reason,

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
      console.error("Update deal error:", error);

      res.status(500).json({
        message: "Failed to update deal",
      });
    }
  }
);
// Manager can reopen a closed deal
app.post(
  "/api/deals/:id/reopen",
  authenticate,
  authorize("MANAGER"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const deal = await prisma.deal.findUnique({
        where: {
          id,
        },
      });

      if (!deal) {
        return res.status(404).json({
          message: "Deal not found",
        });
      }

      if (deal.stage !== "WON" && deal.stage !== "LOST") {
        return res.status(400).json({
          message: "Only Won or Lost deals can be reopened",
        });
      }

      if (!deal.previousStage) {
        return res.status(400).json({
          message: "Previous stage is not available for this deal",
        });
      }

      const reopenedDeal = await prisma.deal.update({
        where: {
          id,
        },
        data: {
          stage: deal.previousStage,
          previousStage: null,
          stageChangeReason: "Deal reopened by Manager",
        },
        include: {
          company: true,
          owner: true,
        },
      });

      res.json(reopenedDeal);
    } catch (error) {
      console.error("Reopen deal error:", error);

      res.status(500).json({
        message: "Failed to reopen deal",
      });
    }
  }
);
app.delete("/api/deals/:id",authenticate,
  authorize("ADMIN", "MANAGER"), async (req, res) => {
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

app.get("/api/users",authenticate, async (req, res) => {
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
// Create user - ADMIN only
app.post(
  "/api/users",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
      } = req.body;

      // Validate required fields
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          message: "Name, email, password and role are required",
        });
      }

      // Validate role
      const allowedRoles = ["ADMIN", "MANAGER", "SALES"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "User with this email already exists",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Create user error:", error);

      res.status(500).json({
        message: "Failed to create user",
      });
    }
  }
);

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