import { Router, Request, Response } from "express";
import prisma from "../prisma";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, businessType, location } = req.query;

    const where: Record<string, unknown> = { deletedAt: null };
    if (status) where.status = status as string;
    if (businessType) where.businessType = businessType as string;
    if (location) where.location = location as string;

    const leads = await prisma.lead.findMany({
      where,
      include: { notes: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: leads, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: { notes: true },
    });
    if (!lead) {
      res.status(404).json({ data: null, error: "Lead not found" });
      return;
    }
    res.json({ data: lead, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.patch("/:id/approve", async (req: Request, res: Response) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      res.status(404).json({ data: null, error: "Lead not found" });
      return;
    }
    if (lead.status !== "FETCHED") {
      res.status(400).json({ data: null, error: "Only FETCHED leads can be approved" });
      return;
    }
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { status: "APPROVED" },
    });
    res.json({ data: updated, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.patch("/:id/reject", async (req: Request, res: Response) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      res.status(404).json({ data: null, error: "Lead not found" });
      return;
    }
    if (lead.status !== "FETCHED") {
      res.status(400).json({ data: null, error: "Only FETCHED leads can be rejected" });
      return;
    }
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { status: "REJECTED" },
    });
    res.json({ data: updated, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.patch("/:id/replied", async (req: Request, res: Response) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      res.status(404).json({ data: null, error: "Lead not found" });
      return;
    }
    if (lead.status !== "EMAILED") {
      res.status(400).json({ data: null, error: "Only EMAILED leads can be marked replied" });
      return;
    }
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { status: "REPLIED" },
    });
    res.json({ data: updated, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.patch("/:id/email", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ data: null, error: "Email is required" });
      return;
    }
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { email },
    });
    res.json({ data: updated, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.patch("/:id/phone-contacted", async (req: Request, res: Response) => {
  try {
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { phoneContactedAt: new Date() },
    });
    res.json({ data: updated, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.patch("/:id/notes", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ data: null, error: "Note text is required" });
      return;
    }
    const note = await prisma.note.create({
      data: {
        leadId: req.params.id,
        text,
      },
    });
    res.json({ data: note, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.patch("/:id/trash", async (req: Request, res: Response) => {
  try {
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ data: updated, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.patch("/:id/restore", async (req: Request, res: Response) => {
  try {
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { deletedAt: null },
    });
    res.json({ data: updated, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.get("/trash/list", async (_req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { deletedAt: { not: null } },
      include: { notes: true },
      orderBy: { deletedAt: "desc" },
    });
    res.json({ data: leads, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ data: { deleted: true }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
