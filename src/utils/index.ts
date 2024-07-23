import "@polkadot/api-augment";
import { toast } from "react-toastify";
import { type GetBalance } from "~/types";
import { type ApiPromise } from "@polkadot/api";

// == Addresses ==
export const small_address = (address: string) =>
  address.slice(0, 8) + "…" + address.slice(-8);

// == Utils ==

export const copy_to_clipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
};

export const calculate_amount = (amount: string) => {
  return Math.floor(Number(amount) * 10 ** 9);
};

// == Numbers ==

export function bigint_division(a: bigint, b: bigint, precision = 8n): number {
  if (b == 0n) return NaN;
  const base = 10n ** precision;
  const base_num = Number(base);
  return Number((a * base) / b) / base_num;
}

// == Balances ==

export function from_nano(nano: number | bigint): number {
  if (typeof nano === "bigint") return bigint_division(nano, 1_000_000_000n);
  else return nano / 1_000_000_000;
}

export function format_token(nano: number | bigint): string {
  const amount = from_nano(nano);
  return amount.toFixed(2);
}

export async function get_balance({ api, address }: GetBalance) {
  if (!api) throw new Error("API is not defined");
  const {
    data: { free: balance },
  } = await api.query.system.account(address);

  const balance_num = Number(balance);

  return from_nano(balance_num);
}

// == Queries ==

export async function use_last_block(api: ApiPromise) {
  const block_header = await api.rpc.chain.getHeader();
  const block_number = block_header.number.toNumber();
  const block_hash = block_header.hash;
  const block_hash_hex = block_hash.toHex();
  const api_at_block = await api.at(block_header.hash);
  return {
    block_header,
    block_number,
    block_hash,
    block_hash_hex,
    api_at_block,
  };
}

export async function get_all_stake_out(api: ApiPromise) {
  const { api_at_block, block_number, block_hash_hex } =
    await use_last_block(api);
  console.debug(`Querying StakeTo at block ${block_number}`);
  // TODO: cache query for specific block

  const stake_to_query =
    await api_at_block.query.subspaceModule?.stakeTo?.entries();
  if (stake_to_query == null)
    throw new Error("Query to stakeTo returned nullish");

  // Total stake
  let total = 0n;
  // Total stake per address
  const per_addr = new Map<string, bigint>();
  // Total stake per address per to_address
  const per_addr_per_to = new Map<string, Map<string, bigint>>();
  // Total stake per address across all stakes
  const total_per_addr = new Map<string, bigint>();

  for (const stake_to_item of stake_to_query) {
    if (!Array.isArray(stake_to_item) || stake_to_item.length != 2)
      throw new Error(`Invalid stakeTo item '${stake_to_item.toString()}'`);
    const [key_raw, value_raw] = stake_to_item;

    const [from_addr_raw, to_addr_raw] = key_raw.args;
    if (from_addr_raw == null || to_addr_raw == null)
      throw new Error("stakeTo storage key is nullish");

    const from_addr = from_addr_raw.toHuman();
    const to_addr = to_addr_raw.toHuman();
    const staked = BigInt(value_raw.toString());

    if (typeof from_addr !== "string")
      throw new Error("Invalid stakeTo storage key (from_addr)");
    if (typeof to_addr !== "string")
      throw new Error("Invalid stakeTo storage key (to_addr)");

    // Add stake to total
    total += staked;

    // Add stake to (addr => stake) map
    const old_total = per_addr.get(from_addr) ?? 0n;
    per_addr.set(from_addr, old_total + staked);

    // Add stake to (from_addr => to_addr => stake) map
    const map_to = per_addr_per_to.get(from_addr) ?? new Map<string, bigint>();
    map_to.set(to_addr, staked);
    per_addr_per_to.set(from_addr, map_to);

    // Add stake to total_per_addr map
    const old_total_per_addr = total_per_addr.get(from_addr) ?? 0n;
    total_per_addr.set(from_addr, old_total_per_addr + staked);
  }

  // Convert total_per_addr map to array of objects
  const total_per_addr_array = Array.from(total_per_addr.entries()).map(
    ([validatorAddress, totalStaked]) => ({
      validatorAddress,
      totalStaked: totalStaked.toString(),
    }),
  );

  return {
    block_number,
    block_hash_hex,
    stake_out: {
      total,
      per_addr,
      per_addr_per_to,
      total_per_addr: total_per_addr_array,
    },
  };
}

export async function get_user_total_stake(
  api: ApiPromise,
  address: string,
): Promise<{ address: string; stake: string; netuid: number }[]> {
  const { api_at_block } = await use_last_block(api);
  const N_query = await api_at_block.query.subspaceModule?.n?.entries();

  if (!N_query) throw new Error("Query to n returned nullish");

  const stakePromises = N_query.map(async ([netuid_raw, _]) => {
    const netuid = parseInt(netuid_raw.toHuman() as string, 10);

    if (!api_at_block.query.subspaceModule?.stakeTo) return null;

    const stake = await api_at_block.query.subspaceModule.stakeTo(
      netuid,
      address,
    );

    const stakeHuman = stake.toHuman();

    if (!stakeHuman) return null;

    return {
      address,
      stake: stakeHuman,
      netuid,
    };
  });

  const stakes = await Promise.all(stakePromises);

  // Filter out any null results
  return stakes.filter((stake) => stake !== null) as {
    address: string;
    stake: string;
    netuid: number;
  }[];
}
