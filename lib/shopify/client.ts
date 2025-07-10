import { SHOPIFY_GRAPHQL_API_ENDPOINT } from 'lib/constants';
import { isShopifyError } from 'lib/type-guards';
import { ensureStartsWith } from 'lib/utils';

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, 'https://')
  : '';

const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;
const key = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

export interface ShopifyFetchOptions<TVariables = Record<string, any>> {
  headers?: HeadersInit;
  query: string;
  variables?: TVariables;
}

export interface ShopifyFetchResult<TData> {
  status: number;
  body: {
    data: TData;
    errors?: Array<{
      message: string;
      extensions?: Record<string, any>;
    }>;
  };
}

/**
 * Type-safe Shopify GraphQL client
 * @template TData The expected data type from the query
 * @template TVariables The variables type for the query
 */
export async function shopifyFetch<TData, TVariables = Record<string, any>>({
  headers,
  query,
  variables
}: ShopifyFetchOptions<TVariables>): Promise<ShopifyFetchResult<TData>> {
  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': key,
        ...headers
      },
      body: JSON.stringify({
        query,
        ...(variables && { variables })
      })
    });

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    if (isShopifyError(e)) {
      throw {
        cause: e.cause?.toString() || 'unknown',
        status: e.status || 500,
        message: e.message,
        query
      };
    }

    throw {
      error: e,
      query
    };
  }
}

/**
 * Utility to create a typed Shopify client for a specific query/mutation
 */
export function createShopifyClient<TData, TVariables = void>() {
  return async (
    query: string,
    variables?: TVariables,
    headers?: HeadersInit
  ): Promise<TData> => {
    const { body } = await shopifyFetch<TData, TVariables>({
      query,
      variables,
      headers
    });
    return body.data;
  };
}