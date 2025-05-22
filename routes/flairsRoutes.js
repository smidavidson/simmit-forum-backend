import { Router } from "express";
import { flairsStore } from "../stores/flairsStore.js";

export const flairRoutes = Router();

// GET /flairs - Get all flairs
flairRoutes.get("/", async (req, res) => {
    try {
        const flairs = await flairsStore.getFlairs();
        res.json(flairs);
    } catch (error) {
        console.log(`Error in GET /flairs: ${error.message}`);
        res.status(500).json({ message: "Error fetching flairs" });
    }
});
