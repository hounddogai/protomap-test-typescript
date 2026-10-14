import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackDomainPolicy } from "./fallback-domain-policy.js";

/** Keeps fallback domain policies by code. */
export interface FallbackDomainPolicyStore {
  find(code: string): FallbackDomainPolicy | undefined;
  save(item: FallbackDomainPolicy): void;
  remove(code: string): boolean;
  list(): FallbackDomainPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackDomainPolicyStore implements FallbackDomainPolicyStore {
  items: Map<string, FallbackDomainPolicy>;
  order: string[];

  constructor(items: Map<string, FallbackDomainPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackDomainPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackDomainPolicy): void {
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

  list(): FallbackDomainPolicy[] {
    const out: FallbackDomainPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackDomainPolicyStore(): FallbackDomainPolicyStore {
  return new MemoryFallbackDomainPolicyStore(new Map<string, FallbackDomainPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackDomainPolicyStore implements FallbackDomainPolicyStore {
  inner: FallbackDomainPolicyStore;
  cache: cache.TtlCache<FallbackDomainPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackDomainPolicyStore,
    cacheValue: cache.TtlCache<FallbackDomainPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackDomainPolicy | undefined {
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

  save(item: FallbackDomainPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackDomainPolicy[] {
    return this.inner.list();
  }
}

export function newCachedFallbackDomainPolicyStore(inner: FallbackDomainPolicyStore, ttl: number, clockValue: clock.Clock): FallbackDomainPolicyStore {
  return new CachedFallbackDomainPolicyStore(
    inner,
    cache.newTtlCache<FallbackDomainPolicy>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback domain policies. Empty fields match all. */
export class FallbackDomainPolicyQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackDomainPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackDomainPolicy[]): FallbackDomainPolicy[] {
    const matched = collections.filter(items, (candidate: FallbackDomainPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackDomainPolicies(store: FallbackDomainPolicyStore, query: FallbackDomainPolicyQuery): FallbackDomainPolicy[] {
  return query.apply(store.list());
}
