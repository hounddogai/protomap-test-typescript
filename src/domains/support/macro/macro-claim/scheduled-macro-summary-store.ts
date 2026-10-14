import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledMacroSummary } from "./scheduled-macro-summary.js";

/** Keeps scheduled macro summaries by code. */
export interface ScheduledMacroSummaryStore {
  find(code: string): ScheduledMacroSummary | undefined;
  save(item: ScheduledMacroSummary): void;
  remove(code: string): boolean;
  list(): ScheduledMacroSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledMacroSummaryStore implements ScheduledMacroSummaryStore {
  items: Map<string, ScheduledMacroSummary>;
  order: string[];

  constructor(items: Map<string, ScheduledMacroSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledMacroSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledMacroSummary): void {
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

  list(): ScheduledMacroSummary[] {
    const out: ScheduledMacroSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledMacroSummaryStore(): ScheduledMacroSummaryStore {
  return new MemoryScheduledMacroSummaryStore(new Map<string, ScheduledMacroSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledMacroSummaryStore implements ScheduledMacroSummaryStore {
  inner: ScheduledMacroSummaryStore;
  cache: cache.TtlCache<ScheduledMacroSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledMacroSummaryStore,
    cacheValue: cache.TtlCache<ScheduledMacroSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledMacroSummary | undefined {
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

  save(item: ScheduledMacroSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledMacroSummary[] {
    return this.inner.list();
  }
}

export function newCachedScheduledMacroSummaryStore(inner: ScheduledMacroSummaryStore, ttl: number, clockValue: clock.Clock): ScheduledMacroSummaryStore {
  return new CachedScheduledMacroSummaryStore(
    inner,
    cache.newTtlCache<ScheduledMacroSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled macro summaries. Empty fields match all. */
export class ScheduledMacroSummaryQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledMacroSummary): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledMacroSummary[]): ScheduledMacroSummary[] {
    const matched = collections.filter(items, (candidate: ScheduledMacroSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledMacroSummaries(store: ScheduledMacroSummaryStore, query: ScheduledMacroSummaryQuery): ScheduledMacroSummary[] {
  return query.apply(store.list());
}
