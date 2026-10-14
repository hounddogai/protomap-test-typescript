import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingQueueOverride } from "./rolling-queue-override.js";

/** Keeps rolling queue overrides by code. */
export interface RollingQueueOverrideStore {
  find(code: string): RollingQueueOverride | undefined;
  save(item: RollingQueueOverride): void;
  remove(code: string): boolean;
  list(): RollingQueueOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingQueueOverrideStore implements RollingQueueOverrideStore {
  items: Map<string, RollingQueueOverride>;
  order: string[];

  constructor(items: Map<string, RollingQueueOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingQueueOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingQueueOverride): void {
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

  list(): RollingQueueOverride[] {
    const out: RollingQueueOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingQueueOverrideStore(): RollingQueueOverrideStore {
  return new MemoryRollingQueueOverrideStore(new Map<string, RollingQueueOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingQueueOverrideStore implements RollingQueueOverrideStore {
  inner: RollingQueueOverrideStore;
  cache: cache.TtlCache<RollingQueueOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingQueueOverrideStore,
    cacheValue: cache.TtlCache<RollingQueueOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingQueueOverride | undefined {
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

  save(item: RollingQueueOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingQueueOverride[] {
    return this.inner.list();
  }
}

export function newCachedRollingQueueOverrideStore(inner: RollingQueueOverrideStore, ttl: number, clockValue: clock.Clock): RollingQueueOverrideStore {
  return new CachedRollingQueueOverrideStore(
    inner,
    cache.newTtlCache<RollingQueueOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling queue overrides. Empty fields match all. */
export class RollingQueueOverrideQuery {
  country: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minConversionRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingQueueOverride): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingQueueOverride[]): RollingQueueOverride[] {
    const matched = collections.filter(items, (candidate: RollingQueueOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingQueueOverrides(store: RollingQueueOverrideStore, query: RollingQueueOverrideQuery): RollingQueueOverride[] {
  return query.apply(store.list());
}
