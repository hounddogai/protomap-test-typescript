import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryFunnelOverride } from "./primary-funnel-override.js";

/** Keeps primary funnel overrides by code. */
export interface PrimaryFunnelOverrideStore {
  find(code: string): PrimaryFunnelOverride | undefined;
  save(item: PrimaryFunnelOverride): void;
  remove(code: string): boolean;
  list(): PrimaryFunnelOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryFunnelOverrideStore implements PrimaryFunnelOverrideStore {
  items: Map<string, PrimaryFunnelOverride>;
  order: string[];

  constructor(items: Map<string, PrimaryFunnelOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryFunnelOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryFunnelOverride): void {
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

  list(): PrimaryFunnelOverride[] {
    const out: PrimaryFunnelOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryFunnelOverrideStore(): PrimaryFunnelOverrideStore {
  return new MemoryPrimaryFunnelOverrideStore(new Map<string, PrimaryFunnelOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryFunnelOverrideStore implements PrimaryFunnelOverrideStore {
  inner: PrimaryFunnelOverrideStore;
  cache: cache.TtlCache<PrimaryFunnelOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryFunnelOverrideStore,
    cacheValue: cache.TtlCache<PrimaryFunnelOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryFunnelOverride | undefined {
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

  save(item: PrimaryFunnelOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryFunnelOverride[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryFunnelOverrideStore(inner: PrimaryFunnelOverrideStore, ttl: number, clockValue: clock.Clock): PrimaryFunnelOverrideStore {
  return new CachedPrimaryFunnelOverrideStore(
    inner,
    cache.newTtlCache<PrimaryFunnelOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary funnel overrides. Empty fields match all. */
export class PrimaryFunnelOverrideQuery {
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

  matches(item: PrimaryFunnelOverride): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryFunnelOverride[]): PrimaryFunnelOverride[] {
    const matched = collections.filter(items, (candidate: PrimaryFunnelOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryFunnelOverrides(store: PrimaryFunnelOverrideStore, query: PrimaryFunnelOverrideQuery): PrimaryFunnelOverride[] {
  return query.apply(store.list());
}
