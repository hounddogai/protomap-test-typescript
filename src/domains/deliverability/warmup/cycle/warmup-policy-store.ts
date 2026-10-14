import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupPolicy } from "./warmup-policy.js";

/** Keeps warmup policies by code. */
export interface WarmupPolicyStore {
  find(code: string): WarmupPolicy | undefined;
  save(item: WarmupPolicy): void;
  remove(code: string): boolean;
  list(): WarmupPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupPolicyStore implements WarmupPolicyStore {
  items: Map<string, WarmupPolicy>;
  order: string[];

  constructor(items: Map<string, WarmupPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupPolicy): void {
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

  list(): WarmupPolicy[] {
    const out: WarmupPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupPolicyStore(): WarmupPolicyStore {
  return new MemoryWarmupPolicyStore(new Map<string, WarmupPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupPolicyStore implements WarmupPolicyStore {
  inner: WarmupPolicyStore;
  cache: cache.TtlCache<WarmupPolicy>;
  hits: number;
  misses: number;

  constructor(inner: WarmupPolicyStore, cacheValue: cache.TtlCache<WarmupPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupPolicy | undefined {
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

  save(item: WarmupPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupPolicy[] {
    return this.inner.list();
  }
}

export function newCachedWarmupPolicyStore(inner: WarmupPolicyStore, ttl: number, clockValue: clock.Clock): WarmupPolicyStore {
  return new CachedWarmupPolicyStore(inner, cache.newTtlCache<WarmupPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects warmup policies. Empty fields match all. */
export class WarmupPolicyQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupPolicy[]): WarmupPolicy[] {
    const matched = collections.filter(items, (candidate: WarmupPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupPolicies(store: WarmupPolicyStore, query: WarmupPolicyQuery): WarmupPolicy[] {
  return query.apply(store.list());
}
