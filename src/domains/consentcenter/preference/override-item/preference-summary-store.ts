import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceSummary } from "./preference-summary.js";

/** Keeps preference summaries by code. */
export interface PreferenceSummaryStore {
  find(code: string): PreferenceSummary | undefined;
  save(item: PreferenceSummary): void;
  remove(code: string): boolean;
  list(): PreferenceSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceSummaryStore implements PreferenceSummaryStore {
  items: Map<string, PreferenceSummary>;
  order: string[];

  constructor(items: Map<string, PreferenceSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceSummary): void {
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

  list(): PreferenceSummary[] {
    const out: PreferenceSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceSummaryStore(): PreferenceSummaryStore {
  return new MemoryPreferenceSummaryStore(new Map<string, PreferenceSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceSummaryStore implements PreferenceSummaryStore {
  inner: PreferenceSummaryStore;
  cache: cache.TtlCache<PreferenceSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceSummaryStore,
    cacheValue: cache.TtlCache<PreferenceSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceSummary | undefined {
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

  save(item: PreferenceSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceSummary[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceSummaryStore(inner: PreferenceSummaryStore, ttl: number, clockValue: clock.Clock): PreferenceSummaryStore {
  return new CachedPreferenceSummaryStore(inner, cache.newTtlCache<PreferenceSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects preference summaries. Empty fields match all. */
export class PreferenceSummaryQuery {
  name: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minQuantity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceSummary[]): PreferenceSummary[] {
    const matched = collections.filter(items, (candidate: PreferenceSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceSummaries(store: PreferenceSummaryStore, query: PreferenceSummaryQuery): PreferenceSummary[] {
  return query.apply(store.list());
}
