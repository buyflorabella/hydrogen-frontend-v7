#!/bin/bash
# Shopify GraphQL API Configuration
# Update these values for your store

# Your Shopify store domain (without https://)
SHOPIFY_STORE="buy-flora-bella.myshopify.com"

# Admin API access token (create a custom app in Shopify Admin > Settings > Apps)
# Required scopes: read_products, write_products, read_metafield_definitions, write_metafield_definitions
#SHOPIFY_ADMIN_TOKEN="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"
SHOPIFY_ADMIN_TOKEN="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"

# API version (Shopify releases quarterly: 2024-01, 2024-04, 2024-07, 2024-10, 2025-01, etc.)
# Use a stable version - "2024-10" or "2025-01" recommended
API_VERSION="2026-01"

# Storefront API token (for storefront queries - optional)
STOREFRONT_TOKEN="9855ba59585b5bd47b86fc433307339d"
