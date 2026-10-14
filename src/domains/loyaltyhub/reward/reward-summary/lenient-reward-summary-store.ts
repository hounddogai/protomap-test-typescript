import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRewardSummary } from "./lenient-reward-summary.js";

/** Keeps lenient reward summaries by code. */
export interface LenientRewardSummaryStore {
  find(code: string): LenientRewardSummary | undefined;
  save(item: LenientRewardSummary): void;
  remove(code: string): boolean;
  list(): LenientRewardSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRewardSummaryStore implements LenientRewardSummaryStore {
  items: Map<string, LenientRewardSummary>;
  order: string[];

  constructor(items: Map<string, LenientRewardSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRewardSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRewardSummary): void {
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

  list(): LenientRewardSummary[] {
    const out: LenientRewardSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRewardSummaryStore(): LenientRewardSummaryStore {
  return new MemoryLenientRewardSummaryStore(new Map<string, LenientRewardSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRewardSummaryStore implements LenientRewardSummaryStore {
  inner: LenientRewardSummaryStore;
  cache: cache.TtlCache<LenientRewardSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRewardSummaryStore,
    cacheValue: cache.TtlCache<LenientRewardSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRewardSummary | undefined {
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

  save(item: LenientRewardSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRewardSummary[] {
    return this.inner.list();
  }
}

export function newCachedLenientRewardSummaryStore(inner: LenientRewardSummaryStore, ttl: number, clockValue: clock.Clock): LenientRewardSummaryStore {
  return new CachedLenientRewardSummaryStore(
    inner,
    cache.newTtlCache<LenientRewardSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reward summaries. Empty fields match all. */
export class LenientRewardSummaryQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRewardSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRewardSummary[]): LenientRewardSummary[] {
    const matched = collections.filter(items, (candidate: LenientRewardSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRewardSummaries(store: LenientRewardSummaryStore, query: LenientRewardSummaryQuery): LenientRewardSummary[] {
  return query.apply(store.list());
}
