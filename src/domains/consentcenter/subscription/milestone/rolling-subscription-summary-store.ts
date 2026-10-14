import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSubscriptionSummary } from "./rolling-subscription-summary.js";

/** Keeps rolling subscription summaries by code. */
export interface RollingSubscriptionSummaryStore {
  find(code: string): RollingSubscriptionSummary | undefined;
  save(item: RollingSubscriptionSummary): void;
  remove(code: string): boolean;
  list(): RollingSubscriptionSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSubscriptionSummaryStore implements RollingSubscriptionSummaryStore {
  items: Map<string, RollingSubscriptionSummary>;
  order: string[];

  constructor(items: Map<string, RollingSubscriptionSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSubscriptionSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSubscriptionSummary): void {
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

  list(): RollingSubscriptionSummary[] {
    const out: RollingSubscriptionSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSubscriptionSummaryStore(): RollingSubscriptionSummaryStore {
  return new MemoryRollingSubscriptionSummaryStore(new Map<string, RollingSubscriptionSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSubscriptionSummaryStore implements RollingSubscriptionSummaryStore {
  inner: RollingSubscriptionSummaryStore;
  cache: cache.TtlCache<RollingSubscriptionSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSubscriptionSummaryStore,
    cacheValue: cache.TtlCache<RollingSubscriptionSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSubscriptionSummary | undefined {
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

  save(item: RollingSubscriptionSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSubscriptionSummary[] {
    return this.inner.list();
  }
}

export function newCachedRollingSubscriptionSummaryStore(inner: RollingSubscriptionSummaryStore, ttl: number, clockValue: clock.Clock): RollingSubscriptionSummaryStore {
  return new CachedRollingSubscriptionSummaryStore(
    inner,
    cache.newTtlCache<RollingSubscriptionSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling subscription summaries. Empty fields match all. */
export class RollingSubscriptionSummaryQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSubscriptionSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSubscriptionSummary[]): RollingSubscriptionSummary[] {
    const matched = collections.filter(items, (candidate: RollingSubscriptionSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSubscriptionSummaries(store: RollingSubscriptionSummaryStore, query: RollingSubscriptionSummaryQuery): RollingSubscriptionSummary[] {
  return query.apply(store.list());
}
