import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackComplaintPolicy } from "./fallback-complaint-policy.js";

/** Keeps fallback complaint policies by code. */
export interface FallbackComplaintPolicyStore {
  find(code: string): FallbackComplaintPolicy | undefined;
  save(item: FallbackComplaintPolicy): void;
  remove(code: string): boolean;
  list(): FallbackComplaintPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackComplaintPolicyStore implements FallbackComplaintPolicyStore {
  items: Map<string, FallbackComplaintPolicy>;
  order: string[];

  constructor(items: Map<string, FallbackComplaintPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackComplaintPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackComplaintPolicy): void {
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

  list(): FallbackComplaintPolicy[] {
    const out: FallbackComplaintPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackComplaintPolicyStore(): FallbackComplaintPolicyStore {
  return new MemoryFallbackComplaintPolicyStore(new Map<string, FallbackComplaintPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackComplaintPolicyStore implements FallbackComplaintPolicyStore {
  inner: FallbackComplaintPolicyStore;
  cache: cache.TtlCache<FallbackComplaintPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackComplaintPolicyStore,
    cacheValue: cache.TtlCache<FallbackComplaintPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackComplaintPolicy | undefined {
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

  save(item: FallbackComplaintPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackComplaintPolicy[] {
    return this.inner.list();
  }
}

export function newCachedFallbackComplaintPolicyStore(inner: FallbackComplaintPolicyStore, ttl: number, clockValue: clock.Clock): FallbackComplaintPolicyStore {
  return new CachedFallbackComplaintPolicyStore(
    inner,
    cache.newTtlCache<FallbackComplaintPolicy>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback complaint policies. Empty fields match all. */
export class FallbackComplaintPolicyQuery {
  source: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMinimum: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackComplaintPolicy): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackComplaintPolicy[]): FallbackComplaintPolicy[] {
    const matched = collections.filter(items, (candidate: FallbackComplaintPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackComplaintPolicies(store: FallbackComplaintPolicyStore, query: FallbackComplaintPolicyQuery): FallbackComplaintPolicy[] {
  return query.apply(store.list());
}
