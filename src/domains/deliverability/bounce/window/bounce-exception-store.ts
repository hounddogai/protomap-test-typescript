import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceException } from "./bounce-exception.js";

/** Keeps bounce exceptions by code. */
export interface BounceExceptionStore {
  find(code: string): BounceException | undefined;
  save(item: BounceException): void;
  remove(code: string): boolean;
  list(): BounceException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceExceptionStore implements BounceExceptionStore {
  items: Map<string, BounceException>;
  order: string[];

  constructor(items: Map<string, BounceException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceException): void {
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

  list(): BounceException[] {
    const out: BounceException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceExceptionStore(): BounceExceptionStore {
  return new MemoryBounceExceptionStore(new Map<string, BounceException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceExceptionStore implements BounceExceptionStore {
  inner: BounceExceptionStore;
  cache: cache.TtlCache<BounceException>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceExceptionStore,
    cacheValue: cache.TtlCache<BounceException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceException | undefined {
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

  save(item: BounceException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceException[] {
    return this.inner.list();
  }
}

export function newCachedBounceExceptionStore(inner: BounceExceptionStore, ttl: number, clockValue: clock.Clock): BounceExceptionStore {
  return new CachedBounceExceptionStore(inner, cache.newTtlCache<BounceException>(128, ttl, clockValue), 0, 0);
}

/** Selects bounce exceptions. Empty fields match all. */
export class BounceExceptionQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceException[]): BounceException[] {
    const matched = collections.filter(items, (candidate: BounceException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceExceptions(store: BounceExceptionStore, query: BounceExceptionQuery): BounceException[] {
  return query.apply(store.list());
}
