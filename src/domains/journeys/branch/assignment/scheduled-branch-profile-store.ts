import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledBranchProfile } from "./scheduled-branch-profile.js";

/** Keeps scheduled branch profiles by code. */
export interface ScheduledBranchProfileStore {
  find(code: string): ScheduledBranchProfile | undefined;
  save(item: ScheduledBranchProfile): void;
  remove(code: string): boolean;
  list(): ScheduledBranchProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledBranchProfileStore implements ScheduledBranchProfileStore {
  items: Map<string, ScheduledBranchProfile>;
  order: string[];

  constructor(items: Map<string, ScheduledBranchProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledBranchProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledBranchProfile): void {
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

  list(): ScheduledBranchProfile[] {
    const out: ScheduledBranchProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledBranchProfileStore(): ScheduledBranchProfileStore {
  return new MemoryScheduledBranchProfileStore(new Map<string, ScheduledBranchProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledBranchProfileStore implements ScheduledBranchProfileStore {
  inner: ScheduledBranchProfileStore;
  cache: cache.TtlCache<ScheduledBranchProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledBranchProfileStore,
    cacheValue: cache.TtlCache<ScheduledBranchProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledBranchProfile | undefined {
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

  save(item: ScheduledBranchProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledBranchProfile[] {
    return this.inner.list();
  }
}

export function newCachedScheduledBranchProfileStore(inner: ScheduledBranchProfileStore, ttl: number, clockValue: clock.Clock): ScheduledBranchProfileStore {
  return new CachedScheduledBranchProfileStore(
    inner,
    cache.newTtlCache<ScheduledBranchProfile>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled branch profiles. Empty fields match all. */
export class ScheduledBranchProfileQuery {
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

  matches(item: ScheduledBranchProfile): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledBranchProfile[]): ScheduledBranchProfile[] {
    const matched = collections.filter(items, (candidate: ScheduledBranchProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledBranchProfiles(store: ScheduledBranchProfileStore, query: ScheduledBranchProfileQuery): ScheduledBranchProfile[] {
  return query.apply(store.list());
}
