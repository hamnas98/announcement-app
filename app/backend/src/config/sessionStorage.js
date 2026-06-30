import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";

let instance = null;

export function getSessionStorage() {
  if (instance) return instance;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set before initializing session storage");
  }

  instance = new MongoDBSessionStorage(
    new URL(process.env.MONGODB_URI),
    "shopify_sessions"
   
  );

  console.log("✅ MongoDB Session Storage ready");
  return instance;
}