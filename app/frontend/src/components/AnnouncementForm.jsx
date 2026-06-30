
import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Banner,
  Divider,
  Badge,
  EmptyState,
  Spinner,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";

const MAX_LENGTH = 255;

const AnnouncementForm = () => {

  const fetch = useAuthenticatedFetch();

  const [announcementText, setAnnouncementText] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    isError: false,
  });
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchCurrentAnnouncement();
  }, []);

  const fetchCurrentAnnouncement = async () => {
    try {
      setIsFetching(true);

      const response = await fetch("/api/announcement");


      if (!response.ok) {
        if (response.status !== 404) {
          console.error("Failed to fetch announcement:", response.status);
        }
        return;
      }

      const data = await response.json();

      if (data.announcement) {
        setCurrentAnnouncement(data.announcement);
        setAnnouncementText(data.announcement.announcementText);
      }

      if (data.history) {
        setHistory(data.history);
      }

    } catch (error) {
      console.error("Failed to fetch announcement:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleTextChange = useCallback(
    (value) => {
      setAnnouncementText(value);
      if (fieldError) setFieldError("");
    },
    [fieldError],
  );

  const validate = () => {
    if (!announcementText.trim()) {
      setFieldError("Announcement text cannot be empty");
      return false;
    }
    if (announcementText.length > MAX_LENGTH) {
      setFieldError(`Announcement must be ${MAX_LENGTH} characters or less`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setToast({ show: false, message: "", isError: false });

    try {
      const response = await fetch("/api/announcement", {
        method: "POST",
        headers: {
     
          "Content-Type": "application/json",
        },
  
        body: JSON.stringify({
          announcementText: announcementText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save announcement");
      }


      await fetchCurrentAnnouncement();

      setToast({
        show: true,
        message: "✅ Announcement saved and synced to storefront!",
        isError: false,
      });

    } catch (error) {
      const errorMessage = error.message || "Failed to save announcement";
      setToast({
        show: true,
        message: `❌ ${errorMessage}`,
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const charsRemaining = MAX_LENGTH - announcementText.length;
  const isNearLimit = charsRemaining <= 30;
  const isOverLimit = charsRemaining < 0;

  return (
    <BlockStack gap="500">

      {/* ── Toast Notification ─────────────────────────────── */}
      {toast.show && (
        <Banner
          tone={toast.isError ? "critical" : "success"}
          onDismiss={() =>
            setToast({ show: false, message: "", isError: false })
          }
        >
          <Text as="p">{toast.message}</Text>
        </Banner>
      )}

      {/* ── Main Form Card ─────────────────────────────────── */}
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="100">
            <Text variant="headingMd" as="h2">
              📢 Store Announcement
            </Text>
            <Text variant="bodySm" tone="subdued">
              This announcement will appear as a banner on your storefront.
            </Text>
          </BlockStack>

          <Divider />

          <TextField
            label="Announcement Text"
            value={announcementText}
            onChange={handleTextChange}
            placeholder="e.g. Sale 50% OFF this weekend only!"
            helpText="Displayed as a banner on every page of your store."
            error={fieldError}
            maxLength={MAX_LENGTH}
            showCharacterCount
            multiline={2}
            autoComplete="off"
          />

          {isNearLimit && !isOverLimit && (
            <Banner tone="warning">
              <Text as="p" variant="bodySm">
                Only {charsRemaining} characters remaining.
              </Text>
            </Banner>
          )}

          <InlineStack align="end">
            <Button
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving || isOverLimit || !announcementText.trim()}
              size="large"
            >
              {isSaving ? "Saving..." : "Save Announcement"}
            </Button>
          </InlineStack>
        </BlockStack>
      </Card>

      {/* ── Currently Live ─────────────────────────────────── */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            🌐 Currently Live on Storefront
          </Text>

          <Divider />

          {isFetching ? (
            <InlineStack align="center" gap="200">
              <Spinner size="small" />
              <Text tone="subdued">Loading...</Text>
            </InlineStack>
          ) : currentAnnouncement ? (
            <BlockStack gap="200">
              <InlineStack gap="200" align="start" blockAlign="center">
                <Badge tone="success">Active</Badge>
                <Text variant="bodyMd">
                  "{currentAnnouncement.announcementText}"
                </Text>
              </InlineStack>
              <Text variant="bodySm" tone="subdued">
                Last updated:{" "}
                {new Date(
                  currentAnnouncement.updatedAt || currentAnnouncement.createdAt
                ).toLocaleString()}
              </Text>
            </BlockStack>
          ) : (
            <Text tone="subdued" variant="bodySm">
              No announcement set yet. Save one above to display it on your store.
            </Text>
          )}
        </BlockStack>
      </Card>

      {/* ── Announcement History ───────────────────────────── */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            📋 Announcement History
          </Text>

          <Divider />

          {isFetching ? (
            <InlineStack align="center">
              <Spinner size="small" />
            </InlineStack>
          ) : history.length > 0 ? (
            <BlockStack gap="300">
              {history.map((item) => (
                <InlineStack
                  key={item._id}
                  gap="300"
                  align="start"
                  blockAlign="center"
                >
                  {item.isActive ? (
                    <Badge tone="success">Active</Badge>
                  ) : (
                    <Badge>Past</Badge>
                  )}
                  <BlockStack gap="0">
                    <Text variant="bodyMd">"{item.announcementText}"</Text>
                    <Text variant="bodySm" tone="subdued">
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </BlockStack>
                </InlineStack>
              ))}
            </BlockStack>
          ) : (
            <EmptyState heading="No history yet" image="">
              <Text>
                Save your first announcement to see history here.
              </Text>
            </EmptyState>
          )}
        </BlockStack>
      </Card>

    </BlockStack>
  );
};

export default AnnouncementForm;