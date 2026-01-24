import { createContext, useContext, type ReactNode } from "react";

export interface EnvValues {
  storeLocked: boolean;
  message1: string;
  message2: string;
  message3: string;
}

const defaultEnv: EnvValues = {
  storeLocked: false,
  message1: "",
  message2: "",
  message3: "",
};

const EnvContext = createContext<EnvValues>(defaultEnv);


// EnvProvider is a React functional component which
// takes two props:
// - children (anything you put 'inside' <EnvProvider />)
// - env - the actual environment variables you want to expose
//
// -----
export const EnvProvider = ({
  children,
  env,
}: {
  children: ReactNode;
  env: EnvValues;
}) => {

    console.log("EnvContext.tsx [ entry ]");
    console.log(env);
  // EnvContext.Provider: is the React mechanism for sharing data with the component tree.
  // value={env} → this is the actual data that will be available to any component using useEnv() downstream.
  // {children} → renders all the nested components inside EnvProvider, exactly as they were passed.
  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
};

export const useEnv = () => useContext(EnvContext);
