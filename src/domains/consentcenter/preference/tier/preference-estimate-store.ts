import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceEstimate } from "./preference-estimate.js";

/** Keeps preference estimates by code. */
export interface PreferenceEstimateStore {
  find(code: string): PreferenceEstimate | undefined;
  save(item: PreferenceEstimate): void;
  remove(code: string): boolean;
  list(): PreferenceEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceEstimateStore implements PreferenceEstimateStore {
  items: Map<string, PreferenceEstimate>;
  order: string[];

  constructor(items: Map<string, PreferenceEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceEstimate): void {
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

  list(): PreferenceEstimate[] {
    const out: PreferenceEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceEstimateStore(): PreferenceEstimateStore {
  return new MemoryPreferenceEstimateStore(new Map<string, PreferenceEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceEstimateStore implements PreferenceEstimateStore {
  inner: PreferenceEstimateStore;
  cache: cache.TtlCache<PreferenceEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceEstimateStore,
    cacheValue: cache.TtlCache<PreferenceEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceEstimate | undefined {
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

  save(item: PreferenceEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceEstimateStore(inner: PreferenceEstimateStore, ttl: number, clockValue: clock.Clock): PreferenceEstimateStore {
  return new CachedPreferenceEstimateStore(inner, cache.newTtlCache<PreferenceEstimate>(256, ttl, clockValue), 0, 0);
}

/** Selects preference estimates. Empty fields match all. */
export class PreferenceEstimateQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceEstimate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceEstimate[]): PreferenceEstimate[] {
    const matched = collections.filter(items, (candidate: PreferenceEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceEstimates(store: PreferenceEstimateStore, query: PreferenceEstimateQuery): PreferenceEstimate[] {
  return query.apply(store.list());
}
