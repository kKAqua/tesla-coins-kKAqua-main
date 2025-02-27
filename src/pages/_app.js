import "@/styles/globals.css";
import { useInitializeProviders, WalletProvider, PROVIDER_ID } from "@txnlab/use-wallet";
import { getNetworkCredentials } from "../clients";
import { DeflyWalletConnect } from "@blockshake/defly-connect";
import { PeraWalletConnect } from "@perawallet/connect";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const cred = getNetworkCredentials(network);

export default function App({ Component, pageProps }) {
  const walletProviders = useInitializeProviders({
    providers: [
      { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
      { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
      { id: PROVIDER_ID.KMD },
    ],
    nodeConfig: {
      network: network.toLowerCase(), //betanet, testnet, mainnet, sandnet
      nodeServer: cred.algod.address || "",
      nodeToken: cred.algod.token || "",
      nodePort: cred.algod.port || "",
    },
  });

  return (
    <WalletProvider value={walletProviders}>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
