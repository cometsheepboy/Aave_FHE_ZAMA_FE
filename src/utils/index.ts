import {
  FAUCET_ADDRESS,
  MULTICALL_ADDRESS,
  pools,
  WRAPPER_ADDRESS,
} from "@/constants";
import FaucetAbi from "@/constants/abis/Faucet.json";
import ERC20Abi from "@/constants/abis/FaucetERC20.json";
import MulticallAbi from "@/constants/abis/Multicall.json";
import WrapperAbi from "@/constants/abis/Wrapper.json";
import {
  Asset,
  EpochInfo,
  Pool,
  RedeemableInfo,
  WalletBalances,
} from "@/types";
import { Contract, ContractRunner, formatUnits, Interface } from "ethers";

export const getWalletHumanBalance = (
  balances: WalletBalances,
  token: Asset | Pool
) => {
  const asset: Asset =
    "asset" in token && token.asset ? token.asset : (token as Asset);

  if (balances[token.address.toLowerCase()] !== undefined) {
    return (
      formatUnits(balances[token.address.toLowerCase()]!, asset.decimals) +
      " " +
      token.symbol
    );
  }

  return "--.--";
};

export const getMulticallContract = (provider: ContractRunner): Contract =>
  new Contract(MULTICALL_ADDRESS, MulticallAbi, provider);

export const getTokenBalances = async (
  provider: ContractRunner,
  tokens: string[],
  user: string
) => {
  const multicall = getMulticallContract(provider);

  const ERC20Iface = new Interface(ERC20Abi);

  const calls = tokens.map((token) => ({
    target: token,
    allowFailure: false,
    callData: ERC20Iface.encodeFunctionData("balanceOf", [user]),
  }));

  const results = await multicall.aggregate3.staticCall(calls);

  return results.map(
    (res: { success: boolean; returnData: string }) =>
      ERC20Iface.decodeFunctionResult("balanceOf", res.returnData)[0]
  );
};

export const getTokens = () => {
  const tokens: string[] = [];

  pools.forEach((item) => {
    tokens.push(item.address);
    tokens.push(item.asset.address);
  });

  return tokens;
};

export const getEpochInfo = (provider: ContractRunner, user: string) => {
  const wrapperContract = new Contract(WRAPPER_ADDRESS, WrapperAbi, provider);

  return wrapperContract.getWrapperInfo(getTokens(), user);
};

export const getFaucetContract = (provider: ContractRunner): Contract =>
  new Contract(FAUCET_ADDRESS, FaucetAbi, provider);

export const getWrapperContract = (provider: ContractRunner): Contract =>
  new Contract(WRAPPER_ADDRESS, WrapperAbi, provider);

export const getTokenContract = (
  provider: ContractRunner,
  token: string
): Contract => new Contract(token, ERC20Abi, provider);

export const getRedeemableAmounts = async (
  provider: ContractRunner,
  tokens: string[],
  epochInfo: EpochInfo,
  user: string
): Promise<RedeemableInfo> => {
  const multicall = getMulticallContract(provider);
  const WrapperIface = new Interface(WrapperAbi);

  const calls = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const _epochInfo = epochInfo[tokens[i].toLowerCase()];

    if (!_epochInfo) continue;

    for (let j = 0; j < _epochInfo.currentEpoch; j += 1) {
      calls.push({
        target: WRAPPER_ADDRESS,
        allowFailure: false,
        callData: WrapperIface.encodeFunctionData("hasWithdrawn", [
          j,
          tokens[i],
          user,
        ]),
      });
      calls.push({
        target: WRAPPER_ADDRESS,
        allowFailure: false,
        callData: WrapperIface.encodeFunctionData("pendingUserRequests", [
          j,
          tokens[i],
          user,
        ]),
      });
    }
  }

  if (calls.length === 0) {
    return {};
  }

  const results = await multicall.aggregate3.staticCall(calls);

  const res: RedeemableInfo = {};

  let resultIdx = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const _epochInfo = epochInfo[tokens[i].toLowerCase()];

    if (!_epochInfo) continue;

    const resOfToken: { amounts: bigint[]; epoch: number[] } = {
      amounts: [],
      epoch: [],
    };

    for (let i = 0; i < _epochInfo.currentEpoch; i += 1) {
      const hasWithdrawn = WrapperIface.decodeFunctionResult(
        "hasWithdrawn",
        results[resultIdx++][1]
      )[0];

      if (!hasWithdrawn) {
        const amount: bigint = WrapperIface.decodeFunctionResult(
          "pendingUserRequests",
          results[resultIdx][1]
        )[0];

        if (amount !== 0n) {
          resOfToken.amounts.push(amount);
          resOfToken.epoch.push(i);
        }
      }
      resultIdx++;
    }

    res[tokens[i].toLowerCase()] = resOfToken;
  }

  return res;
};
