import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckProfile } from "./fraud-check-profile.js";

/** Keeps fraud check profiles by code. */
export interface FraudCheckProfileStore {
  find(code: string): FraudCheckProfile | undefined;
  save(item: FraudCheckProfile): void;
  remove(code: string): boolean;
  list(): FraudCheckProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckProfileStore implements FraudCheckProfileStore {
  items: Map<string, FraudCheckProfile>;
  order: string[];

  constructor(items: Map<string, FraudCheckProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckProfile): void {
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

  list(): FraudCheckProfile[] {
    const out: FraudCheckProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckProfileStore(): FraudCheckProfileStore {
  return new MemoryFraudCheckProfileStore(new Map<string, FraudCheckProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckProfileStore implements FraudCheckProfileStore {
  inner: FraudCheckProfileStore;
  cache: cache.TtlCache<FraudCheckProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckProfileStore,
    cacheValue: cache.TtlCache<FraudCheckProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckProfile | undefined {
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

  save(item: FraudCheckProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckProfile[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckProfileStore(inner: FraudCheckProfileStore, ttl: number, clockValue: clock.Clock): FraudCheckProfileStore {
  return new CachedFraudCheckProfileStore(inner, cache.newTtlCache<FraudCheckProfile>(512, ttl, clockValue), 0, 0);
}

/** Selects fraud check profiles. Empty fields match all. */
export class FraudCheckProfileQuery {
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

  matches(item: FraudCheckProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckProfile[]): FraudCheckProfile[] {
    const matched = collections.filter(items, (candidate: FraudCheckProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckProfiles(store: FraudCheckProfileStore, query: FraudCheckProfileQuery): FraudCheckProfile[] {
  return query.apply(store.list());
}
