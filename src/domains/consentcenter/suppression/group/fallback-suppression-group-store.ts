import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSuppressionGroup } from "./fallback-suppression-group.js";

/** Keeps fallback suppression groups by code. */
export interface FallbackSuppressionGroupStore {
  find(code: string): FallbackSuppressionGroup | undefined;
  save(item: FallbackSuppressionGroup): void;
  remove(code: string): boolean;
  list(): FallbackSuppressionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSuppressionGroupStore implements FallbackSuppressionGroupStore {
  items: Map<string, FallbackSuppressionGroup>;
  order: string[];

  constructor(items: Map<string, FallbackSuppressionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSuppressionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSuppressionGroup): void {
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

  list(): FallbackSuppressionGroup[] {
    const out: FallbackSuppressionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSuppressionGroupStore(): FallbackSuppressionGroupStore {
  return new MemoryFallbackSuppressionGroupStore(new Map<string, FallbackSuppressionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSuppressionGroupStore implements FallbackSuppressionGroupStore {
  inner: FallbackSuppressionGroupStore;
  cache: cache.TtlCache<FallbackSuppressionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSuppressionGroupStore,
    cacheValue: cache.TtlCache<FallbackSuppressionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSuppressionGroup | undefined {
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

  save(item: FallbackSuppressionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSuppressionGroup[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSuppressionGroupStore(inner: FallbackSuppressionGroupStore, ttl: number, clockValue: clock.Clock): FallbackSuppressionGroupStore {
  return new CachedFallbackSuppressionGroupStore(
    inner,
    cache.newTtlCache<FallbackSuppressionGroup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback suppression groups. Empty fields match all. */
export class FallbackSuppressionGroupQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSuppressionGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSuppressionGroup[]): FallbackSuppressionGroup[] {
    const matched = collections.filter(items, (candidate: FallbackSuppressionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSuppressionGroups(store: FallbackSuppressionGroupStore, query: FallbackSuppressionGroupQuery): FallbackSuppressionGroup[] {
  return query.apply(store.list());
}
