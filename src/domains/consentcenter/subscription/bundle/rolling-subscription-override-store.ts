import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSubscriptionOverride } from "./rolling-subscription-override.js";

/** Keeps rolling subscription overrides by code. */
export interface RollingSubscriptionOverrideStore {
  find(code: string): RollingSubscriptionOverride | undefined;
  save(item: RollingSubscriptionOverride): void;
  remove(code: string): boolean;
  list(): RollingSubscriptionOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSubscriptionOverrideStore implements RollingSubscriptionOverrideStore {
  items: Map<string, RollingSubscriptionOverride>;
  order: string[];

  constructor(items: Map<string, RollingSubscriptionOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSubscriptionOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSubscriptionOverride): void {
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

  list(): RollingSubscriptionOverride[] {
    const out: RollingSubscriptionOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSubscriptionOverrideStore(): RollingSubscriptionOverrideStore {
  return new MemoryRollingSubscriptionOverrideStore(new Map<string, RollingSubscriptionOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSubscriptionOverrideStore implements RollingSubscriptionOverrideStore {
  inner: RollingSubscriptionOverrideStore;
  cache: cache.TtlCache<RollingSubscriptionOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSubscriptionOverrideStore,
    cacheValue: cache.TtlCache<RollingSubscriptionOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSubscriptionOverride | undefined {
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

  save(item: RollingSubscriptionOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSubscriptionOverride[] {
    return this.inner.list();
  }
}

export function newCachedRollingSubscriptionOverrideStore(inner: RollingSubscriptionOverrideStore, ttl: number, clockValue: clock.Clock): RollingSubscriptionOverrideStore {
  return new CachedRollingSubscriptionOverrideStore(
    inner,
    cache.newTtlCache<RollingSubscriptionOverride>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling subscription overrides. Empty fields match all. */
export class RollingSubscriptionOverrideQuery {
  source: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCapacity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSubscriptionOverride): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSubscriptionOverride[]): RollingSubscriptionOverride[] {
    const matched = collections.filter(items, (candidate: RollingSubscriptionOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSubscriptionOverrides(store: RollingSubscriptionOverrideStore, query: RollingSubscriptionOverrideQuery): RollingSubscriptionOverride[] {
  return query.apply(store.list());
}
