import { Pool } from "@/types";
import { DAI, USDC, USDT } from "./assets";

export const aDAI: Pool = {
  address:
    "0x09b796967443c3b0f0cae1dBD322D103C8d34dc5".toLowerCase() as `0x${string}`,
  asset: DAI,
  symbol: "aDAI",
};

export const aUSDT: Pool = {
  address:
    "0x1A72C502796429189c408Dc64AC494F583D30b77".toLowerCase() as `0x${string}`,
  asset: USDT,
  symbol: "aUSDT",
};

export const aUSDC: Pool = {
  address:
    "0x5941aa4D17b8ebE9A7644a1EF4adf0c7E384cF82".toLowerCase() as `0x${string}`,
  asset: USDC,
  symbol: "aUSDC",
};

export const pools = [aDAI, aUSDT, aUSDC];

export const POOL_ADDRESS = "0xD4536392D709F530129705BF0bcA889B90553bd0";
