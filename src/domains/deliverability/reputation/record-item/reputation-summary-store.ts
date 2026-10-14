import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationSummary } from "./reputation-summary.js";

/** Keeps reputation summaries by code. */
export interface ReputationSummaryStore {
  find(code: string): ReputationSummary | undefined;
  save(item: ReputationSummary): void;
  remove(code: string): boolean;
  list(): ReputationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationSummaryStore implements ReputationSummaryStore {
  items: Map<string, ReputationSummary>;
  order: string[];

  constructor(items: Map<string, ReputationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationSummary): void {
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

  list(): ReputationSummary[] {
    const out: ReputationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationSummaryStore(): ReputationSummaryStore {
  return new MemoryReputationSummaryStore(new Map<string, ReputationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationSummaryStore implements ReputationSummaryStore {
  inner: ReputationSummaryStore;
  cache: cache.TtlCache<ReputationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationSummaryStore,
    cacheValue: cache.TtlCache<ReputationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationSummary | undefined {
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

  save(item: ReputationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationSummary[] {
    return this.inner.list();
  }
}

export function newCachedReputationSummaryStore(inner: ReputationSummaryStore, ttl: number, clockValue: clock.Clock): ReputationSummaryStore {
  return new CachedReputationSummaryStore(inner, cache.newTtlCache<ReputationSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects reputation summaries. Empty fields match all. */
export class ReputationSummaryQuery {
  title: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationSummary[]): ReputationSummary[] {
    const matched = collections.filter(items, (candidate: ReputationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationSummaries(store: ReputationSummaryStore, query: ReputationSummaryQuery): ReputationSummary[] {
  return query.apply(store.list());
}
