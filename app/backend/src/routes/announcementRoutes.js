import { Router } from "express";

import {
	saveAnnouncement,
	getAnnouncement,
} from "../controllers/announcementController.js";

const router = Router();

router.get("/test", (req, res) => {
	res.json({ message: "Announcement routes working ✅" });
});

router.get("/announcement", getAnnouncement);

router.post("/announcement", saveAnnouncement);

export default router;
