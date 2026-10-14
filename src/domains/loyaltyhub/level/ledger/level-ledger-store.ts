import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelLedger } from "./level-ledger.js";

/** Keeps level ledgers by code. */
export interface LevelLedgerStore {
  find(code: string): LevelLedger | undefined;
  save(item: LevelLedger): void;
  remove(code: string): boolean;
  list(): LevelLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelLedgerStore implements LevelLedgerStore {
  items: Map<string, LevelLedger>;
  order: string[];

  constructor(items: Map<string, LevelLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelLedger): void {
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

  list(): LevelLedger[] {
    const out: LevelLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelLedgerStore(): LevelLedgerStore {
  return new MemoryLevelLedgerStore(new Map<string, LevelLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelLedgerStore implements LevelLedgerStore {
  inner: LevelLedgerStore;
  cache: cache.TtlCache<LevelLedger>;
  hits: number;
  misses: number;

  constructor(inner: LevelLedgerStore, cacheValue: cache.TtlCache<LevelLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelLedger | undefined {
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

  save(item: LevelLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelLedger[] {
    return this.inner.list();
  }
}

export function newCachedLevelLedgerStore(inner: LevelLedgerStore, ttl: number, clockValue: clock.Clock): LevelLedgerStore {
  return new CachedLevelLedgerStore(inner, cache.newTtlCache<LevelLedger>(256, ttl, clockValue), 0, 0);
}

/** Selects level ledgers. Empty fields match all. */
export class LevelLedgerQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelLedger): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelLedger[]): LevelLedger[] {
    const matched = collections.filter(items, (candidate: LevelLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelLedgers(store: LevelLedgerStore, query: LevelLedgerQuery): LevelLedger[] {
  return query.apply(store.list());
}
