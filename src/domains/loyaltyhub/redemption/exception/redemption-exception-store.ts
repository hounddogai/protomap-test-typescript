import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionException } from "./redemption-exception.js";

/** Keeps redemption exceptions by code. */
export interface RedemptionExceptionStore {
  find(code: string): RedemptionException | undefined;
  save(item: RedemptionException): void;
  remove(code: string): boolean;
  list(): RedemptionException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionExceptionStore implements RedemptionExceptionStore {
  items: Map<string, RedemptionException>;
  order: string[];

  constructor(items: Map<string, RedemptionException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionException): void {
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

  list(): RedemptionException[] {
    const out: RedemptionException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionExceptionStore(): RedemptionExceptionStore {
  return new MemoryRedemptionExceptionStore(new Map<string, RedemptionException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionExceptionStore implements RedemptionExceptionStore {
  inner: RedemptionExceptionStore;
  cache: cache.TtlCache<RedemptionException>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionExceptionStore,
    cacheValue: cache.TtlCache<RedemptionException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionException | undefined {
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

  save(item: RedemptionException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionException[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionExceptionStore(inner: RedemptionExceptionStore, ttl: number, clockValue: clock.Clock): RedemptionExceptionStore {
  return new CachedRedemptionExceptionStore(inner, cache.newTtlCache<RedemptionException>(1024, ttl, clockValue), 0, 0);
}

/** Selects redemption exceptions. Empty fields match all. */
export class RedemptionExceptionQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionException): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionException[]): RedemptionException[] {
    const matched = collections.filter(items, (candidate: RedemptionException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionExceptions(store: RedemptionExceptionStore, query: RedemptionExceptionQuery): RedemptionException[] {
  return query.apply(store.list());
}
