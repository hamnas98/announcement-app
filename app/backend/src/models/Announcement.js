import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
	{
		shopDomain: {
			type: String,
			required: [true, "Shop domain is required"],
			trim: true,
			lowercase: true,
		},

		announcementText: {
			type: String,
			required: [true, "Announcement text is required"],
			trim: true,
			maxlength: [255, "Announcement must be 255 characters or less"],
		},

		isActive: {
			type: Boolean,
			default: false,
		},

		savedBy: {
			type: String,
			default: "merchant",
			trim: true,
		},
	},
	{
		timestamps: true,
	},
);

// ─── Indexes ──────────────────────────────────────────────────

announcementSchema.index({ shopDomain: 1 });

announcementSchema.index({ shopDomain: 1, isActive: 1 });

announcementSchema.index({ shopDomain: 1, createdAt: -1 });

announcementSchema.statics.getActiveAnnouncement = async function (shopDomain) {
	return this.findOne({
		shopDomain: shopDomain.toLowerCase(),
		isActive: true,
	});
};

announcementSchema.statics.getHistory = async function (
	shopDomain,
	limit = 10,
) {
	return this.find({ shopDomain: shopDomain.toLowerCase() })
		.sort({ createdAt: -1 }) // -1 = descending = newest first
		.limit(limit); // don't return unlimited records
};

announcementSchema.statics.deactivateAll = async function (shopDomain) {
	return this.updateMany(
		{ shopDomain: shopDomain.toLowerCase(), isActive: true },
		{ $set: { isActive: false } },
	);
};

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
