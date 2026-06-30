import Announcement from "../models/Announcement.js";
import {
	syncAnnouncementToShopify,
	getAnnouncementFromShopify,
} from "../services/shopifyService.js";

export async function saveAnnouncement(req, res) {
	try {
		const { announcementText } = req.body;

		if (!announcementText?.trim()) {
			return res
				.status(400)
				.json({ error: "Announcement text is required" });
		}

		const session = res.locals.shopify.session;
		const shopDomain = session.shop;
		const trimmedText = announcementText.trim();

		await Announcement.deactivateAll(shopDomain);

		const announcement = await Announcement.create({
			shopDomain,
			announcementText: trimmedText,
			isActive: true,
		});

		const { metafield } = await syncAnnouncementToShopify(
			session,
			trimmedText,
		);

		return res.status(200).json({ success: true, announcement, metafield });
	} catch (error) {
		console.error("saveAnnouncement error:", error.message);
		return res.status(500).json({ error: error.message });
	}
}

export async function getAnnouncement(req, res) {
	try {
		const session = res.locals.shopify.session;
		const shopDomain = session.shop;

		const [announcement, metafield, history] = await Promise.all([
			Announcement.getActiveAnnouncement(shopDomain),
			getAnnouncementFromShopify(session),
			Announcement.getHistory(shopDomain, 10),
		]);

		return res.status(200).json({
			success: true,
			announcement,
			metafield,
			history,
		});
	} catch (error) {
		console.error("getAnnouncement error:", error.message);
		return res.status(500).json({ error: error.message });
	}
}
