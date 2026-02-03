import { createContext, useContext, type ReactNode } from "react";

// The clean types used by your components
export interface EnvValues {
  storeLocked: boolean;
  message1: string;
  message2: string;
  message3: string;
}

// DxB - remove this, replace by using EnvValues instead
// The raw types coming from Shopify / root.tsx loader
export interface Env {
  PUBLIC_STORE_LOCKED: string;
  PUBLIC_STORE_MESSAGE1: string;
  PUBLIC_STORE_MESSAGE2: string;
  PUBLIC_STORE_MESSAGE3: string;
  PUBLIC_STORE_DOMAIN: string;
  PUBLIC_STOREFRONT_ID: string;
  PUBLIC_CHECKOUT_DOMAIN: string;
  PUBLIC_STOREFRONT_API_TOKEN: string;
}

const defaultEnv: EnvValues = {
  storeLocked: false,
  message1: "",
  message2: "",
  message3: "",
};

const EnvContext = createContext<EnvValues>(defaultEnv);

export const EnvProvider = ({
  children,
  env,
}: {
  children: ReactNode;
  env: Env; // Accept raw strings from the loader
}) => {
  
  // FIX: Transform the raw string "true"/"false" into a real boolean
  // and map the raw keys to your clean EnvValues interface.
  const mappedValues: EnvValues = {
    storeLocked: env?.PUBLIC_STORE_LOCKED,
    message1: env?.PUBLIC_STORE_MESSAGE1 ?? "",
    message2: env?.PUBLIC_STORE_MESSAGE2 ?? "",
    message3: env?.PUBLIC_STORE_MESSAGE3 ?? "",
  };

  console.log("EnvProvider mapped values:", mappedValues);

  return (
    <EnvContext.Provider value={mappedValues}>
      {children}
    </EnvContext.Provider>
  );
};

export const useEnv = () => useContext(EnvContext);