import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupSummary } from "./warmup-summary.js";

/** Keeps warmup summaries by code. */
export interface WarmupSummaryStore {
  find(code: string): WarmupSummary | undefined;
  save(item: WarmupSummary): void;
  remove(code: string): boolean;
  list(): WarmupSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupSummaryStore implements WarmupSummaryStore {
  items: Map<string, WarmupSummary>;
  order: string[];

  constructor(items: Map<string, WarmupSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupSummary): void {
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

  list(): WarmupSummary[] {
    const out: WarmupSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupSummaryStore(): WarmupSummaryStore {
  return new MemoryWarmupSummaryStore(new Map<string, WarmupSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupSummaryStore implements WarmupSummaryStore {
  inner: WarmupSummaryStore;
  cache: cache.TtlCache<WarmupSummary>;
  hits: number;
  misses: number;

  constructor(inner: WarmupSummaryStore, cacheValue: cache.TtlCache<WarmupSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupSummary | undefined {
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

  save(item: WarmupSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupSummary[] {
    return this.inner.list();
  }
}

export function newCachedWarmupSummaryStore(inner: WarmupSummaryStore, ttl: number, clockValue: clock.Clock): WarmupSummaryStore {
  return new CachedWarmupSummaryStore(inner, cache.newTtlCache<WarmupSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup summaries. Empty fields match all. */
export class WarmupSummaryQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupSummary[]): WarmupSummary[] {
    const matched = collections.filter(items, (candidate: WarmupSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupSummaries(store: WarmupSummaryStore, query: WarmupSummaryQuery): WarmupSummary[] {
  return query.apply(store.list());
}
