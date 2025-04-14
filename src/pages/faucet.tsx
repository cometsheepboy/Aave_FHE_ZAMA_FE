import Button from "@mui/material/Button";
import { assets } from "@/constants/assets";
import { useMainContext } from "@/hooks";
import type { NextPage } from "next";
import Image from "next/image";
import { getWalletHumanBalance } from "@/utils";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

const Faucet: NextPage = () => {
  const { balances, getFreeToken } = useMainContext();
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl m-3">Faucets</h1>
      <div className="flex items-center justify-center">
        <table className="border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-300">Asset</th>
              <th className="border border-gray-300">Balance</th>
              <th className="border border-gray-300"></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={`faucet-${asset.symbol}`}>
                <td className="border border-gray-300">
                  <div className="flex p-2">
                    <Image
                      src={asset.logo}
                      width={52}
                      height={52}
                      alt={asset.symbol}
                    />
                    <div className="flex flex-col justify-center ml-2">
                      <span className="text-xl text-bold">{asset.name}</span>
                      <span>{asset.symbol}</span>
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300">
                  <div className="flex px-2 items-center justify-center">
                    {getWalletHumanBalance(balances, asset)}
                  </div>
                </td>
                <td className="border border-gray-300">
                  <div className="px-2">
                    {isConnected ? (
                      <Button
                        variant="contained"
                        onClick={() => getFreeToken(asset)}
                      >
                        Get Free Token
                      </Button>
                    ) : (
                      <ConnectKitButton />
                    )}
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

export default Faucet;
