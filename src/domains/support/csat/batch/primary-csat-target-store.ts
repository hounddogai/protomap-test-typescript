import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryCsatTarget } from "./primary-csat-target.js";

/** Keeps primary csat targets by code. */
export interface PrimaryCsatTargetStore {
  find(code: string): PrimaryCsatTarget | undefined;
  save(item: PrimaryCsatTarget): void;
  remove(code: string): boolean;
  list(): PrimaryCsatTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryCsatTargetStore implements PrimaryCsatTargetStore {
  items: Map<string, PrimaryCsatTarget>;
  order: string[];

  constructor(items: Map<string, PrimaryCsatTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryCsatTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryCsatTarget): void {
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

  list(): PrimaryCsatTarget[] {
    const out: PrimaryCsatTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryCsatTargetStore(): PrimaryCsatTargetStore {
  return new MemoryPrimaryCsatTargetStore(new Map<string, PrimaryCsatTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryCsatTargetStore implements PrimaryCsatTargetStore {
  inner: PrimaryCsatTargetStore;
  cache: cache.TtlCache<PrimaryCsatTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryCsatTargetStore,
    cacheValue: cache.TtlCache<PrimaryCsatTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryCsatTarget | undefined {
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

  save(item: PrimaryCsatTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryCsatTarget[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryCsatTargetStore(inner: PrimaryCsatTargetStore, ttl: number, clockValue: clock.Clock): PrimaryCsatTargetStore {
  return new CachedPrimaryCsatTargetStore(inner, cache.newTtlCache<PrimaryCsatTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects primary csat targets. Empty fields match all. */
export class PrimaryCsatTargetQuery {
  country: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minEndsAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryCsatTarget): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryCsatTarget[]): PrimaryCsatTarget[] {
    const matched = collections.filter(items, (candidate: PrimaryCsatTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryCsatTargets(store: PrimaryCsatTargetStore, query: PrimaryCsatTargetQuery): PrimaryCsatTarget[] {
  return query.apply(store.list());
}
