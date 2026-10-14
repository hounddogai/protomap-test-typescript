import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardSummary } from "./reward-summary.js";

/** Keeps reward summaries by code. */
export interface RewardSummaryStore {
  find(code: string): RewardSummary | undefined;
  save(item: RewardSummary): void;
  remove(code: string): boolean;
  list(): RewardSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardSummaryStore implements RewardSummaryStore {
  items: Map<string, RewardSummary>;
  order: string[];

  constructor(items: Map<string, RewardSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardSummary): void {
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

  list(): RewardSummary[] {
    const out: RewardSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardSummaryStore(): RewardSummaryStore {
  return new MemoryRewardSummaryStore(new Map<string, RewardSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardSummaryStore implements RewardSummaryStore {
  inner: RewardSummaryStore;
  cache: cache.TtlCache<RewardSummary>;
  hits: number;
  misses: number;

  constructor(inner: RewardSummaryStore, cacheValue: cache.TtlCache<RewardSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardSummary | undefined {
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

  save(item: RewardSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardSummary[] {
    return this.inner.list();
  }
}

export function newCachedRewardSummaryStore(inner: RewardSummaryStore, ttl: number, clockValue: clock.Clock): RewardSummaryStore {
  return new CachedRewardSummaryStore(inner, cache.newTtlCache<RewardSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects reward summaries. Empty fields match all. */
export class RewardSummaryQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardSummary[]): RewardSummary[] {
    const matched = collections.filter(items, (candidate: RewardSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardSummaries(store: RewardSummaryStore, query: RewardSummaryQuery): RewardSummary[] {
  return query.apply(store.list());
}
