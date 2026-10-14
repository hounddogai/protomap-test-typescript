import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCsatPolicy } from "./strict-csat-policy.js";

/** Keeps strict csat policies by code. */
export interface StrictCsatPolicyStore {
  find(code: string): StrictCsatPolicy | undefined;
  save(item: StrictCsatPolicy): void;
  remove(code: string): boolean;
  list(): StrictCsatPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCsatPolicyStore implements StrictCsatPolicyStore {
  items: Map<string, StrictCsatPolicy>;
  order: string[];

  constructor(items: Map<string, StrictCsatPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCsatPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCsatPolicy): void {
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

  list(): StrictCsatPolicy[] {
    const out: StrictCsatPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCsatPolicyStore(): StrictCsatPolicyStore {
  return new MemoryStrictCsatPolicyStore(new Map<string, StrictCsatPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCsatPolicyStore implements StrictCsatPolicyStore {
  inner: StrictCsatPolicyStore;
  cache: cache.TtlCache<StrictCsatPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCsatPolicyStore,
    cacheValue: cache.TtlCache<StrictCsatPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCsatPolicy | undefined {
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

  save(item: StrictCsatPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCsatPolicy[] {
    return this.inner.list();
  }
}

export function newCachedStrictCsatPolicyStore(inner: StrictCsatPolicyStore, ttl: number, clockValue: clock.Clock): StrictCsatPolicyStore {
  return new CachedStrictCsatPolicyStore(inner, cache.newTtlCache<StrictCsatPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict csat policies. Empty fields match all. */
export class StrictCsatPolicyQuery {
  segment: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minDiscount: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCsatPolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCsatPolicy[]): StrictCsatPolicy[] {
    const matched = collections.filter(items, (candidate: StrictCsatPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCsatPolicies(store: StrictCsatPolicyStore, query: StrictCsatPolicyQuery): StrictCsatPolicy[] {
  return query.apply(store.list());
}
