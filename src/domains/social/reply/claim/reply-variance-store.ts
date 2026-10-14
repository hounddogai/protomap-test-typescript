import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyVariance } from "./reply-variance.js";

/** Keeps reply variances by code. */
export interface ReplyVarianceStore {
  find(code: string): ReplyVariance | undefined;
  save(item: ReplyVariance): void;
  remove(code: string): boolean;
  list(): ReplyVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyVarianceStore implements ReplyVarianceStore {
  items: Map<string, ReplyVariance>;
  order: string[];

  constructor(items: Map<string, ReplyVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyVariance): void {
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

  list(): ReplyVariance[] {
    const out: ReplyVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyVarianceStore(): ReplyVarianceStore {
  return new MemoryReplyVarianceStore(new Map<string, ReplyVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyVarianceStore implements ReplyVarianceStore {
  inner: ReplyVarianceStore;
  cache: cache.TtlCache<ReplyVariance>;
  hits: number;
  misses: number;

  constructor(inner: ReplyVarianceStore, cacheValue: cache.TtlCache<ReplyVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyVariance | undefined {
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

  save(item: ReplyVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyVariance[] {
    return this.inner.list();
  }
}

export function newCachedReplyVarianceStore(inner: ReplyVarianceStore, ttl: number, clockValue: clock.Clock): ReplyVarianceStore {
  return new CachedReplyVarianceStore(inner, cache.newTtlCache<ReplyVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects reply variances. Empty fields match all. */
export class ReplyVarianceQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyVariance[]): ReplyVariance[] {
    const matched = collections.filter(items, (candidate: ReplyVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyVariances(store: ReplyVarianceStore, query: ReplyVarianceQuery): ReplyVariance[] {
  return query.apply(store.list());
}
