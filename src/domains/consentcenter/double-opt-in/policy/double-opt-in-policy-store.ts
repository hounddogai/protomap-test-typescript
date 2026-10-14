import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInPolicy } from "./double-opt-in-policy.js";

/** Keeps double opt in policies by code. */
export interface DoubleOptInPolicyStore {
  find(code: string): DoubleOptInPolicy | undefined;
  save(item: DoubleOptInPolicy): void;
  remove(code: string): boolean;
  list(): DoubleOptInPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInPolicyStore implements DoubleOptInPolicyStore {
  items: Map<string, DoubleOptInPolicy>;
  order: string[];

  constructor(items: Map<string, DoubleOptInPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInPolicy): void {
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

  list(): DoubleOptInPolicy[] {
    const out: DoubleOptInPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInPolicyStore(): DoubleOptInPolicyStore {
  return new MemoryDoubleOptInPolicyStore(new Map<string, DoubleOptInPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInPolicyStore implements DoubleOptInPolicyStore {
  inner: DoubleOptInPolicyStore;
  cache: cache.TtlCache<DoubleOptInPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInPolicyStore,
    cacheValue: cache.TtlCache<DoubleOptInPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInPolicy | undefined {
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

  save(item: DoubleOptInPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInPolicy[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInPolicyStore(inner: DoubleOptInPolicyStore, ttl: number, clockValue: clock.Clock): DoubleOptInPolicyStore {
  return new CachedDoubleOptInPolicyStore(inner, cache.newTtlCache<DoubleOptInPolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects double opt in policies. Empty fields match all. */
export class DoubleOptInPolicyQuery {
  country: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInPolicy): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInPolicy[]): DoubleOptInPolicy[] {
    const matched = collections.filter(items, (candidate: DoubleOptInPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInPolicies(store: DoubleOptInPolicyStore, query: DoubleOptInPolicyQuery): DoubleOptInPolicy[] {
  return query.apply(store.list());
}
