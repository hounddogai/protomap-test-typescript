import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionProfile } from "./subscription-profile.js";

/** Keeps subscription profiles by code. */
export interface SubscriptionProfileStore {
  find(code: string): SubscriptionProfile | undefined;
  save(item: SubscriptionProfile): void;
  remove(code: string): boolean;
  list(): SubscriptionProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionProfileStore implements SubscriptionProfileStore {
  items: Map<string, SubscriptionProfile>;
  order: string[];

  constructor(items: Map<string, SubscriptionProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionProfile): void {
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

  list(): SubscriptionProfile[] {
    const out: SubscriptionProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionProfileStore(): SubscriptionProfileStore {
  return new MemorySubscriptionProfileStore(new Map<string, SubscriptionProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionProfileStore implements SubscriptionProfileStore {
  inner: SubscriptionProfileStore;
  cache: cache.TtlCache<SubscriptionProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionProfileStore,
    cacheValue: cache.TtlCache<SubscriptionProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionProfile | undefined {
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

  save(item: SubscriptionProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionProfile[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionProfileStore(inner: SubscriptionProfileStore, ttl: number, clockValue: clock.Clock): SubscriptionProfileStore {
  return new CachedSubscriptionProfileStore(inner, cache.newTtlCache<SubscriptionProfile>(512, ttl, clockValue), 0, 0);
}

/** Selects subscription profiles. Empty fields match all. */
export class SubscriptionProfileQuery {
  unit: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minScore: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionProfile): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionProfile[]): SubscriptionProfile[] {
    const matched = collections.filter(items, (candidate: SubscriptionProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionProfiles(store: SubscriptionProfileStore, query: SubscriptionProfileQuery): SubscriptionProfile[] {
  return query.apply(store.list());
}
