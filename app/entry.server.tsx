import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

const omnisendHosts = [
  'https://*.omnisend.com',
  'https://*.omnisendlink.com',
  'https://omnisnippet1.com', // <-- newly added
  'https://forms.soundestlink.com',
  'https://wt.soundestlink.com',
  'https://wt.omnisendlink.com',
  'https://omnisnippet.com',
];

const googanalytics = [
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
]

const clarity = [
  'https://clarity.ms',
  'https://*.clarity.ms',
  'https://c.clarity.ms',
  'https://l.clarity.ms',
  'https://script.clarity.ms',  
];

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://*.omnisnippet1.com',
      'https://*.omnisnippet.com',
      ...omnisendHosts,
      ...googanalytics,
      ...clarity,
    ],
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    imgSrc: [
      "'self'",
      "https://cdn.shopify.com",
      "data:",
      "blob:",
      "https://images.pexels.com",
      'https://forms.soundestlink.com',
      "https://i.vtimg.com",
      ...clarity,
      ...omnisendHosts,
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",            
      "https://*.omnisnippet.com",
      ...omnisendHosts, 
    ],
    connectSrc: [
      "'self'",
      // Analytics
      ...googanalytics,
      ...clarity,
      ...omnisendHosts,
      // Our services
      //"https://survey-server.boardmansgame.com",
      //"https://email.boardmansgame.com",
      //"https://remail.buyflorabella.com",
      "https://*.buyflorabella.com",
      "https://*.boardmansgame.com",
      // Shopify telemetry (Hydrogen often needs this)
      'https://monorail-edge.shopifysvc.com', 
      // Websockets     
      // "wss://dev1-frontend.textreader.boardmansgame.com",
      // "wss://dev2-frontend.textreader.boardmansgame.com",
      // "wss://dev1-frontend.buyflorabella.com"
      "wss://*.buyflorabella.com",
      "wss://*.boardmansgame.com",
    ],
    frameSrc: [
      "'self'",
      'https://forms.omnisend.com',     // REQUIRED: This is the iframe source
      'https://*.youtube.com',
      // ... rest of your youtube entries ...
    ],
    childSrc: [
      "'self'",
      'https://www.youtube.com/embed/',
      'https://www.youtube-nocookie.com/',
      'https://*.youtube.com',
      'https://*.youtube-nocookie.com',
    ],
    mediaSrc: [
      "'self'", 
      'https://cdn.shopify.com/',
      'https://*.googleapis.com'
    ],
    fontSrc: [
      "'self'",
      'https://fonts.googleapis.com', // example if using Google Fonts
      'https://fonts.gstatic.com',
      'https://use.typekit.net',       
      // add any other font hosts here
    ],    
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
