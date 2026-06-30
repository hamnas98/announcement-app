import shopify from "../config/shopify.js";

const SET_METAFIELD_MUTATION = `
  mutation SetShopAnnouncement($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
        type
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const GET_SHOP_QUERY = `
  query GetShopData {
    shop {
      id
      name
      myshopifyDomain
      metafield(namespace: "my_app", key: "announcement") {
        id
        value
        updatedAt
      }
    }
  }
`;

export const syncAnnouncementToShopify = async (session, announcementText) => {
  const client = new shopify.clients.Graphql({ session });

  // CHANGED: .query({ data: {...} }) → .request(query, { variables })
  const shopResponse = await client.request(GET_SHOP_QUERY);

  const shopGid = shopResponse.data.shop.id;
  console.log(`🏪 Shop GID: ${shopGid}`);

  const mutationResponse = await client.request(SET_METAFIELD_MUTATION, {
    variables: {
      metafields: [{
        ownerId: shopGid,
        namespace: "my_app",
        key: "announcement",
        value: announcementText,
        type: "single_line_text_field",
      }],
    },
  });

  const { metafields, userErrors } = mutationResponse.data.metafieldsSet;

  if (userErrors?.length > 0) {
    const messages = userErrors.map(e => `[${e.code}] ${e.message}`).join(", ");
    throw new Error(`Shopify rejected the metafield: ${messages}`);
  }

  return {
    success: true,
    metafield: metafields[0],
  };
};

export const getAnnouncementFromShopify = async (session) => {
  const client = new shopify.clients.Graphql({ session });

  const response = await client.request(GET_SHOP_QUERY);

  return response.data.shop.metafield;
};