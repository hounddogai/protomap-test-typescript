import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

/** Keeps rolling exit rule ledgers by code. */
export interface RollingExitRuleLedgerStore {
  find(code: string): RollingExitRuleLedger | undefined;
  save(item: RollingExitRuleLedger): void;
  remove(code: string): boolean;
  list(): RollingExitRuleLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingExitRuleLedgerStore implements RollingExitRuleLedgerStore {
  items: Map<string, RollingExitRuleLedger>;
  order: string[];

  constructor(items: Map<string, RollingExitRuleLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingExitRuleLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingExitRuleLedger): void {
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

  list(): RollingExitRuleLedger[] {
    const out: RollingExitRuleLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingExitRuleLedgerStore(): RollingExitRuleLedgerStore {
  return new MemoryRollingExitRuleLedgerStore(new Map<string, RollingExitRuleLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingExitRuleLedgerStore implements RollingExitRuleLedgerStore {
  inner: RollingExitRuleLedgerStore;
  cache: cache.TtlCache<RollingExitRuleLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingExitRuleLedgerStore,
    cacheValue: cache.TtlCache<RollingExitRuleLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingExitRuleLedger | undefined {
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

  save(item: RollingExitRuleLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingExitRuleLedger[] {
    return this.inner.list();
  }
}

export function newCachedRollingExitRuleLedgerStore(inner: RollingExitRuleLedgerStore, ttl: number, clockValue: clock.Clock): RollingExitRuleLedgerStore {
  return new CachedRollingExitRuleLedgerStore(
    inner,
    cache.newTtlCache<RollingExitRuleLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling exit rule ledgers. Empty fields match all. */
export class RollingExitRuleLedgerQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingExitRuleLedger): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingExitRuleLedger[]): RollingExitRuleLedger[] {
    const matched = collections.filter(items, (candidate: RollingExitRuleLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingExitRuleLedgers(store: RollingExitRuleLedgerStore, query: RollingExitRuleLedgerQuery): RollingExitRuleLedger[] {
  return query.apply(store.list());
}
