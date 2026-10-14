import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionException } from "./suppression-exception.js";

/** Keeps suppression exceptions by code. */
export interface SuppressionExceptionStore {
  find(code: string): SuppressionException | undefined;
  save(item: SuppressionException): void;
  remove(code: string): boolean;
  list(): SuppressionException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionExceptionStore implements SuppressionExceptionStore {
  items: Map<string, SuppressionException>;
  order: string[];

  constructor(items: Map<string, SuppressionException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionException): void {
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

  list(): SuppressionException[] {
    const out: SuppressionException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionExceptionStore(): SuppressionExceptionStore {
  return new MemorySuppressionExceptionStore(new Map<string, SuppressionException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionExceptionStore implements SuppressionExceptionStore {
  inner: SuppressionExceptionStore;
  cache: cache.TtlCache<SuppressionException>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionExceptionStore,
    cacheValue: cache.TtlCache<SuppressionException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionException | undefined {
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

  save(item: SuppressionException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionException[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionExceptionStore(inner: SuppressionExceptionStore, ttl: number, clockValue: clock.Clock): SuppressionExceptionStore {
  return new CachedSuppressionExceptionStore(
    inner,
    cache.newTtlCache<SuppressionException>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects suppression exceptions. Empty fields match all. */
export class SuppressionExceptionQuery {
  unit: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionException): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionException[]): SuppressionException[] {
    const matched = collections.filter(items, (candidate: SuppressionException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionExceptions(store: SuppressionExceptionStore, query: SuppressionExceptionQuery): SuppressionException[] {
  return query.apply(store.list());
}
