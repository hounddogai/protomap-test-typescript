import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictTierPolicy } from "./strict-tier-policy.js";

/** Keeps strict tier policies by code. */
export interface StrictTierPolicyStore {
  find(code: string): StrictTierPolicy | undefined;
  save(item: StrictTierPolicy): void;
  remove(code: string): boolean;
  list(): StrictTierPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictTierPolicyStore implements StrictTierPolicyStore {
  items: Map<string, StrictTierPolicy>;
  order: string[];

  constructor(items: Map<string, StrictTierPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictTierPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictTierPolicy): void {
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

  list(): StrictTierPolicy[] {
    const out: StrictTierPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictTierPolicyStore(): StrictTierPolicyStore {
  return new MemoryStrictTierPolicyStore(new Map<string, StrictTierPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictTierPolicyStore implements StrictTierPolicyStore {
  inner: StrictTierPolicyStore;
  cache: cache.TtlCache<StrictTierPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictTierPolicyStore,
    cacheValue: cache.TtlCache<StrictTierPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictTierPolicy | undefined {
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

  save(item: StrictTierPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictTierPolicy[] {
    return this.inner.list();
  }
}

export function newCachedStrictTierPolicyStore(inner: StrictTierPolicyStore, ttl: number, clockValue: clock.Clock): StrictTierPolicyStore {
  return new CachedStrictTierPolicyStore(inner, cache.newTtlCache<StrictTierPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects strict tier policies. Empty fields match all. */
export class StrictTierPolicyQuery {
  category: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFloorValue: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictTierPolicy): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictTierPolicy[]): StrictTierPolicy[] {
    const matched = collections.filter(items, (candidate: StrictTierPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictTierPolicies(store: StrictTierPolicyStore, query: StrictTierPolicyQuery): StrictTierPolicy[] {
  return query.apply(store.list());
}
