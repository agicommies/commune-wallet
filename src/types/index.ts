import { type ApiPromise } from "@polkadot/api";
import {
  type InjectedAccountWithMeta,
  type InjectedExtension,
} from "@polkadot/extension-inject/types";

export interface StakeData {
  block_number: number;
  block_hash_hex: string;
  stake_out: {
    total: bigint;
    per_addr: Map<string, bigint>;
    total_per_addr: {
      validatorAddress: string;
      totalStaked: string;
    }[];
  };
}

export interface UserStake {
  adddress: string;
  stake: string;
  netuid: number;
}

export interface UserStakeData {
  block_number: number;
  block_hash_hex: string;
  total_stake: string;
  stakes: {
    address: string;
    netuid: number;
    amount: string;
  }[];
}

export interface PolkadotProviderProps {
  children: React.ReactNode;
  wsEndpoint: string;
}

export interface PolkadotApiState {
  web3Accounts: (() => Promise<InjectedAccountWithMeta[]>) | null;
  web3Enable: ((appName: string) => Promise<InjectedExtension[]>) | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

export type TransactionStatus = {
  finalized: boolean;
  message: string | null;
  status: "SUCCESS" | "ERROR" | "PENDING" | "STARTING" | null;
};

export interface Staking {
  validator: string;
  amount: string;
  callback?: (status: TransactionStatus) => void;
}

export interface Transfer {
  to: string;
  amount: string;
  callback?: (status: TransactionStatus) => void;
}

export interface TransferStake {
  fromValidator: string;
  toValidator: string;
  amount: string;
  callback?: (status: TransactionStatus) => void;
}

export interface GetBalance {
  api: ApiPromise | null;
  address: string;
}
