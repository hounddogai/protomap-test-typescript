import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionRollup } from "./conversion-rollup.js";

/** Keeps conversion rollups by code. */
export interface ConversionRollupStore {
  find(code: string): ConversionRollup | undefined;
  save(item: ConversionRollup): void;
  remove(code: string): boolean;
  list(): ConversionRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionRollupStore implements ConversionRollupStore {
  items: Map<string, ConversionRollup>;
  order: string[];

  constructor(items: Map<string, ConversionRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionRollup): void {
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

  list(): ConversionRollup[] {
    const out: ConversionRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionRollupStore(): ConversionRollupStore {
  return new MemoryConversionRollupStore(new Map<string, ConversionRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionRollupStore implements ConversionRollupStore {
  inner: ConversionRollupStore;
  cache: cache.TtlCache<ConversionRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionRollupStore,
    cacheValue: cache.TtlCache<ConversionRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionRollup | undefined {
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

  save(item: ConversionRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionRollup[] {
    return this.inner.list();
  }
}

export function newCachedConversionRollupStore(inner: ConversionRollupStore, ttl: number, clockValue: clock.Clock): ConversionRollupStore {
  return new CachedConversionRollupStore(inner, cache.newTtlCache<ConversionRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects conversion rollups. Empty fields match all. */
export class ConversionRollupQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionRollup): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionRollup[]): ConversionRollup[] {
    const matched = collections.filter(items, (candidate: ConversionRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionRollups(store: ConversionRollupStore, query: ConversionRollupQuery): ConversionRollup[] {
  return query.apply(store.list());
}
