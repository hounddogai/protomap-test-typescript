import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBadgeException } from "./pending-badge-exception.js";

/** Keeps pending badge exceptions by code. */
export interface PendingBadgeExceptionStore {
  find(code: string): PendingBadgeException | undefined;
  save(item: PendingBadgeException): void;
  remove(code: string): boolean;
  list(): PendingBadgeException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBadgeExceptionStore implements PendingBadgeExceptionStore {
  items: Map<string, PendingBadgeException>;
  order: string[];

  constructor(items: Map<string, PendingBadgeException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBadgeException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBadgeException): void {
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

  list(): PendingBadgeException[] {
    const out: PendingBadgeException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBadgeExceptionStore(): PendingBadgeExceptionStore {
  return new MemoryPendingBadgeExceptionStore(new Map<string, PendingBadgeException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBadgeExceptionStore implements PendingBadgeExceptionStore {
  inner: PendingBadgeExceptionStore;
  cache: cache.TtlCache<PendingBadgeException>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBadgeExceptionStore,
    cacheValue: cache.TtlCache<PendingBadgeException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBadgeException | undefined {
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

  save(item: PendingBadgeException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBadgeException[] {
    return this.inner.list();
  }
}

export function newCachedPendingBadgeExceptionStore(inner: PendingBadgeExceptionStore, ttl: number, clockValue: clock.Clock): PendingBadgeExceptionStore {
  return new CachedPendingBadgeExceptionStore(
    inner,
    cache.newTtlCache<PendingBadgeException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending badge exceptions. Empty fields match all. */
export class PendingBadgeExceptionQuery {
  label: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minConversionRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBadgeException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBadgeException[]): PendingBadgeException[] {
    const matched = collections.filter(items, (candidate: PendingBadgeException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBadgeExceptions(store: PendingBadgeExceptionStore, query: PendingBadgeExceptionQuery): PendingBadgeException[] {
  return query.apply(store.list());
}
