import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingCreativeSummary } from "./rolling-creative-summary.js";

/** Keeps rolling creative summaries by code. */
export interface RollingCreativeSummaryStore {
  find(code: string): RollingCreativeSummary | undefined;
  save(item: RollingCreativeSummary): void;
  remove(code: string): boolean;
  list(): RollingCreativeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingCreativeSummaryStore implements RollingCreativeSummaryStore {
  items: Map<string, RollingCreativeSummary>;
  order: string[];

  constructor(items: Map<string, RollingCreativeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingCreativeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingCreativeSummary): void {
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

  list(): RollingCreativeSummary[] {
    const out: RollingCreativeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingCreativeSummaryStore(): RollingCreativeSummaryStore {
  return new MemoryRollingCreativeSummaryStore(new Map<string, RollingCreativeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingCreativeSummaryStore implements RollingCreativeSummaryStore {
  inner: RollingCreativeSummaryStore;
  cache: cache.TtlCache<RollingCreativeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingCreativeSummaryStore,
    cacheValue: cache.TtlCache<RollingCreativeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingCreativeSummary | undefined {
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

  save(item: RollingCreativeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingCreativeSummary[] {
    return this.inner.list();
  }
}

export function newCachedRollingCreativeSummaryStore(inner: RollingCreativeSummaryStore, ttl: number, clockValue: clock.Clock): RollingCreativeSummaryStore {
  return new CachedRollingCreativeSummaryStore(
    inner,
    cache.newTtlCache<RollingCreativeSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling creative summaries. Empty fields match all. */
export class RollingCreativeSummaryQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingCreativeSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingCreativeSummary[]): RollingCreativeSummary[] {
    const matched = collections.filter(items, (candidate: RollingCreativeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingCreativeSummaries(store: RollingCreativeSummaryStore, query: RollingCreativeSummaryQuery): RollingCreativeSummary[] {
  return query.apply(store.list());
}
