import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPreferenceOverride } from "./capped-preference-override.js";

/** Keeps capped preference overrides by code. */
export interface CappedPreferenceOverrideStore {
  find(code: string): CappedPreferenceOverride | undefined;
  save(item: CappedPreferenceOverride): void;
  remove(code: string): boolean;
  list(): CappedPreferenceOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPreferenceOverrideStore implements CappedPreferenceOverrideStore {
  items: Map<string, CappedPreferenceOverride>;
  order: string[];

  constructor(items: Map<string, CappedPreferenceOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPreferenceOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPreferenceOverride): void {
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

  list(): CappedPreferenceOverride[] {
    const out: CappedPreferenceOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPreferenceOverrideStore(): CappedPreferenceOverrideStore {
  return new MemoryCappedPreferenceOverrideStore(new Map<string, CappedPreferenceOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPreferenceOverrideStore implements CappedPreferenceOverrideStore {
  inner: CappedPreferenceOverrideStore;
  cache: cache.TtlCache<CappedPreferenceOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPreferenceOverrideStore,
    cacheValue: cache.TtlCache<CappedPreferenceOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPreferenceOverride | undefined {
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

  save(item: CappedPreferenceOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPreferenceOverride[] {
    return this.inner.list();
  }
}

export function newCachedCappedPreferenceOverrideStore(inner: CappedPreferenceOverrideStore, ttl: number, clockValue: clock.Clock): CappedPreferenceOverrideStore {
  return new CachedCappedPreferenceOverrideStore(
    inner,
    cache.newTtlCache<CappedPreferenceOverride>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped preference overrides. Empty fields match all. */
export class CappedPreferenceOverrideQuery {
  segment: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPreferenceOverride): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPreferenceOverride[]): CappedPreferenceOverride[] {
    const matched = collections.filter(items, (candidate: CappedPreferenceOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPreferenceOverrides(store: CappedPreferenceOverrideStore, query: CappedPreferenceOverrideQuery): CappedPreferenceOverride[] {
  return query.apply(store.list());
}
