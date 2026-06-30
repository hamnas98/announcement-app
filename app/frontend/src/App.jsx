// app/frontend/src/App.jsx

import React from "react";
import { AppProvider as PolarisProvider, Page } from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import AnnouncementForm from "./components/AnnouncementForm";

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const host = searchParams.get("host");
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;

  // WHY this guard:
  // When opened directly at localhost:5173, there is no ?host= param.
  // host is only present when Shopify Admin loads the app inside its iframe.
  // Without this guard, AppBridgeProvider throws and crashes the whole app.
  // With this guard, we show a helpful message instead of a cryptic error.
  if (!host) {
    return (
      <PolarisProvider i18n={enTranslations}>
        <Page title="Announcement App">
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#6d7175", fontSize: "16px" }}>
              This app must be opened from Shopify Admin.
            </p>
            <p style={{ color: "#6d7175", fontSize: "14px", marginTop: "8px" }}>
              Run <code>shopify app dev</code> and press <strong>p</strong> to
              open the app preview.
            </p>
          </div>
        </Page>
      </PolarisProvider>
    );
  }

  return (
    <AppBridgeProvider
      config={{
        apiKey,
        host,
        forceRedirect: true,
      }}
    >
      <PolarisProvider i18n={enTranslations}>
        <Page
          title="Announcement App"
          subtitle="Manage your storefront announcement banner"
        >
          <AnnouncementForm />
        </Page>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}

export default App;