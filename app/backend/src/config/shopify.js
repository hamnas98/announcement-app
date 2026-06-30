import { shopifyApi, ApiVersion, LogSeverity } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2025-01";

const shopify = shopifyApi({
	apiKey: process.env.SHOPIFY_API_KEY,
	apiSecretKey: process.env.SHOPIFY_API_SECRET,
	apiVersion: ApiVersion.January25,

	scopes: ["write_products"],

	hostName: process.env.HOST
		? process.env.HOST.replace(/https?:\/\//, "")
		: "localhost",

	hostScheme: "https",
	restResources,
	isEmbeddedApp: true,
	logger: { level: LogSeverity.Warning },
});

export default shopify;
