import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyRollup } from "./frequency-rollup.js";

/** Keeps frequency rollups by code. */
export interface FrequencyRollupStore {
  find(code: string): FrequencyRollup | undefined;
  save(item: FrequencyRollup): void;
  remove(code: string): boolean;
  list(): FrequencyRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyRollupStore implements FrequencyRollupStore {
  items: Map<string, FrequencyRollup>;
  order: string[];

  constructor(items: Map<string, FrequencyRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyRollup): void {
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

  list(): FrequencyRollup[] {
    const out: FrequencyRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyRollupStore(): FrequencyRollupStore {
  return new MemoryFrequencyRollupStore(new Map<string, FrequencyRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyRollupStore implements FrequencyRollupStore {
  inner: FrequencyRollupStore;
  cache: cache.TtlCache<FrequencyRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyRollupStore,
    cacheValue: cache.TtlCache<FrequencyRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyRollup | undefined {
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

  save(item: FrequencyRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyRollup[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyRollupStore(inner: FrequencyRollupStore, ttl: number, clockValue: clock.Clock): FrequencyRollupStore {
  return new CachedFrequencyRollupStore(inner, cache.newTtlCache<FrequencyRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects frequency rollups. Empty fields match all. */
export class FrequencyRollupQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyRollup[]): FrequencyRollup[] {
    const matched = collections.filter(items, (candidate: FrequencyRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyRollups(store: FrequencyRollupStore, query: FrequencyRollupQuery): FrequencyRollup[] {
  return query.apply(store.list());
}
