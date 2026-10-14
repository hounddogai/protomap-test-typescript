import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightPreference } from "./insight-preference.js";

/** Keeps insight preferences by code. */
export interface InsightPreferenceStore {
  find(code: string): InsightPreference | undefined;
  save(item: InsightPreference): void;
  remove(code: string): boolean;
  list(): InsightPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightPreferenceStore implements InsightPreferenceStore {
  items: Map<string, InsightPreference>;
  order: string[];

  constructor(items: Map<string, InsightPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightPreference): void {
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

  list(): InsightPreference[] {
    const out: InsightPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightPreferenceStore(): InsightPreferenceStore {
  return new MemoryInsightPreferenceStore(new Map<string, InsightPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightPreferenceStore implements InsightPreferenceStore {
  inner: InsightPreferenceStore;
  cache: cache.TtlCache<InsightPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightPreferenceStore,
    cacheValue: cache.TtlCache<InsightPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightPreference | undefined {
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

  save(item: InsightPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightPreference[] {
    return this.inner.list();
  }
}

export function newCachedInsightPreferenceStore(inner: InsightPreferenceStore, ttl: number, clockValue: clock.Clock): InsightPreferenceStore {
  return new CachedInsightPreferenceStore(inner, cache.newTtlCache<InsightPreference>(512, ttl, clockValue), 0, 0);
}

/** Selects insight preferences. Empty fields match all. */
export class InsightPreferenceQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightPreference): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightPreference[]): InsightPreference[] {
    const matched = collections.filter(items, (candidate: InsightPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightPreferences(store: InsightPreferenceStore, query: InsightPreferenceQuery): InsightPreference[] {
  return query.apply(store.list());
}
