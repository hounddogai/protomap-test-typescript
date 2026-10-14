import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeSummary } from "./challenge-summary.js";

/** Keeps challenge summaries by code. */
export interface ChallengeSummaryStore {
  find(code: string): ChallengeSummary | undefined;
  save(item: ChallengeSummary): void;
  remove(code: string): boolean;
  list(): ChallengeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeSummaryStore implements ChallengeSummaryStore {
  items: Map<string, ChallengeSummary>;
  order: string[];

  constructor(items: Map<string, ChallengeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeSummary): void {
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

  list(): ChallengeSummary[] {
    const out: ChallengeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeSummaryStore(): ChallengeSummaryStore {
  return new MemoryChallengeSummaryStore(new Map<string, ChallengeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeSummaryStore implements ChallengeSummaryStore {
  inner: ChallengeSummaryStore;
  cache: cache.TtlCache<ChallengeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeSummaryStore,
    cacheValue: cache.TtlCache<ChallengeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeSummary | undefined {
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

  save(item: ChallengeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeSummary[] {
    return this.inner.list();
  }
}

export function newCachedChallengeSummaryStore(inner: ChallengeSummaryStore, ttl: number, clockValue: clock.Clock): ChallengeSummaryStore {
  return new CachedChallengeSummaryStore(inner, cache.newTtlCache<ChallengeSummary>(512, ttl, clockValue), 0, 0);
}

/** Selects challenge summaries. Empty fields match all. */
export class ChallengeSummaryQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeSummary[]): ChallengeSummary[] {
    const matched = collections.filter(items, (candidate: ChallengeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeSummaries(store: ChallengeSummaryStore, query: ChallengeSummaryQuery): ChallengeSummary[] {
  return query.apply(store.list());
}
