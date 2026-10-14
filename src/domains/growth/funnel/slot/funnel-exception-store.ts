import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelException } from "./funnel-exception.js";

/** Keeps funnel exceptions by code. */
export interface FunnelExceptionStore {
  find(code: string): FunnelException | undefined;
  save(item: FunnelException): void;
  remove(code: string): boolean;
  list(): FunnelException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelExceptionStore implements FunnelExceptionStore {
  items: Map<string, FunnelException>;
  order: string[];

  constructor(items: Map<string, FunnelException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelException): void {
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

  list(): FunnelException[] {
    const out: FunnelException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelExceptionStore(): FunnelExceptionStore {
  return new MemoryFunnelExceptionStore(new Map<string, FunnelException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelExceptionStore implements FunnelExceptionStore {
  inner: FunnelExceptionStore;
  cache: cache.TtlCache<FunnelException>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelExceptionStore,
    cacheValue: cache.TtlCache<FunnelException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelException | undefined {
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

  save(item: FunnelException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelException[] {
    return this.inner.list();
  }
}

export function newCachedFunnelExceptionStore(inner: FunnelExceptionStore, ttl: number, clockValue: clock.Clock): FunnelExceptionStore {
  return new CachedFunnelExceptionStore(inner, cache.newTtlCache<FunnelException>(128, ttl, clockValue), 0, 0);
}

/** Selects funnel exceptions. Empty fields match all. */
export class FunnelExceptionQuery {
  category: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAttempts: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelException): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelException[]): FunnelException[] {
    const matched = collections.filter(items, (candidate: FunnelException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelExceptions(store: FunnelExceptionStore, query: FunnelExceptionQuery): FunnelException[] {
  return query.apply(store.list());
}
