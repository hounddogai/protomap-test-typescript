import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionBaseline } from "./retention-baseline.js";

/** Keeps retention baselines by code. */
export interface RetentionBaselineStore {
  find(code: string): RetentionBaseline | undefined;
  save(item: RetentionBaseline): void;
  remove(code: string): boolean;
  list(): RetentionBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionBaselineStore implements RetentionBaselineStore {
  items: Map<string, RetentionBaseline>;
  order: string[];

  constructor(items: Map<string, RetentionBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionBaseline): void {
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

  list(): RetentionBaseline[] {
    const out: RetentionBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionBaselineStore(): RetentionBaselineStore {
  return new MemoryRetentionBaselineStore(new Map<string, RetentionBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionBaselineStore implements RetentionBaselineStore {
  inner: RetentionBaselineStore;
  cache: cache.TtlCache<RetentionBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionBaselineStore,
    cacheValue: cache.TtlCache<RetentionBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionBaseline | undefined {
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

  save(item: RetentionBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionBaseline[] {
    return this.inner.list();
  }
}

export function newCachedRetentionBaselineStore(inner: RetentionBaselineStore, ttl: number, clockValue: clock.Clock): RetentionBaselineStore {
  return new CachedRetentionBaselineStore(inner, cache.newTtlCache<RetentionBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects retention baselines. Empty fields match all. */
export class RetentionBaselineQuery {
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

  matches(item: RetentionBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionBaseline[]): RetentionBaseline[] {
    const matched = collections.filter(items, (candidate: RetentionBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionBaselines(store: RetentionBaselineStore, query: RetentionBaselineQuery): RetentionBaseline[] {
  return query.apply(store.list());
}
