import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelOverride } from "./funnel-override.js";

/** Keeps funnel overrides by code. */
export interface FunnelOverrideStore {
  find(code: string): FunnelOverride | undefined;
  save(item: FunnelOverride): void;
  remove(code: string): boolean;
  list(): FunnelOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelOverrideStore implements FunnelOverrideStore {
  items: Map<string, FunnelOverride>;
  order: string[];

  constructor(items: Map<string, FunnelOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelOverride): void {
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

  list(): FunnelOverride[] {
    const out: FunnelOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelOverrideStore(): FunnelOverrideStore {
  return new MemoryFunnelOverrideStore(new Map<string, FunnelOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelOverrideStore implements FunnelOverrideStore {
  inner: FunnelOverrideStore;
  cache: cache.TtlCache<FunnelOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelOverrideStore,
    cacheValue: cache.TtlCache<FunnelOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelOverride | undefined {
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

  save(item: FunnelOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelOverride[] {
    return this.inner.list();
  }
}

export function newCachedFunnelOverrideStore(inner: FunnelOverrideStore, ttl: number, clockValue: clock.Clock): FunnelOverrideStore {
  return new CachedFunnelOverrideStore(inner, cache.newTtlCache<FunnelOverride>(1024, ttl, clockValue), 0, 0);
}

/** Selects funnel overrides. Empty fields match all. */
export class FunnelOverrideQuery {
  region: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minOpenRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelOverride): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelOverride[]): FunnelOverride[] {
    const matched = collections.filter(items, (candidate: FunnelOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelOverrides(store: FunnelOverrideStore, query: FunnelOverrideQuery): FunnelOverride[] {
  return query.apply(store.list());
}
