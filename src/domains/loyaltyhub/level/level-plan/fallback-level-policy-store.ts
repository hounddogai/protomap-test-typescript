import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackLevelPolicy } from "./fallback-level-policy.js";

/** Keeps fallback level policies by code. */
export interface FallbackLevelPolicyStore {
  find(code: string): FallbackLevelPolicy | undefined;
  save(item: FallbackLevelPolicy): void;
  remove(code: string): boolean;
  list(): FallbackLevelPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackLevelPolicyStore implements FallbackLevelPolicyStore {
  items: Map<string, FallbackLevelPolicy>;
  order: string[];

  constructor(items: Map<string, FallbackLevelPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackLevelPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackLevelPolicy): void {
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

  list(): FallbackLevelPolicy[] {
    const out: FallbackLevelPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackLevelPolicyStore(): FallbackLevelPolicyStore {
  return new MemoryFallbackLevelPolicyStore(new Map<string, FallbackLevelPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackLevelPolicyStore implements FallbackLevelPolicyStore {
  inner: FallbackLevelPolicyStore;
  cache: cache.TtlCache<FallbackLevelPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackLevelPolicyStore,
    cacheValue: cache.TtlCache<FallbackLevelPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackLevelPolicy | undefined {
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

  save(item: FallbackLevelPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackLevelPolicy[] {
    return this.inner.list();
  }
}

export function newCachedFallbackLevelPolicyStore(inner: FallbackLevelPolicyStore, ttl: number, clockValue: clock.Clock): FallbackLevelPolicyStore {
  return new CachedFallbackLevelPolicyStore(inner, cache.newTtlCache<FallbackLevelPolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects fallback level policies. Empty fields match all. */
export class FallbackLevelPolicyQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackLevelPolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackLevelPolicy[]): FallbackLevelPolicy[] {
    const matched = collections.filter(items, (candidate: FallbackLevelPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackLevelPolicies(store: FallbackLevelPolicyStore, query: FallbackLevelPolicyQuery): FallbackLevelPolicy[] {
  return query.apply(store.list());
}
