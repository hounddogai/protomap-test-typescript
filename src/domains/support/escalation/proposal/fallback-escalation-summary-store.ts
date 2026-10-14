import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackEscalationSummary } from "./fallback-escalation-summary.js";

/** Keeps fallback escalation summaries by code. */
export interface FallbackEscalationSummaryStore {
  find(code: string): FallbackEscalationSummary | undefined;
  save(item: FallbackEscalationSummary): void;
  remove(code: string): boolean;
  list(): FallbackEscalationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackEscalationSummaryStore implements FallbackEscalationSummaryStore {
  items: Map<string, FallbackEscalationSummary>;
  order: string[];

  constructor(items: Map<string, FallbackEscalationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackEscalationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackEscalationSummary): void {
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

  list(): FallbackEscalationSummary[] {
    const out: FallbackEscalationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackEscalationSummaryStore(): FallbackEscalationSummaryStore {
  return new MemoryFallbackEscalationSummaryStore(new Map<string, FallbackEscalationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackEscalationSummaryStore implements FallbackEscalationSummaryStore {
  inner: FallbackEscalationSummaryStore;
  cache: cache.TtlCache<FallbackEscalationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackEscalationSummaryStore,
    cacheValue: cache.TtlCache<FallbackEscalationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackEscalationSummary | undefined {
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

  save(item: FallbackEscalationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackEscalationSummary[] {
    return this.inner.list();
  }
}

export function newCachedFallbackEscalationSummaryStore(inner: FallbackEscalationSummaryStore, ttl: number, clockValue: clock.Clock): FallbackEscalationSummaryStore {
  return new CachedFallbackEscalationSummaryStore(
    inner,
    cache.newTtlCache<FallbackEscalationSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback escalation summaries. Empty fields match all. */
export class FallbackEscalationSummaryQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackEscalationSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackEscalationSummary[]): FallbackEscalationSummary[] {
    const matched = collections.filter(items, (candidate: FallbackEscalationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackEscalationSummaries(store: FallbackEscalationSummaryStore, query: FallbackEscalationSummaryQuery): FallbackEscalationSummary[] {
  return query.apply(store.list());
}
