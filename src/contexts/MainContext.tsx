import React, {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
} from "react";
import { createInstance, FhevmInstance, initFhevm } from "fhevmjs";
import { WRAPPER_ADDRESS } from "@/constants";
import {
  useAccount,
  useChainId,
  useConnectorClient,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";
import {
  Asset,
  EpochInfo,
  Pool,
  RedeemableInfo,
  WalletBalances,
} from "@/types";
import { BrowserProvider } from "ethers";
import {
  getEpochInfo,
  getFaucetContract,
  getRedeemableAmounts,
  getTokenBalances,
  getTokenContract,
  getTokens,
  getWrapperContract,
} from "@/utils";
import { ZeroAddress } from "ethers";
import { Id as ToastId, ToastContainer, toast } from "react-toastify";
import { formatUnits } from "ethers";
import CustomNotification from "@/components/CustomNotification";
import { sepolia } from "wagmi/chains";

interface IMainContext {
  fhEVMInstance?: FhevmInstance;
  balances: WalletBalances;
  epochInfo: EpochInfo;
  redeemableInfo: RedeemableInfo;
  decryptEuint256: (value: bigint) => void;
  updateBalances: () => void;
  updateEpochInfo: () => void;
  getFreeToken: (asset: Asset) => void;
  approveToken: (
    pool: Pool,
    isDeposit: boolean,
    amount: bigint
  ) => Promise<boolean>;
  wrapRequest: (isDeposit: boolean, pool: Pool, amount: bigint) => void;
  wrap: (pool: Pool, isDeposit: boolean) => void;
  redeem: (pool: Pool, epoch: number, isDeposit: boolean) => void;
}

export const MainContext = createContext<IMainContext>({
  balances: {},
  epochInfo: {},
  redeemableInfo: {},
  decryptEuint256: () => {},
  updateBalances: () => {},
  updateEpochInfo: () => {},
  getFreeToken: () => {},
  approveToken: async () => {
    return true;
  },
  wrapRequest: () => {},
  wrap: () => {},
  redeem: () => {},
});

const MainProvider = ({ children }: PropsWithChildren) => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: connectorClient } = useConnectorClient();
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [fhEVMInstance, setFVMInstance] = useState<FhevmInstance>();
  const [balances, setBalances] = useState<WalletBalances>({});
  const [epochInfo, setEpochInfo] = useState<EpochInfo>({});
  const [redeemableInfo, setRedeemableInfo] = useState<RedeemableInfo>({});
  const [fvmInitialized, setFvmInitialized] = useState(false);
  const [reloadInterval, setReloadInterval] = useState<any>();

  const provider = useMemo(() => {
    if (connectorClient) {
      return new BrowserProvider(connectorClient.transport);
    }
    return undefined;
  }, [connectorClient]);

  useEffect(() => {
    if (chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id });
    }
  }, [chainId, switchChain]);

  const initFhevmInstance = useCallback(async () => {
    try {
      if (!fvmInitialized) {
        const res = await initFhevm();
        if (res) {
          setFvmInitialized(true);
        } else {
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [fvmInitialized]);

  const createFhevmIntance = useCallback(async () => {
    let toastId: ToastId | undefined = undefined;
    try {
      if (fvmInitialized && !fhEVMInstance) {
        toastId = toast(CustomNotification, {
          data: {
            title: "Initializing FVM instance",
            content: `Initializing and creating FVM instance...`,
          },
          isLoading: true,
          closeButton: false,
        });

        const _instance = await createInstance({
          network: window.ethereum,
          gatewayUrl: "https://gateway.sepolia.zama.ai",
          kmsContractAddress: "0x9D6891A6240D6130c54ae243d8005063D05fE14b",
          aclContractAddress: "0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e5",
        });

        setFVMInstance(_instance);

        toast.update(toastId, {
          isLoading: false,
          type: "success",
          autoClose: 5000,
          closeButton: true,
        });
      }
    } catch (err) {
      console.error(err);
      if (toastId) {
        toast.update(toastId, {
          data: {
            title: "Initializing FVM instance",
            content: `Failed to initialize FVM instance...`,
            onClick: () => {
              createFhevmIntance();
              toast.dismiss(toastId);
            },
            allowRetry: true,
          },
          isLoading: false,
          type: "error",
        });
      }
    }
  }, [fvmInitialized, fhEVMInstance]);

  const updateBalances = useCallback(
    async () => {
      try {
        if (provider && address) {
          const tokens = getTokens();
          const res = await getTokenBalances(provider, tokens, address);
          const bal = { ...balances };
          for (let i = 0; i < tokens.length; i += 1) {
            bal[tokens[i].toLowerCase()] = res[i];
          }

          setBalances(bal);
        }
      } catch (err) {
        console.error(err);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address]
  );

  const updateEpochInfo = useCallback(async () => {
    try {
      if (provider) {
        const res = await getEpochInfo(provider, address ?? ZeroAddress);
        const tokens = getTokens();
        const epoch: EpochInfo = {};
        for (let i = 0; i < tokens.length; i += 1) {
          epoch[tokens[i].toString()] = {
            currentEpoch: Number(res[0][i]),
            lastWrappedTime: Number(res[1][i]),
            hasRequest: res[2][i],
            pendingUserRequest: res[3][i],
          };
        }

        setEpochInfo(epoch);
      }
    } catch (err) {
      console.error(err);
    }
  }, [provider, address]);

  const updateRedeemableAmounts = useCallback(async () => {
    try {
      if (provider && address) {
        const res = await getRedeemableAmounts(
          provider,
          getTokens(),
          epochInfo,
          address
        );
        setRedeemableInfo(res);
      }
    } catch (err) {
      console.error(err);
    }
  }, [provider, address, epochInfo]);

  const getFreeToken = useCallback(
    async (asset: Asset) => {
      if (provider) {
        try {
          const signer = await provider.getSigner();
          const contract = getFaucetContract(signer);

          const toastId = toast(CustomNotification, {
            data: {
              title: "Get free token!",
              content: `Requested ${formatUnits(
                asset.faucetAmount,
                asset.decimals
              )}${asset.symbol} from Faucet.`,
            },
            isLoading: true,
          });

          const tx = await contract.mint(
            asset.address,
            address,
            asset.faucetAmount
          );

          toast.update(toastId, {
            data: {
              title: "Get free token!",
              content: `Requested ${formatUnits(
                asset.faucetAmount,
                asset.decimals
              )}${asset.symbol} from Faucet.`,
              tx: tx.hash,
            },
          });

          await tx.wait(1);

          await updateBalances();
          toast.update(toastId, {
            isLoading: false,
            type: "success",
            autoClose: 5000,
          });
        } catch (err) {
          console.error(err);
          toast(CustomNotification, {
            data: {
              title: "Failed to get free token!",
              content: `There was an unexpected error to get free token!`,
            },
            type: "error",
            autoClose: 5000,
          });
        }
      }
    },
    [provider, address, updateBalances]
  );

  const approveToken = useCallback(
    async (
      pool: Pool,
      isDeposit: boolean,
      amount: bigint
    ): Promise<boolean> => {
      if (provider && address) {
        let toastId: ToastId | undefined = undefined;

        try {
          const signer = await provider.getSigner();

          const token = isDeposit ? pool.asset.address : pool.address;

          const contract = getTokenContract(signer, token);

          const allowance = await contract.allowance(address, WRAPPER_ADDRESS);
          if (allowance >= amount) {
            return true;
          }

          toastId = toast(CustomNotification, {
            data: {
              title: "Approve token to wrap",
              content: `Approving ${formatUnits(amount, pool.asset.decimals)}${
                isDeposit ? pool.asset.symbol : pool.symbol
              } to wrap.`,
            },
            isLoading: true,
          });

          const tx = await contract.approve(WRAPPER_ADDRESS, amount);
          toast.update(toastId, {
            data: {
              title: "Approve token to wrap",
              content: `Approving ${formatUnits(amount, pool.asset.decimals)}${
                isDeposit ? pool.asset.symbol : pool.symbol
              } to wrap.`,
              tx: tx.hash,
            },
          });

          await tx.wait(1);

          toast.update(toastId, {
            isLoading: false,
            type: "success",
            autoClose: 5000,
          });

          return true;
        } catch (err) {
          console.error(err);
          if (toastId) {
            toast.update(toastId, {
              data: {
                title: "Failed to approve token!",
                content: `There was an unexpected error to approve token!`,
              },
              type: "error",
              autoClose: 5000,
              isLoading: false,
            });
          } else {
            toast(CustomNotification, {
              data: {
                title: "Failed to approve token!",
                content: `There was an unexpected error to approve token!`,
              },
              type: "error",
              autoClose: 5000,
            });
          }
          return false;
        }
      }

      return false;
    },
    [provider, address]
  );

  const wrapRequest = useCallback(
    async (isDeposit: boolean, pool: Pool, amount: bigint) => {
      let toastId: ToastId | undefined = undefined;
      if (provider) {
        try {
          const signer = await provider.getSigner();
          const contract = getWrapperContract(signer);

          toastId = toast(CustomNotification, {
            data: {
              title: `Sending ${
                isDeposit ? "deposit" : "withdraw"
              } wrap request`,
              content: `Sending wrap request to ${
                isDeposit ? "deposit" : "withdraw"
              } ${formatUnits(amount, pool.asset.decimals)}${
                isDeposit ? pool.asset.symbol : pool.symbol
              }.`,
            },
            isLoading: true,
          });

          const tx = await contract.wrapRequest(
            pool.asset.address,
            amount,
            isDeposit
          );

          toast.update(toastId, {
            data: {
              title: `Sending ${
                isDeposit ? "deposit" : "withdraw"
              } wrap request`,
              content: `Sending wrap request to ${
                isDeposit ? "deposit" : "withdraw"
              } ${formatUnits(amount, pool.asset.decimals)}${
                isDeposit ? pool.asset.symbol : pool.symbol
              }.`,
              tx: tx.hash,
            },
          });

          await tx.wait(1);

          await Promise.all([updateEpochInfo(), updateBalances()]);

          toast.update(toastId, {
            isLoading: false,
            type: "success",
            autoClose: 5000,
          });
        } catch (err) {
          console.error(err);
          if (toastId) {
            toast.update(toastId, {
              data: {
                title: "Failed to send wrap request!",
                content: `There was an unexpected error to send wrap request!`,
              },
              type: "error",
              autoClose: 5000,
              isLoading: false,
            });
          } else {
            toast(CustomNotification, {
              data: {
                title: "Failed to send wrap request!",
                content: `There was an unexpected error to send wrap request!`,
              },
              type: "error",
              autoClose: 5000,
            });
          }
        }
      }
    },
    [provider, updateEpochInfo, updateBalances]
  );

  const wrap = useCallback(
    async (pool: Pool, isDeposit: boolean) => {
      let toastId: ToastId | undefined = undefined;
      if (provider) {
        try {
          const signer = await provider.getSigner();
          const contract = getWrapperContract(signer);

          toastId = toast(CustomNotification, {
            data: {
              title: `${isDeposit ? "Depositing" : "Withdrawing"} assets ${
                isDeposit ? "to" : "from"
              } Aave`,
              content: `${
                isDeposit ? "Depositing" : "Withdrawing"
              } wrapped assets ${isDeposit ? "to" : "from"} Aave`,
            },
            isLoading: true,
          });

          const tx = await contract.wrap(pool.asset.address, isDeposit);

          toast.update(toastId, {
            data: {
              title: `${isDeposit ? "Depositing" : "Withdrawing"} assets ${
                isDeposit ? "to" : "from"
              } Aave`,
              content: `${
                isDeposit ? "Depositing" : "Withdrawing"
              } wrapped assets ${isDeposit ? "to" : "from"} Aave`,
              tx: tx.hash,
            },
          });

          await tx.wait(1);

          toast.update(toastId, {
            isLoading: false,
            type: "success",
            autoClose: 5000,
          });
        } catch (err) {
          console.error(err);
          if (toastId) {
            toast.update(toastId, {
              data: {
                title: "Failed to wrap!",
                content: `There was an unexpected error to wrap!`,
              },
              type: "error",
              autoClose: 5000,
              isLoading: false,
            });
          } else {
            toast(CustomNotification, {
              data: {
                title: "Failed to wrap!",
                content: `There was an unexpected error to wrap!`,
              },
              type: "error",
              autoClose: 5000,
            });
          }
        }
      }
    },
    [provider, updateEpochInfo, updateBalances]
  );

  const redeem = useCallback(
    async (pool: Pool, epoch: number, isDeposit: boolean) => {
      let toastId: ToastId | undefined = undefined;
      if (provider) {
        try {
          const signer = await provider.getSigner();
          const contract = getWrapperContract(signer);

          toastId = toast(CustomNotification, {
            data: {
              title: `Redeeming ${isDeposit ? pool.symbol : pool.asset.symbol}`,
              content: `Redeeming ${
                isDeposit ? pool.symbol : pool.asset.symbol
              } at epoch #${epoch}`,
            },
            isLoading: true,
          });

          const tx = await contract.redeem(
            pool.asset.address,
            epoch,
            isDeposit
          );

          toast.update(toastId, {
            data: {
              title: `Redeeming ${isDeposit ? pool.symbol : pool.asset.symbol}`,
              content: `Redeeming ${
                isDeposit ? pool.symbol : pool.asset.symbol
              } at epoch #${epoch}`,
              tx: tx.hash,
            },
          });

          await tx.wait(1);

          toast.update(toastId, {
            isLoading: false,
            type: "success",
            autoClose: 5000,
          });
        } catch (err) {
          console.error(err);
          if (toastId) {
            toast.update(toastId, {
              data: {
                title: "Failed to redeem!",
                content: `There was an unexpected error to redeem!`,
              },
              type: "error",
              autoClose: 5000,
              isLoading: false,
            });
          } else {
            toast(CustomNotification, {
              data: {
                title: "Failed to redeem!",
                content: `There was an unexpected error to redeem!`,
              },
              type: "error",
              autoClose: 5000,
            });
          }
        }
      }
    },
    [provider, updateRedeemableAmounts, updateBalances]
  );

  useEffect(() => {
    initFhevmInstance();
  }, [initFhevmInstance]);

  useEffect(() => {
    createFhevmIntance();
  }, [createFhevmIntance]);

  useEffect(() => {
    updateBalances();
  }, [updateBalances]);

  useEffect(() => {
    updateEpochInfo();
  }, [updateEpochInfo]);

  useEffect(() => {
    updateRedeemableAmounts();
  }, [updateRedeemableAmounts]);

  useEffect(() => {
    if (reloadInterval) {
      clearInterval(reloadInterval);
    }
    const _interval = setInterval(() => {
      updateBalances();
      updateEpochInfo();
      updateRedeemableAmounts();
    }, 5000);

    setReloadInterval(_interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateBalances, updateEpochInfo, updateRedeemableAmounts]);

  const decryptEuint256 = useCallback(
    async (value: bigint): Promise<bigint | undefined> => {
      let toastId: ToastId | undefined = undefined;
      try {
        if (fhEVMInstance && address) {
          toastId = toast(CustomNotification, {
            data: {
              title: "Decrypting encrypted value",
              content: `Decrypting encrypted value to reveal it.`,
            },
            isLoading: true,
          });

          const { publicKey, privateKey } = fhEVMInstance.generateKeypair();

          const eip712 = fhEVMInstance.createEIP712(publicKey, WRAPPER_ADDRESS);

          const signature = await signTypedDataAsync({
            types: { Reencrypt: eip712.types.Reencrypt },
            primaryType: "Reencrypt", //eip712.primaryType,
            message: eip712.message,
            domain: eip712.domain as any,
          });

          const decryptedValue = await fhEVMInstance.reencrypt(
            value,
            privateKey,
            publicKey,
            signature,
            WRAPPER_ADDRESS,
            address
          );

          toast.update(toastId, {
            isLoading: false,
            type: "success",
            autoClose: 5000,
          });
          return decryptedValue;
        } else {
          toast(CustomNotification, {
            data: {
              title: "Decrypting encrypted value",
              content: `FVM Instance is not initialized yet. Try again later.`,
            },
            type: "error",
            autoClose: 5000,
          });
        }
      } catch (err) {
        if (toastId) {
          toast.update(toastId, {
            data: {
              title: "Failed to decrypt",
              content: `There was an unexpected error to decrypt!`,
            },
            type: "error",
            autoClose: 5000,
            isLoading: false,
          });
        } else {
          toast(CustomNotification, {
            data: {
              title: "Failed to decrypt",
              content: `There was an unexpected error to decrypt!`,
            },
            type: "error",
            autoClose: 5000,
          });
        }
      }
    },
    [fhEVMInstance, address, signTypedDataAsync]
  );

  return (
    <MainContext.Provider
      value={{
        fhEVMInstance,
        balances,
        epochInfo,
        redeemableInfo,
        decryptEuint256,
        updateBalances,
        updateEpochInfo,
        getFreeToken,
        approveToken,
        wrapRequest,
        wrap,
        redeem,
      }}
    >
      {children}
      <ToastContainer position="bottom-right" autoClose={false} />
    </MainContext.Provider>
  );
};

export default MainProvider;
