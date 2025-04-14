import { Header } from "@/components/Header";
import Web3Provider from "@/components/Web3Provider";
import MainProvider from "@/contexts/MainContext";
import type { AppProps } from "next/app";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <MainProvider>
        <div className="flex flex-col">
          <Header />
          <Component {...pageProps} />
        </div>
      </MainProvider>
    </Web3Provider>
  );
}
