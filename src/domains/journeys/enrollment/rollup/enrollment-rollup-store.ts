import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentRollup } from "./enrollment-rollup.js";

/** Keeps enrollment rollups by code. */
export interface EnrollmentRollupStore {
  find(code: string): EnrollmentRollup | undefined;
  save(item: EnrollmentRollup): void;
  remove(code: string): boolean;
  list(): EnrollmentRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentRollupStore implements EnrollmentRollupStore {
  items: Map<string, EnrollmentRollup>;
  order: string[];

  constructor(items: Map<string, EnrollmentRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentRollup): void {
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

  list(): EnrollmentRollup[] {
    const out: EnrollmentRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentRollupStore(): EnrollmentRollupStore {
  return new MemoryEnrollmentRollupStore(new Map<string, EnrollmentRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentRollupStore implements EnrollmentRollupStore {
  inner: EnrollmentRollupStore;
  cache: cache.TtlCache<EnrollmentRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentRollupStore,
    cacheValue: cache.TtlCache<EnrollmentRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentRollup | undefined {
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

  save(item: EnrollmentRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentRollup[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentRollupStore(inner: EnrollmentRollupStore, ttl: number, clockValue: clock.Clock): EnrollmentRollupStore {
  return new CachedEnrollmentRollupStore(inner, cache.newTtlCache<EnrollmentRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects enrollment rollups. Empty fields match all. */
export class EnrollmentRollupQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentRollup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentRollup[]): EnrollmentRollup[] {
    const matched = collections.filter(items, (candidate: EnrollmentRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentRollups(store: EnrollmentRollupStore, query: EnrollmentRollupQuery): EnrollmentRollup[] {
  return query.apply(store.list());
}
