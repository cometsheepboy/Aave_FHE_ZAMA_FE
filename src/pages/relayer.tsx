import Button from "@mui/material/Button";
import type { NextPage } from "next";
import Image from "next/image";
import { MIN_WRAP_THRESHOLD, pools } from "@/constants";
import { useCallback } from "react";
import moment from "moment";
import { useMainContext } from "@/hooks";
import { Pool } from "@/types";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

const Relayer: NextPage = () => {
  const { isConnected } = useAccount();
  const { epochInfo, wrap } = useMainContext();

  const getCurrentEpoch = useCallback(
    (pool: Pool, isDeposit: boolean) => {
      const token = isDeposit ? pool.asset.address : pool.address;

      return epochInfo[token.toLowerCase()]
        ? "#" + epochInfo[token.toLowerCase()].currentEpoch
        : "--";
    },
    [epochInfo]
  );

  const getWrapBtn = useCallback(
    (pool: Pool, isDeposit: boolean) => {
      const token = isDeposit ? pool.asset.address : pool.address;
      if (epochInfo[token.toLowerCase()]) {
        const lastWrappedTime = epochInfo[token.toLowerCase()].lastWrappedTime;

        const hasRequests = epochInfo[token.toLowerCase()].hasRequest;

        if (hasRequests) {
          return lastWrappedTime + MIN_WRAP_THRESHOLD > Date.now() / 1000 ? (
            <span>
              {moment.unix(lastWrappedTime + MIN_WRAP_THRESHOLD).format("llll")}
            </span>
          ) : isConnected ? (
            <Button
              variant="contained"
              disabled={
                lastWrappedTime + MIN_WRAP_THRESHOLD > Date.now() / 1000
              }
              onClick={() => wrap(pool, isDeposit)}
            >
              {isDeposit ? "Deposit to Aave" : "Withdraw from Aave"}
            </Button>
          ) : (
            <ConnectKitButton />
          );
        } else {
          return <span>No requests</span>;
        }
      } else {
        return "--";
      }
    },
    [epochInfo, wrap]
  );

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl m-3">Relayer</h1>
      <div className="flex items-center justify-center">
        <table className="border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-300">Asset</th>
              <th className="border border-gray-300">Deposit epoch</th>
              <th className="border border-gray-300">Next deposit</th>
              <th className="border border-gray-300">Withdraw epoch</th>
              <th className="border border-gray-300">Next withdraw</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => (
              <tr key={`relayer-${pool.asset.symbol}`}>
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
                    {getCurrentEpoch(pool, true)}
                  </div>
                </td>
                <td className="border border-gray-300">
                  <div className="px-2 flex items-center justify-center">
                    {getWrapBtn(pool, true)}
                  </div>
                </td>
                <td className="border border-gray-300">
                  <div className="flex px-2 items-center justify-center">
                    {getCurrentEpoch(pool, false)}
                  </div>
                </td>
                <td className="border border-gray-300">
                  <div className="px-2 flex items-center justify-center">
                    {getWrapBtn(pool, false)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Relayer;
