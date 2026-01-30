import { type LoaderFunctionArgs } from 'react-router';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { storefront } = context;
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('q');

  if (!searchTerm) {
    return { products: [] };
  }

  const { products } = await storefront.query(SEARCH_QUERY, {
    variables: { searchTerm, first: 5 },
  });

  return { products: products.nodes };
}

const SEARCH_QUERY = `#graphql
  query SearchProducts($searchTerm: String!, $first: Int) {
    products(query: $searchTerm, first: $first) {
      nodes {
        id
        title
        handle
        trackingParameters
        featuredImage {
          url
          altText
          width
          height
        }
        variants(first: 1) {
          nodes {
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;