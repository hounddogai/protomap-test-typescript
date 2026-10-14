import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictFrequencyRollup } from "./strict-frequency-rollup.js";

/** Keeps strict frequency rollups by code. */
export interface StrictFrequencyRollupStore {
  find(code: string): StrictFrequencyRollup | undefined;
  save(item: StrictFrequencyRollup): void;
  remove(code: string): boolean;
  list(): StrictFrequencyRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictFrequencyRollupStore implements StrictFrequencyRollupStore {
  items: Map<string, StrictFrequencyRollup>;
  order: string[];

  constructor(items: Map<string, StrictFrequencyRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictFrequencyRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictFrequencyRollup): void {
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

  list(): StrictFrequencyRollup[] {
    const out: StrictFrequencyRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictFrequencyRollupStore(): StrictFrequencyRollupStore {
  return new MemoryStrictFrequencyRollupStore(new Map<string, StrictFrequencyRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictFrequencyRollupStore implements StrictFrequencyRollupStore {
  inner: StrictFrequencyRollupStore;
  cache: cache.TtlCache<StrictFrequencyRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictFrequencyRollupStore,
    cacheValue: cache.TtlCache<StrictFrequencyRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictFrequencyRollup | undefined {
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

  save(item: StrictFrequencyRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictFrequencyRollup[] {
    return this.inner.list();
  }
}

export function newCachedStrictFrequencyRollupStore(inner: StrictFrequencyRollupStore, ttl: number, clockValue: clock.Clock): StrictFrequencyRollupStore {
  return new CachedStrictFrequencyRollupStore(
    inner,
    cache.newTtlCache<StrictFrequencyRollup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict frequency rollups. Empty fields match all. */
export class StrictFrequencyRollupQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictFrequencyRollup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictFrequencyRollup[]): StrictFrequencyRollup[] {
    const matched = collections.filter(items, (candidate: StrictFrequencyRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictFrequencyRollups(store: StrictFrequencyRollupStore, query: StrictFrequencyRollupQuery): StrictFrequencyRollup[] {
  return query.apply(store.list());
}
