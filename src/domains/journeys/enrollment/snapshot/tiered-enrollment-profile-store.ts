import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredEnrollmentProfile } from "./tiered-enrollment-profile.js";

/** Keeps tiered enrollment profiles by code. */
export interface TieredEnrollmentProfileStore {
  find(code: string): TieredEnrollmentProfile | undefined;
  save(item: TieredEnrollmentProfile): void;
  remove(code: string): boolean;
  list(): TieredEnrollmentProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredEnrollmentProfileStore implements TieredEnrollmentProfileStore {
  items: Map<string, TieredEnrollmentProfile>;
  order: string[];

  constructor(items: Map<string, TieredEnrollmentProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredEnrollmentProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredEnrollmentProfile): void {
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

  list(): TieredEnrollmentProfile[] {
    const out: TieredEnrollmentProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredEnrollmentProfileStore(): TieredEnrollmentProfileStore {
  return new MemoryTieredEnrollmentProfileStore(new Map<string, TieredEnrollmentProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredEnrollmentProfileStore implements TieredEnrollmentProfileStore {
  inner: TieredEnrollmentProfileStore;
  cache: cache.TtlCache<TieredEnrollmentProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredEnrollmentProfileStore,
    cacheValue: cache.TtlCache<TieredEnrollmentProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredEnrollmentProfile | undefined {
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

  save(item: TieredEnrollmentProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredEnrollmentProfile[] {
    return this.inner.list();
  }
}

export function newCachedTieredEnrollmentProfileStore(inner: TieredEnrollmentProfileStore, ttl: number, clockValue: clock.Clock): TieredEnrollmentProfileStore {
  return new CachedTieredEnrollmentProfileStore(
    inner,
    cache.newTtlCache<TieredEnrollmentProfile>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered enrollment profiles. Empty fields match all. */
export class TieredEnrollmentProfileQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredEnrollmentProfile): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredEnrollmentProfile[]): TieredEnrollmentProfile[] {
    const matched = collections.filter(items, (candidate: TieredEnrollmentProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredEnrollmentProfiles(store: TieredEnrollmentProfileStore, query: TieredEnrollmentProfileQuery): TieredEnrollmentProfile[] {
  return query.apply(store.list());
}
