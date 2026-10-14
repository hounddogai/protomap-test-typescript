import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTouchpointPolicy } from "./manual-touchpoint-policy.js";

/** Keeps manual touchpoint policies by code. */
export interface ManualTouchpointPolicyStore {
  find(code: string): ManualTouchpointPolicy | undefined;
  save(item: ManualTouchpointPolicy): void;
  remove(code: string): boolean;
  list(): ManualTouchpointPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTouchpointPolicyStore implements ManualTouchpointPolicyStore {
  items: Map<string, ManualTouchpointPolicy>;
  order: string[];

  constructor(items: Map<string, ManualTouchpointPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTouchpointPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTouchpointPolicy): void {
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

  list(): ManualTouchpointPolicy[] {
    const out: ManualTouchpointPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTouchpointPolicyStore(): ManualTouchpointPolicyStore {
  return new MemoryManualTouchpointPolicyStore(new Map<string, ManualTouchpointPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTouchpointPolicyStore implements ManualTouchpointPolicyStore {
  inner: ManualTouchpointPolicyStore;
  cache: cache.TtlCache<ManualTouchpointPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTouchpointPolicyStore,
    cacheValue: cache.TtlCache<ManualTouchpointPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTouchpointPolicy | undefined {
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

  save(item: ManualTouchpointPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTouchpointPolicy[] {
    return this.inner.list();
  }
}

export function newCachedManualTouchpointPolicyStore(inner: ManualTouchpointPolicyStore, ttl: number, clockValue: clock.Clock): ManualTouchpointPolicyStore {
  return new CachedManualTouchpointPolicyStore(
    inner,
    cache.newTtlCache<ManualTouchpointPolicy>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual touchpoint policies. Empty fields match all. */
export class ManualTouchpointPolicyQuery {
  segment: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minEndsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTouchpointPolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTouchpointPolicy[]): ManualTouchpointPolicy[] {
    const matched = collections.filter(items, (candidate: ManualTouchpointPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTouchpointPolicies(store: ManualTouchpointPolicyStore, query: ManualTouchpointPolicyQuery): ManualTouchpointPolicy[] {
  return query.apply(store.list());
}
