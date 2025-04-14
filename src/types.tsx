export type Asset = {
  address: `0x${string}`;
  decimals: number;
  symbol: string;
  name: string;
  logo: string;
  faucetAmount: bigint;
};

export type Pool = {
  address: `0x${string}`;
  asset: Asset;
  symbol: string;
};

export type WalletBalances = Record<string, bigint | undefined>;

export type EpochInfo = Record<
  string,
  {
    currentEpoch: number;
    lastWrappedTime: number;
    hasRequest: boolean;
    pendingUserRequest: bigint;
  }
>;

export type RedeemableInfo = Record<
  string,
  {
    amounts: bigint[];
    epoch: number[];
  }
>;
