import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { Cart, Collection, ImageConnection, Product } from "./generated/types";
import { Connection, Edge } from "./types";

/**
 * Utility function to extract nodes from a GraphQL connection
 */
export function removeEdgesAndNodes<T>(connection: Connection<T>): T[] {
  if (!connection?.edges) return [];
  return connection.edges
    .filter(
      (edge): edge is Edge<T> => edge?.node !== null && edge?.node !== undefined
    )
    .map((edge) => edge.node);
}

/**
 * Transform Shopify cart to app cart format
 */
export function reshapeCart(cart: Cart) {
  if (!cart) {
    throw new Error("No cart provided");
  }

  // Ensure totalTaxAmount exists
  if (!cart.cost?.subtotalAmount) {
    cart.cost.subtotalAmount = {
      amount: "0.0",
      currencyCode: cart.cost.totalAmount.currencyCode,
    };
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines),
  };
}

/**
 * Transform Shopify collection to app collection format
 */
export function reshapeCollection(collection: Collection | null | undefined) {
  if (!collection) {
    return undefined;
  }

  return {
    ...collection,
    path: `/search/${collection.handle}`,
  };
}

/**
 * Transform multiple Shopify collections
 */
export function reshapeCollections(
  collections: (Collection | null | undefined)[]
) {
  return collections
    .map(reshapeCollection)
    .filter((collection) => Boolean(collection));
}

/**
 * Transform Shopify images with proper alt text
 */
export function reshapeImages(images: ImageConnection, productTitle: string) {
  const flattened = removeEdgesAndNodes(images);

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`,
    };
  });
}

/**
 * Transform Shopify product to app product format
 */
export function reshapeProduct(
  product: Product | null | undefined,
  filterHiddenProducts: boolean = true
) {
  if (!product) {
    return undefined;
  }

  if (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG)) {
    return undefined;
  }

  const { images, variants, ...rest } = product;

  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: removeEdgesAndNodes(variants),
  };
}

/**
 * Transform multiple Shopify products
 */
export function reshapeProducts(
  products: (Product | null | undefined)[],
  filterHiddenProducts: boolean = true
) {
  return products
    .map((product) => reshapeProduct(product, filterHiddenProducts))
    .filter((product) => Boolean(product));
}

/**
 * Convert menu URLs to internal paths
 */
export function reshapeMenuPath(url: string, domain: string): string {
  return url
    .replace(domain, "")
    .replace("/collections", "/search")
    .replace("/pages", "");
}
