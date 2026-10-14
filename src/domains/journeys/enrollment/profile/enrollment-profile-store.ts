import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentProfile } from "./enrollment-profile.js";

/** Keeps enrollment profiles by code. */
export interface EnrollmentProfileStore {
  find(code: string): EnrollmentProfile | undefined;
  save(item: EnrollmentProfile): void;
  remove(code: string): boolean;
  list(): EnrollmentProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentProfileStore implements EnrollmentProfileStore {
  items: Map<string, EnrollmentProfile>;
  order: string[];

  constructor(items: Map<string, EnrollmentProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentProfile): void {
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

  list(): EnrollmentProfile[] {
    const out: EnrollmentProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentProfileStore(): EnrollmentProfileStore {
  return new MemoryEnrollmentProfileStore(new Map<string, EnrollmentProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentProfileStore implements EnrollmentProfileStore {
  inner: EnrollmentProfileStore;
  cache: cache.TtlCache<EnrollmentProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentProfileStore,
    cacheValue: cache.TtlCache<EnrollmentProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentProfile | undefined {
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

  save(item: EnrollmentProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentProfile[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentProfileStore(inner: EnrollmentProfileStore, ttl: number, clockValue: clock.Clock): EnrollmentProfileStore {
  return new CachedEnrollmentProfileStore(inner, cache.newTtlCache<EnrollmentProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects enrollment profiles. Empty fields match all. */
export class EnrollmentProfileQuery {
  country: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentProfile): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentProfile[]): EnrollmentProfile[] {
    const matched = collections.filter(items, (candidate: EnrollmentProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentProfiles(store: EnrollmentProfileStore, query: EnrollmentProfileQuery): EnrollmentProfile[] {
  return query.apply(store.list());
}
