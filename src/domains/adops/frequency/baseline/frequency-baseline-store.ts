import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyBaseline } from "./frequency-baseline.js";

/** Keeps frequency baselines by code. */
export interface FrequencyBaselineStore {
  find(code: string): FrequencyBaseline | undefined;
  save(item: FrequencyBaseline): void;
  remove(code: string): boolean;
  list(): FrequencyBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyBaselineStore implements FrequencyBaselineStore {
  items: Map<string, FrequencyBaseline>;
  order: string[];

  constructor(items: Map<string, FrequencyBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyBaseline): void {
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

  list(): FrequencyBaseline[] {
    const out: FrequencyBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyBaselineStore(): FrequencyBaselineStore {
  return new MemoryFrequencyBaselineStore(new Map<string, FrequencyBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyBaselineStore implements FrequencyBaselineStore {
  inner: FrequencyBaselineStore;
  cache: cache.TtlCache<FrequencyBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyBaselineStore,
    cacheValue: cache.TtlCache<FrequencyBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyBaseline | undefined {
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

  save(item: FrequencyBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyBaseline[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyBaselineStore(inner: FrequencyBaselineStore, ttl: number, clockValue: clock.Clock): FrequencyBaselineStore {
  return new CachedFrequencyBaselineStore(inner, cache.newTtlCache<FrequencyBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects frequency baselines. Empty fields match all. */
export class FrequencyBaselineQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyBaseline[]): FrequencyBaseline[] {
    const matched = collections.filter(items, (candidate: FrequencyBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyBaselines(store: FrequencyBaselineStore, query: FrequencyBaselineQuery): FrequencyBaseline[] {
  return query.apply(store.list());
}
