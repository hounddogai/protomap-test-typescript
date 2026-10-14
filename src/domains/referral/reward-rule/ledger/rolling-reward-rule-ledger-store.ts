import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingRewardRuleLedger } from "./rolling-reward-rule-ledger.js";

/** Keeps rolling reward rule ledgers by code. */
export interface RollingRewardRuleLedgerStore {
  find(code: string): RollingRewardRuleLedger | undefined;
  save(item: RollingRewardRuleLedger): void;
  remove(code: string): boolean;
  list(): RollingRewardRuleLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingRewardRuleLedgerStore implements RollingRewardRuleLedgerStore {
  items: Map<string, RollingRewardRuleLedger>;
  order: string[];

  constructor(items: Map<string, RollingRewardRuleLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingRewardRuleLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingRewardRuleLedger): void {
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

  list(): RollingRewardRuleLedger[] {
    const out: RollingRewardRuleLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingRewardRuleLedgerStore(): RollingRewardRuleLedgerStore {
  return new MemoryRollingRewardRuleLedgerStore(new Map<string, RollingRewardRuleLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingRewardRuleLedgerStore implements RollingRewardRuleLedgerStore {
  inner: RollingRewardRuleLedgerStore;
  cache: cache.TtlCache<RollingRewardRuleLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingRewardRuleLedgerStore,
    cacheValue: cache.TtlCache<RollingRewardRuleLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingRewardRuleLedger | undefined {
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

  save(item: RollingRewardRuleLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingRewardRuleLedger[] {
    return this.inner.list();
  }
}

export function newCachedRollingRewardRuleLedgerStore(inner: RollingRewardRuleLedgerStore, ttl: number, clockValue: clock.Clock): RollingRewardRuleLedgerStore {
  return new CachedRollingRewardRuleLedgerStore(
    inner,
    cache.newTtlCache<RollingRewardRuleLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling reward rule ledgers. Empty fields match all. */
export class RollingRewardRuleLedgerQuery {
  source: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCapacity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingRewardRuleLedger): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingRewardRuleLedger[]): RollingRewardRuleLedger[] {
    const matched = collections.filter(items, (candidate: RollingRewardRuleLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingRewardRuleLedgers(store: RollingRewardRuleLedgerStore, query: RollingRewardRuleLedgerQuery): RollingRewardRuleLedger[] {
  return query.apply(store.list());
}
