/**
 * Network configuration. Defaults point at the live v2 router on Stellar
 * testnet; override any of them with a `.env.local` (see `.env.example`).
 */
export const CONTRACT_ID: string =
  import.meta.env.VITE_CONTRACT_ID ?? "CCPRQANY467KKE4ROKCNW6TH3LY3EPVFRXIXJ5V4VCYHLJKWZPOZYQJQ";

export const RPC_URL: string = import.meta.env.VITE_RPC_URL ?? "https://soroban-testnet.stellar.org";

export const NETWORK: string = import.meta.env.VITE_NETWORK ?? "testnet";

const EXPLORER = `https://stellar.expert/explorer/${NETWORK}`;

export const explorer = {
  contract: (id: string) => `${EXPLORER}/contract/${id}`,
  account: (id: string) => `${EXPLORER}/account/${id}`,
  tx: (hash: string) => `${EXPLORER}/tx/${hash}`,
};

/** Native XLM's Stellar Asset Contract on testnet. */
export const NATIVE_XLM_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
