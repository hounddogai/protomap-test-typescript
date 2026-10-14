import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingWaitSummary } from "./pending-wait-summary.js";

/** Keeps pending wait summaries by code. */
export interface PendingWaitSummaryStore {
  find(code: string): PendingWaitSummary | undefined;
  save(item: PendingWaitSummary): void;
  remove(code: string): boolean;
  list(): PendingWaitSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingWaitSummaryStore implements PendingWaitSummaryStore {
  items: Map<string, PendingWaitSummary>;
  order: string[];

  constructor(items: Map<string, PendingWaitSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingWaitSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingWaitSummary): void {
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

  list(): PendingWaitSummary[] {
    const out: PendingWaitSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingWaitSummaryStore(): PendingWaitSummaryStore {
  return new MemoryPendingWaitSummaryStore(new Map<string, PendingWaitSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingWaitSummaryStore implements PendingWaitSummaryStore {
  inner: PendingWaitSummaryStore;
  cache: cache.TtlCache<PendingWaitSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingWaitSummaryStore,
    cacheValue: cache.TtlCache<PendingWaitSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingWaitSummary | undefined {
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

  save(item: PendingWaitSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingWaitSummary[] {
    return this.inner.list();
  }
}

export function newCachedPendingWaitSummaryStore(inner: PendingWaitSummaryStore, ttl: number, clockValue: clock.Clock): PendingWaitSummaryStore {
  return new CachedPendingWaitSummaryStore(inner, cache.newTtlCache<PendingWaitSummary>(512, ttl, clockValue), 0, 0);
}

/** Selects pending wait summaries. Empty fields match all. */
export class PendingWaitSummaryQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingWaitSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingWaitSummary[]): PendingWaitSummary[] {
    const matched = collections.filter(items, (candidate: PendingWaitSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingWaitSummaries(store: PendingWaitSummaryStore, query: PendingWaitSummaryQuery): PendingWaitSummary[] {
  return query.apply(store.list());
}
