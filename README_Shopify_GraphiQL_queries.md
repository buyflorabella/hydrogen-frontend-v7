# README_Shopify_GraphiQL_queries.md

## GraphiQL endpoints:

### Admin API

https://admin.shopify.com/store/buy-flora-bella/apps/shopify-graphiql-app

### Storefront API

https://admin.shopify.com/store/buy-flora-bella/apps/api/2024-10/graphiql

### Customer API





### Example Queries

Get all Metafield definitions for products:

```
query CheckProductMetafieldDefinitions {
    metafieldDefinitions(ownerType: PRODUCT, first: 50) {
      nodes {
        id
        namespace
        key
        name
        type {
          name
        }
        access {
          storefront
        }
      }
    }
  }


```


