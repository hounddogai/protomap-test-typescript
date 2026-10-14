import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictTouchpointPolicy } from "./strict-touchpoint-policy.js";

/** Keeps strict touchpoint policies by code. */
export interface StrictTouchpointPolicyStore {
  find(code: string): StrictTouchpointPolicy | undefined;
  save(item: StrictTouchpointPolicy): void;
  remove(code: string): boolean;
  list(): StrictTouchpointPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictTouchpointPolicyStore implements StrictTouchpointPolicyStore {
  items: Map<string, StrictTouchpointPolicy>;
  order: string[];

  constructor(items: Map<string, StrictTouchpointPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictTouchpointPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictTouchpointPolicy): void {
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

  list(): StrictTouchpointPolicy[] {
    const out: StrictTouchpointPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictTouchpointPolicyStore(): StrictTouchpointPolicyStore {
  return new MemoryStrictTouchpointPolicyStore(new Map<string, StrictTouchpointPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictTouchpointPolicyStore implements StrictTouchpointPolicyStore {
  inner: StrictTouchpointPolicyStore;
  cache: cache.TtlCache<StrictTouchpointPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictTouchpointPolicyStore,
    cacheValue: cache.TtlCache<StrictTouchpointPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictTouchpointPolicy | undefined {
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

  save(item: StrictTouchpointPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictTouchpointPolicy[] {
    return this.inner.list();
  }
}

export function newCachedStrictTouchpointPolicyStore(inner: StrictTouchpointPolicyStore, ttl: number, clockValue: clock.Clock): StrictTouchpointPolicyStore {
  return new CachedStrictTouchpointPolicyStore(
    inner,
    cache.newTtlCache<StrictTouchpointPolicy>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict touchpoint policies. Empty fields match all. */
export class StrictTouchpointPolicyQuery {
  channel: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictTouchpointPolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictTouchpointPolicy[]): StrictTouchpointPolicy[] {
    const matched = collections.filter(items, (candidate: StrictTouchpointPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictTouchpointPolicies(store: StrictTouchpointPolicyStore, query: StrictTouchpointPolicyQuery): StrictTouchpointPolicy[] {
  return query.apply(store.list());
}
