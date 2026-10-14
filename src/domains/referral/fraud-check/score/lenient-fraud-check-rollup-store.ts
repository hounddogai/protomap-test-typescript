import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientFraudCheckRollup } from "./lenient-fraud-check-rollup.js";

/** Keeps lenient fraud check rollups by code. */
export interface LenientFraudCheckRollupStore {
  find(code: string): LenientFraudCheckRollup | undefined;
  save(item: LenientFraudCheckRollup): void;
  remove(code: string): boolean;
  list(): LenientFraudCheckRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientFraudCheckRollupStore implements LenientFraudCheckRollupStore {
  items: Map<string, LenientFraudCheckRollup>;
  order: string[];

  constructor(items: Map<string, LenientFraudCheckRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientFraudCheckRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientFraudCheckRollup): void {
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

  list(): LenientFraudCheckRollup[] {
    const out: LenientFraudCheckRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientFraudCheckRollupStore(): LenientFraudCheckRollupStore {
  return new MemoryLenientFraudCheckRollupStore(new Map<string, LenientFraudCheckRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientFraudCheckRollupStore implements LenientFraudCheckRollupStore {
  inner: LenientFraudCheckRollupStore;
  cache: cache.TtlCache<LenientFraudCheckRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientFraudCheckRollupStore,
    cacheValue: cache.TtlCache<LenientFraudCheckRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientFraudCheckRollup | undefined {
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

  save(item: LenientFraudCheckRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientFraudCheckRollup[] {
    return this.inner.list();
  }
}

export function newCachedLenientFraudCheckRollupStore(inner: LenientFraudCheckRollupStore, ttl: number, clockValue: clock.Clock): LenientFraudCheckRollupStore {
  return new CachedLenientFraudCheckRollupStore(
    inner,
    cache.newTtlCache<LenientFraudCheckRollup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient fraud check rollups. Empty fields match all. */
export class LenientFraudCheckRollupQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientFraudCheckRollup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientFraudCheckRollup[]): LenientFraudCheckRollup[] {
    const matched = collections.filter(items, (candidate: LenientFraudCheckRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientFraudCheckRollups(store: LenientFraudCheckRollupStore, query: LenientFraudCheckRollupQuery): LenientFraudCheckRollup[] {
  return query.apply(store.list());
}
