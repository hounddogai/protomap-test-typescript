import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySenderRollup } from "./primary-sender-rollup.js";

/** Keeps primary sender rollups by code. */
export interface PrimarySenderRollupStore {
  find(code: string): PrimarySenderRollup | undefined;
  save(item: PrimarySenderRollup): void;
  remove(code: string): boolean;
  list(): PrimarySenderRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySenderRollupStore implements PrimarySenderRollupStore {
  items: Map<string, PrimarySenderRollup>;
  order: string[];

  constructor(items: Map<string, PrimarySenderRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySenderRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySenderRollup): void {
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

  list(): PrimarySenderRollup[] {
    const out: PrimarySenderRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySenderRollupStore(): PrimarySenderRollupStore {
  return new MemoryPrimarySenderRollupStore(new Map<string, PrimarySenderRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySenderRollupStore implements PrimarySenderRollupStore {
  inner: PrimarySenderRollupStore;
  cache: cache.TtlCache<PrimarySenderRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySenderRollupStore,
    cacheValue: cache.TtlCache<PrimarySenderRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySenderRollup | undefined {
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

  save(item: PrimarySenderRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySenderRollup[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySenderRollupStore(inner: PrimarySenderRollupStore, ttl: number, clockValue: clock.Clock): PrimarySenderRollupStore {
  return new CachedPrimarySenderRollupStore(inner, cache.newTtlCache<PrimarySenderRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary sender rollups. Empty fields match all. */
export class PrimarySenderRollupQuery {
  source: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minConversionRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySenderRollup): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySenderRollup[]): PrimarySenderRollup[] {
    const matched = collections.filter(items, (candidate: PrimarySenderRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySenderRollups(store: PrimarySenderRollupStore, query: PrimarySenderRollupQuery): PrimarySenderRollup[] {
  return query.apply(store.list());
}
