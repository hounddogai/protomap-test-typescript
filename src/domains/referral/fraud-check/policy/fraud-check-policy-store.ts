import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckPolicy } from "./fraud-check-policy.js";

/** Keeps fraud check policies by code. */
export interface FraudCheckPolicyStore {
  find(code: string): FraudCheckPolicy | undefined;
  save(item: FraudCheckPolicy): void;
  remove(code: string): boolean;
  list(): FraudCheckPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckPolicyStore implements FraudCheckPolicyStore {
  items: Map<string, FraudCheckPolicy>;
  order: string[];

  constructor(items: Map<string, FraudCheckPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckPolicy): void {
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

  list(): FraudCheckPolicy[] {
    const out: FraudCheckPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckPolicyStore(): FraudCheckPolicyStore {
  return new MemoryFraudCheckPolicyStore(new Map<string, FraudCheckPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckPolicyStore implements FraudCheckPolicyStore {
  inner: FraudCheckPolicyStore;
  cache: cache.TtlCache<FraudCheckPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckPolicyStore,
    cacheValue: cache.TtlCache<FraudCheckPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckPolicy | undefined {
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

  save(item: FraudCheckPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckPolicy[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckPolicyStore(inner: FraudCheckPolicyStore, ttl: number, clockValue: clock.Clock): FraudCheckPolicyStore {
  return new CachedFraudCheckPolicyStore(inner, cache.newTtlCache<FraudCheckPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects fraud check policies. Empty fields match all. */
export class FraudCheckPolicyQuery {
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

  matches(item: FraudCheckPolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckPolicy[]): FraudCheckPolicy[] {
    const matched = collections.filter(items, (candidate: FraudCheckPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckPolicies(store: FraudCheckPolicyStore, query: FraudCheckPolicyQuery): FraudCheckPolicy[] {
  return query.apply(store.list());
}
