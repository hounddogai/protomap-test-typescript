import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredChallengeSummary } from "./tiered-challenge-summary.js";

/** Keeps tiered challenge summaries by code. */
export interface TieredChallengeSummaryStore {
  find(code: string): TieredChallengeSummary | undefined;
  save(item: TieredChallengeSummary): void;
  remove(code: string): boolean;
  list(): TieredChallengeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredChallengeSummaryStore implements TieredChallengeSummaryStore {
  items: Map<string, TieredChallengeSummary>;
  order: string[];

  constructor(items: Map<string, TieredChallengeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredChallengeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredChallengeSummary): void {
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

  list(): TieredChallengeSummary[] {
    const out: TieredChallengeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredChallengeSummaryStore(): TieredChallengeSummaryStore {
  return new MemoryTieredChallengeSummaryStore(new Map<string, TieredChallengeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredChallengeSummaryStore implements TieredChallengeSummaryStore {
  inner: TieredChallengeSummaryStore;
  cache: cache.TtlCache<TieredChallengeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredChallengeSummaryStore,
    cacheValue: cache.TtlCache<TieredChallengeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredChallengeSummary | undefined {
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

  save(item: TieredChallengeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredChallengeSummary[] {
    return this.inner.list();
  }
}

export function newCachedTieredChallengeSummaryStore(inner: TieredChallengeSummaryStore, ttl: number, clockValue: clock.Clock): TieredChallengeSummaryStore {
  return new CachedTieredChallengeSummaryStore(
    inner,
    cache.newTtlCache<TieredChallengeSummary>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered challenge summaries. Empty fields match all. */
export class TieredChallengeSummaryQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredChallengeSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredChallengeSummary[]): TieredChallengeSummary[] {
    const matched = collections.filter(items, (candidate: TieredChallengeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredChallengeSummaries(store: TieredChallengeSummaryStore, query: TieredChallengeSummaryQuery): TieredChallengeSummary[] {
  return query.apply(store.list());
}
