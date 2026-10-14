import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionOverride } from "./suppression-override.js";

/** Keeps suppression overrides by code. */
export interface SuppressionOverrideStore {
  find(code: string): SuppressionOverride | undefined;
  save(item: SuppressionOverride): void;
  remove(code: string): boolean;
  list(): SuppressionOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionOverrideStore implements SuppressionOverrideStore {
  items: Map<string, SuppressionOverride>;
  order: string[];

  constructor(items: Map<string, SuppressionOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionOverride): void {
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

  list(): SuppressionOverride[] {
    const out: SuppressionOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionOverrideStore(): SuppressionOverrideStore {
  return new MemorySuppressionOverrideStore(new Map<string, SuppressionOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionOverrideStore implements SuppressionOverrideStore {
  inner: SuppressionOverrideStore;
  cache: cache.TtlCache<SuppressionOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionOverrideStore,
    cacheValue: cache.TtlCache<SuppressionOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionOverride | undefined {
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

  save(item: SuppressionOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionOverride[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionOverrideStore(inner: SuppressionOverrideStore, ttl: number, clockValue: clock.Clock): SuppressionOverrideStore {
  return new CachedSuppressionOverrideStore(inner, cache.newTtlCache<SuppressionOverride>(64, ttl, clockValue), 0, 0);
}

/** Selects suppression overrides. Empty fields match all. */
export class SuppressionOverrideQuery {
  locale: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionOverride[]): SuppressionOverride[] {
    const matched = collections.filter(items, (candidate: SuppressionOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionOverrides(store: SuppressionOverrideStore, query: SuppressionOverrideQuery): SuppressionOverride[] {
  return query.apply(store.list());
}
