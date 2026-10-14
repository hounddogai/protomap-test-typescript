import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryComplaintPolicy } from "./primary-complaint-policy.js";

/** Keeps primary complaint policies by code. */
export interface PrimaryComplaintPolicyStore {
  find(code: string): PrimaryComplaintPolicy | undefined;
  save(item: PrimaryComplaintPolicy): void;
  remove(code: string): boolean;
  list(): PrimaryComplaintPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryComplaintPolicyStore implements PrimaryComplaintPolicyStore {
  items: Map<string, PrimaryComplaintPolicy>;
  order: string[];

  constructor(items: Map<string, PrimaryComplaintPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryComplaintPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryComplaintPolicy): void {
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

  list(): PrimaryComplaintPolicy[] {
    const out: PrimaryComplaintPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryComplaintPolicyStore(): PrimaryComplaintPolicyStore {
  return new MemoryPrimaryComplaintPolicyStore(new Map<string, PrimaryComplaintPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryComplaintPolicyStore implements PrimaryComplaintPolicyStore {
  inner: PrimaryComplaintPolicyStore;
  cache: cache.TtlCache<PrimaryComplaintPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryComplaintPolicyStore,
    cacheValue: cache.TtlCache<PrimaryComplaintPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryComplaintPolicy | undefined {
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

  save(item: PrimaryComplaintPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryComplaintPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryComplaintPolicyStore(inner: PrimaryComplaintPolicyStore, ttl: number, clockValue: clock.Clock): PrimaryComplaintPolicyStore {
  return new CachedPrimaryComplaintPolicyStore(
    inner,
    cache.newTtlCache<PrimaryComplaintPolicy>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary complaint policies. Empty fields match all. */
export class PrimaryComplaintPolicyQuery {
  segment: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryComplaintPolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryComplaintPolicy[]): PrimaryComplaintPolicy[] {
    const matched = collections.filter(items, (candidate: PrimaryComplaintPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryComplaintPolicies(store: PrimaryComplaintPolicyStore, query: PrimaryComplaintPolicyQuery): PrimaryComplaintPolicy[] {
  return query.apply(store.list());
}
