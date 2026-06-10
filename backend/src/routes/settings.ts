import { Router, Request, Response } from "express";
import prisma from "../prisma";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    res.json({ data: settings, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.put("/", async (req: Request, res: Response) => {
  try {
    const { defaultBizType, defaultLocation, defaultRadius } = req.body;
    const data: Record<string, unknown> = {};
    if (defaultBizType !== undefined) data.defaultBizType = defaultBizType;
    if (defaultLocation !== undefined) data.defaultLocation = defaultLocation;
    if (defaultRadius !== undefined) data.defaultRadius = defaultRadius;

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    res.json({ data: settings, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
