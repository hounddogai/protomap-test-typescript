import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueSummary } from "./queue-summary.js";

/** Keeps queue summaries by code. */
export interface QueueSummaryStore {
  find(code: string): QueueSummary | undefined;
  save(item: QueueSummary): void;
  remove(code: string): boolean;
  list(): QueueSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueSummaryStore implements QueueSummaryStore {
  items: Map<string, QueueSummary>;
  order: string[];

  constructor(items: Map<string, QueueSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueSummary): void {
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

  list(): QueueSummary[] {
    const out: QueueSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueSummaryStore(): QueueSummaryStore {
  return new MemoryQueueSummaryStore(new Map<string, QueueSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueSummaryStore implements QueueSummaryStore {
  inner: QueueSummaryStore;
  cache: cache.TtlCache<QueueSummary>;
  hits: number;
  misses: number;

  constructor(inner: QueueSummaryStore, cacheValue: cache.TtlCache<QueueSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueSummary | undefined {
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

  save(item: QueueSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueSummary[] {
    return this.inner.list();
  }
}

export function newCachedQueueSummaryStore(inner: QueueSummaryStore, ttl: number, clockValue: clock.Clock): QueueSummaryStore {
  return new CachedQueueSummaryStore(inner, cache.newTtlCache<QueueSummary>(512, ttl, clockValue), 0, 0);
}

/** Selects queue summaries. Empty fields match all. */
export class QueueSummaryQuery {
  locale: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueSummary[]): QueueSummary[] {
    const matched = collections.filter(items, (candidate: QueueSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueSummaries(store: QueueSummaryStore, query: QueueSummaryQuery): QueueSummary[] {
  return query.apply(store.list());
}
