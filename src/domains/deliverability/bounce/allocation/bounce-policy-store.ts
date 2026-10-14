import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BouncePolicy } from "./bounce-policy.js";

/** Keeps bounce policies by code. */
export interface BouncePolicyStore {
  find(code: string): BouncePolicy | undefined;
  save(item: BouncePolicy): void;
  remove(code: string): boolean;
  list(): BouncePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBouncePolicyStore implements BouncePolicyStore {
  items: Map<string, BouncePolicy>;
  order: string[];

  constructor(items: Map<string, BouncePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BouncePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BouncePolicy): void {
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

  list(): BouncePolicy[] {
    const out: BouncePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBouncePolicyStore(): BouncePolicyStore {
  return new MemoryBouncePolicyStore(new Map<string, BouncePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBouncePolicyStore implements BouncePolicyStore {
  inner: BouncePolicyStore;
  cache: cache.TtlCache<BouncePolicy>;
  hits: number;
  misses: number;

  constructor(inner: BouncePolicyStore, cacheValue: cache.TtlCache<BouncePolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BouncePolicy | undefined {
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

  save(item: BouncePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BouncePolicy[] {
    return this.inner.list();
  }
}

export function newCachedBouncePolicyStore(inner: BouncePolicyStore, ttl: number, clockValue: clock.Clock): BouncePolicyStore {
  return new CachedBouncePolicyStore(inner, cache.newTtlCache<BouncePolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects bounce policies. Empty fields match all. */
export class BouncePolicyQuery {
  segment: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minImpressions: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BouncePolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BouncePolicy[]): BouncePolicy[] {
    const matched = collections.filter(items, (candidate: BouncePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBouncePolicies(store: BouncePolicyStore, query: BouncePolicyQuery): BouncePolicy[] {
  return query.apply(store.list());
}
