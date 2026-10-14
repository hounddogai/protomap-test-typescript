import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientConversionRollup } from "./lenient-conversion-rollup.js";

/** Keeps lenient conversion rollups by code. */
export interface LenientConversionRollupStore {
  find(code: string): LenientConversionRollup | undefined;
  save(item: LenientConversionRollup): void;
  remove(code: string): boolean;
  list(): LenientConversionRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientConversionRollupStore implements LenientConversionRollupStore {
  items: Map<string, LenientConversionRollup>;
  order: string[];

  constructor(items: Map<string, LenientConversionRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientConversionRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientConversionRollup): void {
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

  list(): LenientConversionRollup[] {
    const out: LenientConversionRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientConversionRollupStore(): LenientConversionRollupStore {
  return new MemoryLenientConversionRollupStore(new Map<string, LenientConversionRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientConversionRollupStore implements LenientConversionRollupStore {
  inner: LenientConversionRollupStore;
  cache: cache.TtlCache<LenientConversionRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientConversionRollupStore,
    cacheValue: cache.TtlCache<LenientConversionRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientConversionRollup | undefined {
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

  save(item: LenientConversionRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientConversionRollup[] {
    return this.inner.list();
  }
}

export function newCachedLenientConversionRollupStore(inner: LenientConversionRollupStore, ttl: number, clockValue: clock.Clock): LenientConversionRollupStore {
  return new CachedLenientConversionRollupStore(
    inner,
    cache.newTtlCache<LenientConversionRollup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient conversion rollups. Empty fields match all. */
export class LenientConversionRollupQuery {
  region: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minStartsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientConversionRollup): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientConversionRollup[]): LenientConversionRollup[] {
    const matched = collections.filter(items, (candidate: LenientConversionRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientConversionRollups(store: LenientConversionRollupStore, query: LenientConversionRollupQuery): LenientConversionRollup[] {
  return query.apply(store.list());
}
