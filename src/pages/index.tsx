import Button from "@mui/material/Button";
import type { NextPage } from "next";
import Image from "next/image";
import { getWalletHumanBalance } from "@/utils";
import { aDAI, pools } from "@/constants";
import { ActionModal } from "@/components/ActionModal";
import { useState } from "react";
import { useMainContext } from "@/hooks";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

const Markets: NextPage = () => {
  const { balances } = useMainContext();
  const { isConnected } = useAccount();

  const [isDeposit, setIsDeposit] = useState(true);
  const [isWrap, setIsWrap] = useState(true);
  const [selectedPool, setPool] = useState(aDAI);
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl m-3">Markets</h1>
      <div className="flex items-center justify-center">
        <table className="border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-300">Market</th>
              <th className="border border-gray-300">Pool Balance</th>
              <th className="border border-gray-300">Asset Balance</th>
              <th className="border border-gray-300">Deposit to Aave</th>
              <th className="border border-gray-300">Withdraw from Aave</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => (
              <tr key={`faucet-${pool.asset.symbol}`}>
                <td className="border border-gray-300">
                  <div className="flex p-2">
                    <Image
                      src={pool.asset.logo}
                      width={52}
                      height={52}
                      alt={pool.asset.symbol}
                    />
                    <div className="flex flex-col justify-center ml-2">
                      <span className="text-xl text-bold">
                        {pool.asset.name}
                      </span>
                      <span>{pool.asset.symbol}</span>
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300">
                  <div className="flex px-2 items-center justify-center">
                    {getWalletHumanBalance(balances, pool)}
                  </div>
                </td>
                <td className="border border-gray-300">
                  <div className="flex px-2 items-center justify-center">
                    {getWalletHumanBalance(balances, pool.asset)}
                  </div>
                </td>
                <td className="border border-gray-300">
                  {isConnected ? (
                    <div className="flex flex-col p-2 gap-2">
                      <Button
                        className="flex-1 w-40"
                        variant="contained"
                        onClick={() => {
                          setPool(pool);
                          setIsDeposit(true);
                          setIsWrap(true);
                          setShow(true);
                        }}
                      >
                        Wrap request
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outlined"
                        onClick={() => {
                          setPool(pool);
                          setIsDeposit(true);
                          setIsWrap(false);
                          setShow(true);
                        }}
                      >
                        Redeem {pool.symbol}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col p-2 gap-2">
                      <ConnectKitButton />
                    </div>
                  )}
                </td>
                <td className="border border-gray-300">
                  {isConnected ? (
                    <div className="flex flex-col p-2 gap-2">
                      <Button
                        className="flex-1 w-40"
                        variant="contained"
                        onClick={() => {
                          setPool(pool);
                          setIsDeposit(false);
                          setIsWrap(true);
                          setShow(true);
                        }}
                      >
                        Wrap request
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outlined"
                        onClick={() => {
                          setPool(pool);
                          setIsDeposit(false);
                          setIsWrap(false);
                          setShow(true);
                        }}
                      >
                        Redeem {pool.asset.symbol}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col p-2 gap-2">
                      <ConnectKitButton />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ActionModal
          open={show}
          isDeposit={isDeposit}
          isWrap={isWrap}
          changeIsWrap={setIsWrap}
          pool={selectedPool}
          handleClose={() => setShow(false)}
        />
      </div>
    </div>
  );
};

export default Markets;
