import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostSummary } from "./post-summary.js";

/** Keeps post summaries by code. */
export interface PostSummaryStore {
  find(code: string): PostSummary | undefined;
  save(item: PostSummary): void;
  remove(code: string): boolean;
  list(): PostSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostSummaryStore implements PostSummaryStore {
  items: Map<string, PostSummary>;
  order: string[];

  constructor(items: Map<string, PostSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostSummary): void {
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

  list(): PostSummary[] {
    const out: PostSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostSummaryStore(): PostSummaryStore {
  return new MemoryPostSummaryStore(new Map<string, PostSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostSummaryStore implements PostSummaryStore {
  inner: PostSummaryStore;
  cache: cache.TtlCache<PostSummary>;
  hits: number;
  misses: number;

  constructor(inner: PostSummaryStore, cacheValue: cache.TtlCache<PostSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostSummary | undefined {
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

  save(item: PostSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostSummary[] {
    return this.inner.list();
  }
}

export function newCachedPostSummaryStore(inner: PostSummaryStore, ttl: number, clockValue: clock.Clock): PostSummaryStore {
  return new CachedPostSummaryStore(inner, cache.newTtlCache<PostSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects post summaries. Empty fields match all. */
export class PostSummaryQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostSummary): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostSummary[]): PostSummary[] {
    const matched = collections.filter(items, (candidate: PostSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostSummaries(store: PostSummaryStore, query: PostSummaryQuery): PostSummary[] {
  return query.apply(store.list());
}
