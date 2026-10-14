import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledRewardRuleSummary } from "./scheduled-reward-rule-summary.js";

/** Keeps scheduled reward rule summaries by code. */
export interface ScheduledRewardRuleSummaryStore {
  find(code: string): ScheduledRewardRuleSummary | undefined;
  save(item: ScheduledRewardRuleSummary): void;
  remove(code: string): boolean;
  list(): ScheduledRewardRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledRewardRuleSummaryStore implements ScheduledRewardRuleSummaryStore {
  items: Map<string, ScheduledRewardRuleSummary>;
  order: string[];

  constructor(items: Map<string, ScheduledRewardRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledRewardRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledRewardRuleSummary): void {
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

  list(): ScheduledRewardRuleSummary[] {
    const out: ScheduledRewardRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledRewardRuleSummaryStore(): ScheduledRewardRuleSummaryStore {
  return new MemoryScheduledRewardRuleSummaryStore(new Map<string, ScheduledRewardRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledRewardRuleSummaryStore implements ScheduledRewardRuleSummaryStore {
  inner: ScheduledRewardRuleSummaryStore;
  cache: cache.TtlCache<ScheduledRewardRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledRewardRuleSummaryStore,
    cacheValue: cache.TtlCache<ScheduledRewardRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledRewardRuleSummary | undefined {
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

  save(item: ScheduledRewardRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledRewardRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedScheduledRewardRuleSummaryStore(inner: ScheduledRewardRuleSummaryStore, ttl: number, clockValue: clock.Clock): ScheduledRewardRuleSummaryStore {
  return new CachedScheduledRewardRuleSummaryStore(
    inner,
    cache.newTtlCache<ScheduledRewardRuleSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled reward rule summaries. Empty fields match all. */
export class ScheduledRewardRuleSummaryQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledRewardRuleSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledRewardRuleSummary[]): ScheduledRewardRuleSummary[] {
    const matched = collections.filter(items, (candidate: ScheduledRewardRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledRewardRuleSummaries(store: ScheduledRewardRuleSummaryStore, query: ScheduledRewardRuleSummaryQuery): ScheduledRewardRuleSummary[] {
  return query.apply(store.list());
}
