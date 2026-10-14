import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingCsatPolicy } from "./pending-csat-policy.js";

/** Keeps pending csat policies by code. */
export interface PendingCsatPolicyStore {
  find(code: string): PendingCsatPolicy | undefined;
  save(item: PendingCsatPolicy): void;
  remove(code: string): boolean;
  list(): PendingCsatPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingCsatPolicyStore implements PendingCsatPolicyStore {
  items: Map<string, PendingCsatPolicy>;
  order: string[];

  constructor(items: Map<string, PendingCsatPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingCsatPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingCsatPolicy): void {
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

  list(): PendingCsatPolicy[] {
    const out: PendingCsatPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingCsatPolicyStore(): PendingCsatPolicyStore {
  return new MemoryPendingCsatPolicyStore(new Map<string, PendingCsatPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingCsatPolicyStore implements PendingCsatPolicyStore {
  inner: PendingCsatPolicyStore;
  cache: cache.TtlCache<PendingCsatPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingCsatPolicyStore,
    cacheValue: cache.TtlCache<PendingCsatPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingCsatPolicy | undefined {
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

  save(item: PendingCsatPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingCsatPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPendingCsatPolicyStore(inner: PendingCsatPolicyStore, ttl: number, clockValue: clock.Clock): PendingCsatPolicyStore {
  return new CachedPendingCsatPolicyStore(inner, cache.newTtlCache<PendingCsatPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects pending csat policies. Empty fields match all. */
export class PendingCsatPolicyQuery {
  segment: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBudget: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingCsatPolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingCsatPolicy[]): PendingCsatPolicy[] {
    const matched = collections.filter(items, (candidate: PendingCsatPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingCsatPolicies(store: PendingCsatPolicyStore, query: PendingCsatPolicyQuery): PendingCsatPolicy[] {
  return query.apply(store.list());
}
