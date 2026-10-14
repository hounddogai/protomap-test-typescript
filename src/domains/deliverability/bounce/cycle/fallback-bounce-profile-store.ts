import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBounceProfile } from "./fallback-bounce-profile.js";

/** Keeps fallback bounce profiles by code. */
export interface FallbackBounceProfileStore {
  find(code: string): FallbackBounceProfile | undefined;
  save(item: FallbackBounceProfile): void;
  remove(code: string): boolean;
  list(): FallbackBounceProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBounceProfileStore implements FallbackBounceProfileStore {
  items: Map<string, FallbackBounceProfile>;
  order: string[];

  constructor(items: Map<string, FallbackBounceProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBounceProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBounceProfile): void {
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

  list(): FallbackBounceProfile[] {
    const out: FallbackBounceProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBounceProfileStore(): FallbackBounceProfileStore {
  return new MemoryFallbackBounceProfileStore(new Map<string, FallbackBounceProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBounceProfileStore implements FallbackBounceProfileStore {
  inner: FallbackBounceProfileStore;
  cache: cache.TtlCache<FallbackBounceProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBounceProfileStore,
    cacheValue: cache.TtlCache<FallbackBounceProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBounceProfile | undefined {
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

  save(item: FallbackBounceProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBounceProfile[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBounceProfileStore(inner: FallbackBounceProfileStore, ttl: number, clockValue: clock.Clock): FallbackBounceProfileStore {
  return new CachedFallbackBounceProfileStore(
    inner,
    cache.newTtlCache<FallbackBounceProfile>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback bounce profiles. Empty fields match all. */
export class FallbackBounceProfileQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBounceProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBounceProfile[]): FallbackBounceProfile[] {
    const matched = collections.filter(items, (candidate: FallbackBounceProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBounceProfiles(store: FallbackBounceProfileStore, query: FallbackBounceProfileQuery): FallbackBounceProfile[] {
  return query.apply(store.list());
}
