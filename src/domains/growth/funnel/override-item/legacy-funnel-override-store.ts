import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFunnelOverride } from "./legacy-funnel-override.js";

/** Keeps legacy funnel overrides by code. */
export interface LegacyFunnelOverrideStore {
  find(code: string): LegacyFunnelOverride | undefined;
  save(item: LegacyFunnelOverride): void;
  remove(code: string): boolean;
  list(): LegacyFunnelOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFunnelOverrideStore implements LegacyFunnelOverrideStore {
  items: Map<string, LegacyFunnelOverride>;
  order: string[];

  constructor(items: Map<string, LegacyFunnelOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFunnelOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFunnelOverride): void {
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

  list(): LegacyFunnelOverride[] {
    const out: LegacyFunnelOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFunnelOverrideStore(): LegacyFunnelOverrideStore {
  return new MemoryLegacyFunnelOverrideStore(new Map<string, LegacyFunnelOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFunnelOverrideStore implements LegacyFunnelOverrideStore {
  inner: LegacyFunnelOverrideStore;
  cache: cache.TtlCache<LegacyFunnelOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFunnelOverrideStore,
    cacheValue: cache.TtlCache<LegacyFunnelOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFunnelOverride | undefined {
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

  save(item: LegacyFunnelOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFunnelOverride[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFunnelOverrideStore(inner: LegacyFunnelOverrideStore, ttl: number, clockValue: clock.Clock): LegacyFunnelOverrideStore {
  return new CachedLegacyFunnelOverrideStore(
    inner,
    cache.newTtlCache<LegacyFunnelOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy funnel overrides. Empty fields match all. */
export class LegacyFunnelOverrideQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFunnelOverride): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFunnelOverride[]): LegacyFunnelOverride[] {
    const matched = collections.filter(items, (candidate: LegacyFunnelOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFunnelOverrides(store: LegacyFunnelOverrideStore, query: LegacyFunnelOverrideQuery): LegacyFunnelOverride[] {
  return query.apply(store.list());
}
