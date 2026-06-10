import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { searchPlaces } from "../services/placesService";
import { FetchFilters } from "../types";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const filters = req.body as FetchFilters;

    if (!filters.businessType || !filters.lat || !filters.lng) {
      res.status(400).json({ data: null, error: "businessType, lat, and lng are required" });
      return;
    }

    const results = await searchPlaces(filters);
    let savedCount = 0;

    for (const place of results) {
      const exists = await prisma.lead.findUnique({
        where: { placeId: place.placeId },
      });
      if (exists) continue;

      await prisma.lead.create({
        data: {
          placeId: place.placeId,
          name: place.name,
          address: place.address,
          phone: place.phone,
          rating: place.rating,
          mapsUrl: place.mapsUrl,
          onlinePresence: place.onlinePresence,
          description: place.description,
          priceLevel: place.priceLevel,
          userRatingCount: place.userRatingCount,
          businessType: place.businessType,
          location: place.location,
          status: "FETCHED",
        },
      });
      savedCount++;
    }

    console.log(
      `Fetch completed: ${results.length} results, ${savedCount} new leads saved`
    );

    res.json({
      data: { total: results.length, saved: savedCount },
      error: null,
    });
  } catch (err: any) {
    console.error("Fetch error:", err);
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
