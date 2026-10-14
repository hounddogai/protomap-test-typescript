import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPacingRollup } from "./strict-pacing-rollup.js";

/** Keeps strict pacing rollups by code. */
export interface StrictPacingRollupStore {
  find(code: string): StrictPacingRollup | undefined;
  save(item: StrictPacingRollup): void;
  remove(code: string): boolean;
  list(): StrictPacingRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPacingRollupStore implements StrictPacingRollupStore {
  items: Map<string, StrictPacingRollup>;
  order: string[];

  constructor(items: Map<string, StrictPacingRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPacingRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPacingRollup): void {
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

  list(): StrictPacingRollup[] {
    const out: StrictPacingRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPacingRollupStore(): StrictPacingRollupStore {
  return new MemoryStrictPacingRollupStore(new Map<string, StrictPacingRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPacingRollupStore implements StrictPacingRollupStore {
  inner: StrictPacingRollupStore;
  cache: cache.TtlCache<StrictPacingRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPacingRollupStore,
    cacheValue: cache.TtlCache<StrictPacingRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPacingRollup | undefined {
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

  save(item: StrictPacingRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPacingRollup[] {
    return this.inner.list();
  }
}

export function newCachedStrictPacingRollupStore(inner: StrictPacingRollupStore, ttl: number, clockValue: clock.Clock): StrictPacingRollupStore {
  return new CachedStrictPacingRollupStore(inner, cache.newTtlCache<StrictPacingRollup>(512, ttl, clockValue), 0, 0);
}

/** Selects strict pacing rollups. Empty fields match all. */
export class StrictPacingRollupQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPacingRollup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPacingRollup[]): StrictPacingRollup[] {
    const matched = collections.filter(items, (candidate: StrictPacingRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPacingRollups(store: StrictPacingRollupStore, query: StrictPacingRollupQuery): StrictPacingRollup[] {
  return query.apply(store.list());
}
