import { Request, Response } from "express";
import prisma from "../prisma.js";

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    role: string;
  };
};


const MANAGEMENT_ROLES = ["ADMIN", "MANAGER"];

async function getDealAccess(
  dealId: number,
  userId: number,
  role: string
) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      ownerId: true,
      collaborators: {
        where: {
          userId,
        },
        select: {
          userId: true,
        },
      },
    },
  });

  if (!deal) {
    return {
      deal: null,
      canAccess: false,
      canManage: false,
    };
  }

  const isManager = MANAGEMENT_ROLES.includes(role);
  const isOwner = deal.ownerId === userId;
  const isCollaborator = deal.collaborators.length > 0;

  return {
    deal,
    canAccess: isManager || isOwner || isCollaborator,
    canManage: isManager || isOwner,
  };
}

export async function listDealCollaborators(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const dealId = Number(req.params.id);

    if (!Number.isInteger(dealId)) {
      return res.status(400).json({
        message: "Invalid deal ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const access = await getDealAccess(
      dealId,
      req.user.id,
      req.user.role
    );

    if (!access.deal) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    if (!access.canAccess) {
      return res.status(403).json({
        message: "You do not have access to this deal",
      });
    }

    const collaborators = await prisma.dealCollaborator.findMany({
      where: {
        dealId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json(collaborators);
  } catch (error) {
    console.error("Error fetching deal collaborators:", error);

    return res.status(500).json({
      message: "Failed to fetch deal collaborators",
    });
  }
}

export async function addDealCollaborator(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const dealId = Number(req.params.id);
    const userId = Number(req.body.userId);

    if (!Number.isInteger(dealId)) {
      return res.status(400).json({
        message: "Invalid deal ID",
      });
    }

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        message: "A valid collaborator userId is required",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const access = await getDealAccess(
      dealId,
      req.user.id,
      req.user.role
    );

    if (!access.deal) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    if (!access.canManage) {
      return res.status(403).json({
        message:
          "Only the deal owner or a manager can manage collaborators",
      });
    }

    if (access.deal.ownerId === userId) {
      return res.status(400).json({
        message: "The deal owner cannot be added as a collaborator",
      });
    }

    const collaborator = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!collaborator) {
      return res.status(404).json({
        message: "Collaborator user not found",
      });
    }

    if (!collaborator.isActive) {
      return res.status(400).json({
        message: "Inactive users cannot be added as collaborators",
      });
    }

    if (collaborator.role !== "SALES") {
      return res.status(400).json({
        message: "Only sales representatives can be collaborators",
      });
    }

    const existing = await prisma.dealCollaborator.findUnique({
      where: {
        dealId_userId: {
          dealId,
          userId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        message: "User is already a collaborator on this deal",
      });
    }

    const created = await prisma.dealCollaborator.create({
      data: {
        dealId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("Error adding deal collaborator:", error);

    return res.status(500).json({
      message: "Failed to add deal collaborator",
    });
  }
}

export async function removeDealCollaborator(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const dealId = Number(req.params.id);
    const userId = Number(req.params.userId);

    if (!Number.isInteger(dealId) || !Number.isInteger(userId)) {
      return res.status(400).json({
        message: "Invalid deal or user ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const access = await getDealAccess(
      dealId,
      req.user.id,
      req.user.role
    );

    if (!access.deal) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    if (!access.canManage) {
      return res.status(403).json({
        message:
          "Only the deal owner or a manager can manage collaborators",
      });
    }

    const existing = await prisma.dealCollaborator.findUnique({
      where: {
        dealId_userId: {
          dealId,
          userId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Collaborator not found on this deal",
      });
    }

    await prisma.dealCollaborator.delete({
      where: {
        dealId_userId: {
          dealId,
          userId,
        },
      },
    });

    return res.json({
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    console.error("Error removing deal collaborator:", error);

    return res.status(500).json({
      message: "Failed to remove deal collaborator",
    });
  }
}