import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBounceSummary } from "./tiered-bounce-summary.js";

/** Keeps tiered bounce summaries by code. */
export interface TieredBounceSummaryStore {
  find(code: string): TieredBounceSummary | undefined;
  save(item: TieredBounceSummary): void;
  remove(code: string): boolean;
  list(): TieredBounceSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBounceSummaryStore implements TieredBounceSummaryStore {
  items: Map<string, TieredBounceSummary>;
  order: string[];

  constructor(items: Map<string, TieredBounceSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBounceSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBounceSummary): void {
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

  list(): TieredBounceSummary[] {
    const out: TieredBounceSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBounceSummaryStore(): TieredBounceSummaryStore {
  return new MemoryTieredBounceSummaryStore(new Map<string, TieredBounceSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBounceSummaryStore implements TieredBounceSummaryStore {
  inner: TieredBounceSummaryStore;
  cache: cache.TtlCache<TieredBounceSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBounceSummaryStore,
    cacheValue: cache.TtlCache<TieredBounceSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBounceSummary | undefined {
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

  save(item: TieredBounceSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBounceSummary[] {
    return this.inner.list();
  }
}

export function newCachedTieredBounceSummaryStore(inner: TieredBounceSummaryStore, ttl: number, clockValue: clock.Clock): TieredBounceSummaryStore {
  return new CachedTieredBounceSummaryStore(inner, cache.newTtlCache<TieredBounceSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered bounce summaries. Empty fields match all. */
export class TieredBounceSummaryQuery {
  channel: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSendAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBounceSummary): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBounceSummary[]): TieredBounceSummary[] {
    const matched = collections.filter(items, (candidate: TieredBounceSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBounceSummaries(store: TieredBounceSummaryStore, query: TieredBounceSummaryQuery): TieredBounceSummary[] {
  return query.apply(store.list());
}
