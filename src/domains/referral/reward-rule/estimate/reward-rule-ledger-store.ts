import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleLedger } from "./reward-rule-ledger.js";

/** Keeps reward rule ledgers by code. */
export interface RewardRuleLedgerStore {
  find(code: string): RewardRuleLedger | undefined;
  save(item: RewardRuleLedger): void;
  remove(code: string): boolean;
  list(): RewardRuleLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleLedgerStore implements RewardRuleLedgerStore {
  items: Map<string, RewardRuleLedger>;
  order: string[];

  constructor(items: Map<string, RewardRuleLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleLedger): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): RewardRuleLedger[] {
    const out: RewardRuleLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleLedgerStore(): RewardRuleLedgerStore {
  return new MemoryRewardRuleLedgerStore(new Map<string, RewardRuleLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleLedgerStore implements RewardRuleLedgerStore {
  inner: RewardRuleLedgerStore;
  cache: cache.TtlCache<RewardRuleLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleLedgerStore,
    cacheValue: cache.TtlCache<RewardRuleLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleLedger | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: RewardRuleLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleLedger[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleLedgerStore(inner: RewardRuleLedgerStore, ttl: number, clockValue: clock.Clock): RewardRuleLedgerStore {
  return new CachedRewardRuleLedgerStore(inner, cache.newTtlCache<RewardRuleLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects reward rule ledgers. Empty fields match all. */
export class RewardRuleLedgerQuery {
  region: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDiscount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleLedger): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleLedger[]): RewardRuleLedger[] {
    const matched = collections.filter(items, (candidate: RewardRuleLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleLedgers(store: RewardRuleLedgerStore, query: RewardRuleLedgerQuery): RewardRuleLedger[] {
  return query.apply(store.list());
}
