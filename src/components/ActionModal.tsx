import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Card, Modal } from "@mui/material";
import { Pool } from "@/types";
import { useMainContext } from "@/hooks";
import { getWalletHumanBalance } from "@/utils";
import { formatUnits, parseUnits } from "ethers";

type Props = {
  open: boolean;
  isDeposit: boolean;
  isWrap: boolean;
  changeIsWrap: (isWrap: boolean) => void;
  handleClose?: () => void;
  pool: Pool;
};

export const ActionModal = ({
  open,
  isDeposit,
  isWrap,
  pool,
  changeIsWrap,
  handleClose,
}: Props) => {
  const {
    balances,
    epochInfo,
    redeemableInfo,
    approveToken,
    wrapRequest,
    redeem,
    decryptEuint256,
  } = useMainContext();

  const [amount, setAmount] = useState("");
  const [pendingAmount, setPendingAmount] = useState<string>();
  const [decryptedValues, setDecryptedVaules] = useState<
    Record<string, string>
  >({});

  const encryptedPendingAmount = useMemo(() => {
    setPendingAmount(undefined);
    const token = isDeposit ? pool.asset.address : pool.address;

    return epochInfo[token.toLowerCase()]
      ? epochInfo[token.toLowerCase()].pendingUserRequest
      : undefined;
  }, [epochInfo, isDeposit, pool]);

  const encryptedRedeemableAmount = useMemo(() => {
    const token = isDeposit ? pool.asset.address : pool.address;

    return redeemableInfo[token.toLowerCase()];
  }, [redeemableInfo, isDeposit, pool]);

  const revealPendingAmount = useCallback(async () => {
    if (encryptedPendingAmount === undefined || encryptedPendingAmount === 0n) {
      return;
    }
    const _amount = await decryptEuint256(encryptedPendingAmount);

    if (_amount !== undefined) {
      setPendingAmount(formatUnits(_amount, pool.asset.decimals));
    }
  }, [encryptedPendingAmount, pool, decryptEuint256]);

  const revealAmount = useCallback(
    async (value: bigint) => {
      const _amount = await decryptEuint256(value);

      if (_amount !== undefined) {
        const _values: Record<string, string> = { ...decryptedValues };
        _values[value.toString()] = formatUnits(_amount, pool.asset.decimals);
        setDecryptedVaules(_values);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, decryptEuint256]
  );

  useEffect(() => {
    setPendingAmount(undefined);
  }, [encryptedPendingAmount]);

  const getPendingAmountElement = useCallback(() => {
    if (encryptedPendingAmount === undefined) {
      return <span></span>;
    } else if (encryptedPendingAmount === 0n) {
      return <span>No pending amount</span>;
    } else {
      if (pendingAmount === undefined) {
        return (
          <span className="mb-2">
            Your pending amount has been encrypted.{" "}
            <button
              className="underline cursor-pointer"
              onClick={revealPendingAmount}
            >
              Reveal it?
            </button>
          </span>
        );
      } else {
        return (
          <span className="mb-2">
            Your pending amount: {pendingAmount}
            {isDeposit ? pool.asset.symbol : pool.symbol}
          </span>
        );
      }
    }
  }, [
    encryptedPendingAmount,
    pendingAmount,
    pool,
    isDeposit,
    revealPendingAmount,
  ]);

  const getRedeemableAmountElement = useCallback(() => {
    if (encryptedRedeemableAmount === undefined) {
      return <span></span>;
    } else if (encryptedRedeemableAmount.amounts.length === 0) {
      return <span>Nothing available to redeem</span>;
    } else {
      if (pendingAmount === undefined) {
        return (
          <div className="flex flex-col">
            <span className="text-lg">
              You have redeemable amount at the following epoches:
            </span>
            {encryptedRedeemableAmount.epoch.map((epoch, idx) =>
              decryptedValues[
                encryptedRedeemableAmount.amounts[idx].toString()
              ] ? (
                <span key={`redeemable-epoch-${epoch}`} className="mb-2 ml-2">
                  You have $
                  {
                    decryptedValues[
                      encryptedRedeemableAmount.amounts[idx].toString()
                    ]
                  }
                  {isDeposit ? pool.symbol : pool.asset.symbol} redeemable at #
                  {epoch}.{" "}
                  <button
                    className="underline cursor-pointer"
                    onClick={() => redeem(pool, epoch, isDeposit)}
                  >
                    Click to redeem.
                  </button>
                </span>
              ) : (
                <span key={`redeemable-epoch-${epoch}`} className="mb-2 ml-2">
                  You have something at #{epoch}.{" "}
                  <button
                    className="underline cursor-pointer"
                    onClick={() =>
                      revealAmount(encryptedRedeemableAmount.amounts[idx])
                    }
                  >
                    Reveal it
                  </button>{" "}
                  or just{" "}
                  <button
                    className="underline cursor-pointer"
                    onClick={() => redeem(pool, epoch, isDeposit)}
                  >
                    Redeem
                  </button>
                  ?
                </span>
              )
            )}
          </div>
        );
      } else {
        return (
          <span className="mb-2">
            Your pending amount: {pendingAmount}
            {isDeposit ? pool.asset.symbol : pool.symbol}
          </span>
        );
      }
    }
  }, [
    encryptedRedeemableAmount,
    decryptedValues,
    pendingAmount,
    pool,
    isDeposit,
    redeem,
    revealAmount,
  ]);

  const sendWrapRequest = useCallback(async () => {
    const parsedAmount = parseUnits(amount, pool.asset.decimals);
    const res = await approveToken(pool, isDeposit, parsedAmount);
    if (res) {
      await wrapRequest(isDeposit, pool, parsedAmount);
    }
  }, [approveToken, wrapRequest, pool, isDeposit, amount]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className="flex items-center justify-center min-h-160"
    >
      <Card className="bg-white flex flex-col w-120">
        <div className="flex w-full border-b">
          <Button
            className="flex-1 !rounded-none"
            variant={isWrap ? "contained" : "text"}
            onClick={() => changeIsWrap(true)}
          >
            {isDeposit ? "Deposit wrap request" : "Withdraw wrap request"}
          </Button>
          <Button
            className="flex-1 !rounded-none"
            variant={!isWrap ? "contained" : "text"}
            onClick={() => changeIsWrap(false)}
          >
            {isDeposit
              ? `Redeem ${pool.symbol}`
              : `Redeem ${pool.asset.symbol}`}
          </Button>
        </div>
        <div className="flex flex-col px-4 py-10 h-40">
          {isWrap ? getPendingAmountElement() : getRedeemableAmountElement()}

          {isWrap && (
            <>
              <div className="flex justify-between mt-2">
                <span>
                  Input {isDeposit ? pool.asset.symbol : pool.symbol} amount to
                  send {isDeposit ? "deposit" : "withdraw"} request:
                </span>
                <button>
                  Max:{" "}
                  {getWalletHumanBalance(
                    balances,
                    isDeposit ? pool.asset : pool
                  )}
                </button>
              </div>
              <div className="flex border-1 rounded">
                <input
                  className="flex-1 px-1 text-2xl"
                  placeholder="0.0"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        {isWrap && (
          <Button
            className="flex-1 !rounded-none"
            variant="contained"
            onClick={sendWrapRequest}
          >
            {isDeposit ? "Deposit request" : "Withdrawal request"}
          </Button>
        )}
      </Card>
    </Modal>
  );
};
