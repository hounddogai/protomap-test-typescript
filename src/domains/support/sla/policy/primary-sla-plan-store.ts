import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySlaPlan } from "./primary-sla-plan.js";

/** Keeps primary sla plans by code. */
export interface PrimarySlaPlanStore {
  find(code: string): PrimarySlaPlan | undefined;
  save(item: PrimarySlaPlan): void;
  remove(code: string): boolean;
  list(): PrimarySlaPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySlaPlanStore implements PrimarySlaPlanStore {
  items: Map<string, PrimarySlaPlan>;
  order: string[];

  constructor(items: Map<string, PrimarySlaPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySlaPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySlaPlan): void {
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

  list(): PrimarySlaPlan[] {
    const out: PrimarySlaPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySlaPlanStore(): PrimarySlaPlanStore {
  return new MemoryPrimarySlaPlanStore(new Map<string, PrimarySlaPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySlaPlanStore implements PrimarySlaPlanStore {
  inner: PrimarySlaPlanStore;
  cache: cache.TtlCache<PrimarySlaPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySlaPlanStore,
    cacheValue: cache.TtlCache<PrimarySlaPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySlaPlan | undefined {
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

  save(item: PrimarySlaPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySlaPlan[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySlaPlanStore(inner: PrimarySlaPlanStore, ttl: number, clockValue: clock.Clock): PrimarySlaPlanStore {
  return new CachedPrimarySlaPlanStore(inner, cache.newTtlCache<PrimarySlaPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects primary sla plans. Empty fields match all. */
export class PrimarySlaPlanQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySlaPlan): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySlaPlan[]): PrimarySlaPlan[] {
    const matched = collections.filter(items, (candidate: PrimarySlaPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySlaPlans(store: PrimarySlaPlanStore, query: PrimarySlaPlanQuery): PrimarySlaPlan[] {
  return query.apply(store.list());
}
