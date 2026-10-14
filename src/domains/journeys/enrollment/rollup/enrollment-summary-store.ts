import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentSummary } from "./enrollment-summary.js";

/** Keeps enrollment summaries by code. */
export interface EnrollmentSummaryStore {
  find(code: string): EnrollmentSummary | undefined;
  save(item: EnrollmentSummary): void;
  remove(code: string): boolean;
  list(): EnrollmentSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentSummaryStore implements EnrollmentSummaryStore {
  items: Map<string, EnrollmentSummary>;
  order: string[];

  constructor(items: Map<string, EnrollmentSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentSummary): void {
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

  list(): EnrollmentSummary[] {
    const out: EnrollmentSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentSummaryStore(): EnrollmentSummaryStore {
  return new MemoryEnrollmentSummaryStore(new Map<string, EnrollmentSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentSummaryStore implements EnrollmentSummaryStore {
  inner: EnrollmentSummaryStore;
  cache: cache.TtlCache<EnrollmentSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentSummaryStore,
    cacheValue: cache.TtlCache<EnrollmentSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentSummary | undefined {
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

  save(item: EnrollmentSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentSummary[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentSummaryStore(inner: EnrollmentSummaryStore, ttl: number, clockValue: clock.Clock): EnrollmentSummaryStore {
  return new CachedEnrollmentSummaryStore(inner, cache.newTtlCache<EnrollmentSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects enrollment summaries. Empty fields match all. */
export class EnrollmentSummaryQuery {
  channel: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCapacity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentSummary): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentSummary[]): EnrollmentSummary[] {
    const matched = collections.filter(items, (candidate: EnrollmentSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentSummaries(store: EnrollmentSummaryStore, query: EnrollmentSummaryQuery): EnrollmentSummary[] {
  return query.apply(store.list());
}
