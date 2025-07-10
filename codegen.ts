import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: {
    [`https://0jaetk-3h.myshopify.com/api/2025-07/graphql.json`]: {
      headers: {
        "X-Shopify-Storefront-Access-Token":
          "8ad060936a62aca312f1a2193e889bb3",
        "Content-Type": "application/json",
      },
    },
  },
  documents: ["lib/shopify/**/*.ts", "!lib/shopify/generated/**/*"],
  generates: {
    "lib/shopify/generated/": {
      preset: "client",
      plugins: [],
      config: {
        useTypeImports: true,
        skipTypename: true,
        enumsAsTypes: true,
        dedupeFragments: true,
        documentMode: "string",
      },
    },
    "lib/shopify/generated/types.ts": {
      plugins: ["typescript", "typescript-operations"],
      config: {
        useTypeImports: true,
        skipTypename: true,
        enumsAsTypes: true,
        avoidOptionals: false,
        maybeValue: "T | null | undefined",
        scalars: {
          DateTime: "string",
          Decimal: "string",
          HTML: "string",
          URL: "string",
          JSON: "unknown",
        },
      },
    },
  },
  hooks: {
    afterAllFileWrite: ["prettier --write"],
  },
};

export default config;
