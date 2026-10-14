import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

/** Keeps tiered exit rule entries by code. */
export interface TieredExitRuleEntryStore {
  find(code: string): TieredExitRuleEntry | undefined;
  save(item: TieredExitRuleEntry): void;
  remove(code: string): boolean;
  list(): TieredExitRuleEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredExitRuleEntryStore implements TieredExitRuleEntryStore {
  items: Map<string, TieredExitRuleEntry>;
  order: string[];

  constructor(items: Map<string, TieredExitRuleEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredExitRuleEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredExitRuleEntry): void {
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

  list(): TieredExitRuleEntry[] {
    const out: TieredExitRuleEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredExitRuleEntryStore(): TieredExitRuleEntryStore {
  return new MemoryTieredExitRuleEntryStore(new Map<string, TieredExitRuleEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredExitRuleEntryStore implements TieredExitRuleEntryStore {
  inner: TieredExitRuleEntryStore;
  cache: cache.TtlCache<TieredExitRuleEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredExitRuleEntryStore,
    cacheValue: cache.TtlCache<TieredExitRuleEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredExitRuleEntry | undefined {
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

  save(item: TieredExitRuleEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredExitRuleEntry[] {
    return this.inner.list();
  }
}

export function newCachedTieredExitRuleEntryStore(inner: TieredExitRuleEntryStore, ttl: number, clockValue: clock.Clock): TieredExitRuleEntryStore {
  return new CachedTieredExitRuleEntryStore(inner, cache.newTtlCache<TieredExitRuleEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered exit rule entries. Empty fields match all. */
export class TieredExitRuleEntryQuery {
  unit: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCost: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredExitRuleEntry): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredExitRuleEntry[]): TieredExitRuleEntry[] {
    const matched = collections.filter(items, (candidate: TieredExitRuleEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredExitRuleEntries(store: TieredExitRuleEntryStore, query: TieredExitRuleEntryQuery): TieredExitRuleEntry[] {
  return query.apply(store.list());
}
