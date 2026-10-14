import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalRewardRuleLedger } from "./regional-reward-rule-ledger.js";

/** Keeps regional reward rule ledgers by code. */
export interface RegionalRewardRuleLedgerStore {
  find(code: string): RegionalRewardRuleLedger | undefined;
  save(item: RegionalRewardRuleLedger): void;
  remove(code: string): boolean;
  list(): RegionalRewardRuleLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalRewardRuleLedgerStore implements RegionalRewardRuleLedgerStore {
  items: Map<string, RegionalRewardRuleLedger>;
  order: string[];

  constructor(items: Map<string, RegionalRewardRuleLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalRewardRuleLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalRewardRuleLedger): void {
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

  list(): RegionalRewardRuleLedger[] {
    const out: RegionalRewardRuleLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalRewardRuleLedgerStore(): RegionalRewardRuleLedgerStore {
  return new MemoryRegionalRewardRuleLedgerStore(new Map<string, RegionalRewardRuleLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalRewardRuleLedgerStore implements RegionalRewardRuleLedgerStore {
  inner: RegionalRewardRuleLedgerStore;
  cache: cache.TtlCache<RegionalRewardRuleLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalRewardRuleLedgerStore,
    cacheValue: cache.TtlCache<RegionalRewardRuleLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalRewardRuleLedger | undefined {
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

  save(item: RegionalRewardRuleLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalRewardRuleLedger[] {
    return this.inner.list();
  }
}

export function newCachedRegionalRewardRuleLedgerStore(inner: RegionalRewardRuleLedgerStore, ttl: number, clockValue: clock.Clock): RegionalRewardRuleLedgerStore {
  return new CachedRegionalRewardRuleLedgerStore(
    inner,
    cache.newTtlCache<RegionalRewardRuleLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional reward rule ledgers. Empty fields match all. */
export class RegionalRewardRuleLedgerQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalRewardRuleLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalRewardRuleLedger[]): RegionalRewardRuleLedger[] {
    const matched = collections.filter(items, (candidate: RegionalRewardRuleLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalRewardRuleLedgers(store: RegionalRewardRuleLedgerStore, query: RegionalRewardRuleLedgerQuery): RegionalRewardRuleLedger[] {
  return query.apply(store.list());
}
