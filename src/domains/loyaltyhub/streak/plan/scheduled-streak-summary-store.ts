import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledStreakSummary } from "./scheduled-streak-summary.js";

/** Keeps scheduled streak summaries by code. */
export interface ScheduledStreakSummaryStore {
  find(code: string): ScheduledStreakSummary | undefined;
  save(item: ScheduledStreakSummary): void;
  remove(code: string): boolean;
  list(): ScheduledStreakSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledStreakSummaryStore implements ScheduledStreakSummaryStore {
  items: Map<string, ScheduledStreakSummary>;
  order: string[];

  constructor(items: Map<string, ScheduledStreakSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledStreakSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledStreakSummary): void {
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

  list(): ScheduledStreakSummary[] {
    const out: ScheduledStreakSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledStreakSummaryStore(): ScheduledStreakSummaryStore {
  return new MemoryScheduledStreakSummaryStore(new Map<string, ScheduledStreakSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledStreakSummaryStore implements ScheduledStreakSummaryStore {
  inner: ScheduledStreakSummaryStore;
  cache: cache.TtlCache<ScheduledStreakSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledStreakSummaryStore,
    cacheValue: cache.TtlCache<ScheduledStreakSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledStreakSummary | undefined {
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

  save(item: ScheduledStreakSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledStreakSummary[] {
    return this.inner.list();
  }
}

export function newCachedScheduledStreakSummaryStore(inner: ScheduledStreakSummaryStore, ttl: number, clockValue: clock.Clock): ScheduledStreakSummaryStore {
  return new CachedScheduledStreakSummaryStore(
    inner,
    cache.newTtlCache<ScheduledStreakSummary>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled streak summaries. Empty fields match all. */
export class ScheduledStreakSummaryQuery {
  source: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minLimit: number, statuses: string[], limit: number) {
    this.source = source;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledStreakSummary): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledStreakSummary[]): ScheduledStreakSummary[] {
    const matched = collections.filter(items, (candidate: ScheduledStreakSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledStreakSummaries(store: ScheduledStreakSummaryStore, query: ScheduledStreakSummaryQuery): ScheduledStreakSummary[] {
  return query.apply(store.list());
}
