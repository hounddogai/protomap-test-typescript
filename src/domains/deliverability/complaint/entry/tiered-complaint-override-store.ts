import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredComplaintOverride } from "./tiered-complaint-override.js";

/** Keeps tiered complaint overrides by code. */
export interface TieredComplaintOverrideStore {
  find(code: string): TieredComplaintOverride | undefined;
  save(item: TieredComplaintOverride): void;
  remove(code: string): boolean;
  list(): TieredComplaintOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredComplaintOverrideStore implements TieredComplaintOverrideStore {
  items: Map<string, TieredComplaintOverride>;
  order: string[];

  constructor(items: Map<string, TieredComplaintOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredComplaintOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredComplaintOverride): void {
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

  list(): TieredComplaintOverride[] {
    const out: TieredComplaintOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredComplaintOverrideStore(): TieredComplaintOverrideStore {
  return new MemoryTieredComplaintOverrideStore(new Map<string, TieredComplaintOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredComplaintOverrideStore implements TieredComplaintOverrideStore {
  inner: TieredComplaintOverrideStore;
  cache: cache.TtlCache<TieredComplaintOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredComplaintOverrideStore,
    cacheValue: cache.TtlCache<TieredComplaintOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredComplaintOverride | undefined {
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

  save(item: TieredComplaintOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredComplaintOverride[] {
    return this.inner.list();
  }
}

export function newCachedTieredComplaintOverrideStore(inner: TieredComplaintOverrideStore, ttl: number, clockValue: clock.Clock): TieredComplaintOverrideStore {
  return new CachedTieredComplaintOverrideStore(
    inner,
    cache.newTtlCache<TieredComplaintOverride>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered complaint overrides. Empty fields match all. */
export class TieredComplaintOverrideQuery {
  locale: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRevision: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredComplaintOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredComplaintOverride[]): TieredComplaintOverride[] {
    const matched = collections.filter(items, (candidate: TieredComplaintOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredComplaintOverrides(store: TieredComplaintOverrideStore, query: TieredComplaintOverrideQuery): TieredComplaintOverride[] {
  return query.apply(store.list());
}
