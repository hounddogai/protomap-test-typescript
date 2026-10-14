import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceProfile } from "./bounce-profile.js";

/** Keeps bounce profiles by code. */
export interface BounceProfileStore {
  find(code: string): BounceProfile | undefined;
  save(item: BounceProfile): void;
  remove(code: string): boolean;
  list(): BounceProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceProfileStore implements BounceProfileStore {
  items: Map<string, BounceProfile>;
  order: string[];

  constructor(items: Map<string, BounceProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceProfile): void {
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

  list(): BounceProfile[] {
    const out: BounceProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceProfileStore(): BounceProfileStore {
  return new MemoryBounceProfileStore(new Map<string, BounceProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceProfileStore implements BounceProfileStore {
  inner: BounceProfileStore;
  cache: cache.TtlCache<BounceProfile>;
  hits: number;
  misses: number;

  constructor(inner: BounceProfileStore, cacheValue: cache.TtlCache<BounceProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceProfile | undefined {
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

  save(item: BounceProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceProfile[] {
    return this.inner.list();
  }
}

export function newCachedBounceProfileStore(inner: BounceProfileStore, ttl: number, clockValue: clock.Clock): BounceProfileStore {
  return new CachedBounceProfileStore(inner, cache.newTtlCache<BounceProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects bounce profiles. Empty fields match all. */
export class BounceProfileQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceProfile): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceProfile[]): BounceProfile[] {
    const matched = collections.filter(items, (candidate: BounceProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceProfiles(store: BounceProfileStore, query: BounceProfileQuery): BounceProfile[] {
  return query.apply(store.list());
}
