import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInOverride } from "./double-opt-in-override.js";

/** Keeps double opt in overrides by code. */
export interface DoubleOptInOverrideStore {
  find(code: string): DoubleOptInOverride | undefined;
  save(item: DoubleOptInOverride): void;
  remove(code: string): boolean;
  list(): DoubleOptInOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInOverrideStore implements DoubleOptInOverrideStore {
  items: Map<string, DoubleOptInOverride>;
  order: string[];

  constructor(items: Map<string, DoubleOptInOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInOverride): void {
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

  list(): DoubleOptInOverride[] {
    const out: DoubleOptInOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInOverrideStore(): DoubleOptInOverrideStore {
  return new MemoryDoubleOptInOverrideStore(new Map<string, DoubleOptInOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInOverrideStore implements DoubleOptInOverrideStore {
  inner: DoubleOptInOverrideStore;
  cache: cache.TtlCache<DoubleOptInOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInOverrideStore,
    cacheValue: cache.TtlCache<DoubleOptInOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInOverride | undefined {
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

  save(item: DoubleOptInOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInOverride[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInOverrideStore(inner: DoubleOptInOverrideStore, ttl: number, clockValue: clock.Clock): DoubleOptInOverrideStore {
  return new CachedDoubleOptInOverrideStore(inner, cache.newTtlCache<DoubleOptInOverride>(128, ttl, clockValue), 0, 0);
}

/** Selects double opt in overrides. Empty fields match all. */
export class DoubleOptInOverrideQuery {
  region: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBatchSize: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInOverride): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInOverride[]): DoubleOptInOverride[] {
    const matched = collections.filter(items, (candidate: DoubleOptInOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInOverrides(store: DoubleOptInOverrideStore, query: DoubleOptInOverrideQuery): DoubleOptInOverride[] {
  return query.apply(store.list());
}
