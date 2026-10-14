import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryWarmupPolicy } from "./primary-warmup-policy.js";

/** Keeps primary warmup policies by code. */
export interface PrimaryWarmupPolicyStore {
  find(code: string): PrimaryWarmupPolicy | undefined;
  save(item: PrimaryWarmupPolicy): void;
  remove(code: string): boolean;
  list(): PrimaryWarmupPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryWarmupPolicyStore implements PrimaryWarmupPolicyStore {
  items: Map<string, PrimaryWarmupPolicy>;
  order: string[];

  constructor(items: Map<string, PrimaryWarmupPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryWarmupPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryWarmupPolicy): void {
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

  list(): PrimaryWarmupPolicy[] {
    const out: PrimaryWarmupPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryWarmupPolicyStore(): PrimaryWarmupPolicyStore {
  return new MemoryPrimaryWarmupPolicyStore(new Map<string, PrimaryWarmupPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryWarmupPolicyStore implements PrimaryWarmupPolicyStore {
  inner: PrimaryWarmupPolicyStore;
  cache: cache.TtlCache<PrimaryWarmupPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryWarmupPolicyStore,
    cacheValue: cache.TtlCache<PrimaryWarmupPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryWarmupPolicy | undefined {
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

  save(item: PrimaryWarmupPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryWarmupPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryWarmupPolicyStore(inner: PrimaryWarmupPolicyStore, ttl: number, clockValue: clock.Clock): PrimaryWarmupPolicyStore {
  return new CachedPrimaryWarmupPolicyStore(inner, cache.newTtlCache<PrimaryWarmupPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary warmup policies. Empty fields match all. */
export class PrimaryWarmupPolicyQuery {
  country: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minWeight: number, statuses: string[], limit: number) {
    this.country = country;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryWarmupPolicy): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryWarmupPolicy[]): PrimaryWarmupPolicy[] {
    const matched = collections.filter(items, (candidate: PrimaryWarmupPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryWarmupPolicies(store: PrimaryWarmupPolicyStore, query: PrimaryWarmupPolicyQuery): PrimaryWarmupPolicy[] {
  return query.apply(store.list());
}
