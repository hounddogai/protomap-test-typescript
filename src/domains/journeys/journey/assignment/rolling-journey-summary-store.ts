import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingJourneySummary } from "./rolling-journey-summary.js";

/** Keeps rolling journey summaries by code. */
export interface RollingJourneySummaryStore {
  find(code: string): RollingJourneySummary | undefined;
  save(item: RollingJourneySummary): void;
  remove(code: string): boolean;
  list(): RollingJourneySummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingJourneySummaryStore implements RollingJourneySummaryStore {
  items: Map<string, RollingJourneySummary>;
  order: string[];

  constructor(items: Map<string, RollingJourneySummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingJourneySummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingJourneySummary): void {
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

  list(): RollingJourneySummary[] {
    const out: RollingJourneySummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingJourneySummaryStore(): RollingJourneySummaryStore {
  return new MemoryRollingJourneySummaryStore(new Map<string, RollingJourneySummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingJourneySummaryStore implements RollingJourneySummaryStore {
  inner: RollingJourneySummaryStore;
  cache: cache.TtlCache<RollingJourneySummary>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingJourneySummaryStore,
    cacheValue: cache.TtlCache<RollingJourneySummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingJourneySummary | undefined {
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

  save(item: RollingJourneySummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingJourneySummary[] {
    return this.inner.list();
  }
}

export function newCachedRollingJourneySummaryStore(inner: RollingJourneySummaryStore, ttl: number, clockValue: clock.Clock): RollingJourneySummaryStore {
  return new CachedRollingJourneySummaryStore(
    inner,
    cache.newTtlCache<RollingJourneySummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling journey summaries. Empty fields match all. */
export class RollingJourneySummaryQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingJourneySummary): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingJourneySummary[]): RollingJourneySummary[] {
    const matched = collections.filter(items, (candidate: RollingJourneySummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingJourneySummaries(store: RollingJourneySummaryStore, query: RollingJourneySummaryQuery): RollingJourneySummary[] {
  return query.apply(store.list());
}
