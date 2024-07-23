import React from "react";
import Link from "next/link";
import { Icon } from "../icon";
import { from_nano, small_address } from "~/utils";
import { usePolkadot } from "~/hooks/polkadot";

interface Validator {
  description: string;
  address: string;
}

export const StakedValidators = ({
  open,
  setOpen,
  onSelectValidator,
}: {
  open: boolean;
  setOpen: (args: boolean) => void;
  onSelectValidator: (validator: Validator) => void;
}) => {
  const { userTotalStake } = usePolkadot();

  return (
    <div
      role="dialog"
      className={`fixed inset-0 z-[100] ${open ? "block" : "hidden"} animate-fade-in-down`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[url(/bg-pattern.svg)]" />

      {/* Modal */}
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="relative w-[100%] max-w-4xl transform overflow-hidden border bg-black/50 text-left text-white">
            {/* Modal Header */}
            <div className="flex flex-col items-center justify-between gap-3 border-b p-6 md:flex-row">
              <div className="flex flex-col items-center md:flex-row">
                <h3 className="pl-2 text-xl leading-6">
                  Staked Validators List
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="border p-2 transition duration-200 "
              >
                <Icon src="/icons/close.svg" className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-y-4 overflow-y-auto p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Validators</h2>
                <Link href="https://www.comstats.org/" target="_blank">
                  View all
                </Link>
              </div>

              {userTotalStake.map(({ address, stake }) => (
                <button
                  key={address}
                  onClick={() => {
                    onSelectValidator({
                      description: `Stake Amount: ${Math.round(from_nano(Number(stake)))} COMAI`,
                      address,
                    });
                    setOpen(false);
                  }}
                  className={`text-md flex cursor-pointer items-center gap-x-3 overflow-auto border p-5 transition hover:bg-green-500/10`}
                >
                  <div className="flex w-full flex-col items-start gap-1">
                    <span className="font-semibold">
                      Address: {small_address(address)}
                    </span>
                    <div className="flex w-full flex-col items-start justify-between md:flex-row">
                      <span className="text-gray-400">
                        Stake Amount:{" "}
                        <span className="text-green-500">
                          {Math.round(from_nano(Number(stake)))}
                        </span>{" "}
                        $COMAI
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
