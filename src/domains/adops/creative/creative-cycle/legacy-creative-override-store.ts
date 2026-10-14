import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyCreativeOverride } from "./legacy-creative-override.js";

/** Keeps legacy creative overrides by code. */
export interface LegacyCreativeOverrideStore {
  find(code: string): LegacyCreativeOverride | undefined;
  save(item: LegacyCreativeOverride): void;
  remove(code: string): boolean;
  list(): LegacyCreativeOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyCreativeOverrideStore implements LegacyCreativeOverrideStore {
  items: Map<string, LegacyCreativeOverride>;
  order: string[];

  constructor(items: Map<string, LegacyCreativeOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyCreativeOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyCreativeOverride): void {
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

  list(): LegacyCreativeOverride[] {
    const out: LegacyCreativeOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyCreativeOverrideStore(): LegacyCreativeOverrideStore {
  return new MemoryLegacyCreativeOverrideStore(new Map<string, LegacyCreativeOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyCreativeOverrideStore implements LegacyCreativeOverrideStore {
  inner: LegacyCreativeOverrideStore;
  cache: cache.TtlCache<LegacyCreativeOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyCreativeOverrideStore,
    cacheValue: cache.TtlCache<LegacyCreativeOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyCreativeOverride | undefined {
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

  save(item: LegacyCreativeOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyCreativeOverride[] {
    return this.inner.list();
  }
}

export function newCachedLegacyCreativeOverrideStore(inner: LegacyCreativeOverrideStore, ttl: number, clockValue: clock.Clock): LegacyCreativeOverrideStore {
  return new CachedLegacyCreativeOverrideStore(
    inner,
    cache.newTtlCache<LegacyCreativeOverride>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy creative overrides. Empty fields match all. */
export class LegacyCreativeOverrideQuery {
  region: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRetries: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyCreativeOverride): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyCreativeOverride[]): LegacyCreativeOverride[] {
    const matched = collections.filter(items, (candidate: LegacyCreativeOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyCreativeOverrides(store: LegacyCreativeOverrideStore, query: LegacyCreativeOverrideQuery): LegacyCreativeOverride[] {
  return query.apply(store.list());
}
