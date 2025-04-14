import { Asset } from "@/types";
import { parseUnits } from "ethers";

export const DAI: Asset = {
  address:
    "0xD22bb3c93cC785E28c5597DCc6852E1D100A1B70".toLowerCase() as `0x${string}`,
  decimals: 18,
  name: "Dai Stablecoin",
  symbol: "DAI",
  logo: "/assets/tokens/dai.svg",
  faucetAmount: parseUnits("100", 18),
};

export const USDT: Asset = {
  address:
    "0xd4937EbEe26Ae28161B2E6A4255657D50c4Ce5E9".toLowerCase() as `0x${string}`,
  decimals: 6,
  name: "Tether USD",
  symbol: "USDT",
  logo: "/assets/tokens/usdt.svg",
  faucetAmount: parseUnits("100", 6),
};

export const USDC: Asset = {
  address:
    "0x5A3857Bd31d998dCAb13487a0788AeFf95397508".toLowerCase() as `0x${string}`,
  decimals: 6,
  name: "USDC Coin",
  symbol: "USDC",
  logo: "/assets/tokens/usdc.svg",
  faucetAmount: parseUnits("100", 6),
};

export const assets = [DAI, USDT, USDC];
