import { Router, Request, Response } from "express";
import { previewEmail, sendEmail as sendEmailService } from "../services/emailService";
import prisma from "../prisma";

const router = Router();

router.get("/preview/:id", async (req: Request, res: Response) => {
  try {
    const preview = await previewEmail(req.params.id);
    res.json({ data: preview, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post("/:id", async (req: Request, res: Response) => {
  try {
    const { customBody } = req.body;
    await sendEmailService(req.params.id, customBody);
    res.json({ data: { sent: true }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.get("/templates", async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.template.findMany();
    res.json({ data: templates, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post("/templates", async (req: Request, res: Response) => {
  try {
    const { businessType, subject, body } = req.body;
    if (!businessType || !subject || !body) {
      res.status(400).json({ data: null, error: "businessType, subject, and body are required" });
      return;
    }

    const template = await prisma.template.upsert({
      where: { businessType },
      update: { subject, body },
      create: { businessType, subject, body },
    });

    res.json({ data: template, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.delete("/templates/:businessType", async (req: Request, res: Response) => {
  try {
    await prisma.template.delete({
      where: { businessType: req.params.businessType },
    });
    res.json({ data: { deleted: true }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
