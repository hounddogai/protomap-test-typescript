import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutPolicy } from "./opt-out-policy.js";

/** Keeps opt out policies by code. */
export interface OptOutPolicyStore {
  find(code: string): OptOutPolicy | undefined;
  save(item: OptOutPolicy): void;
  remove(code: string): boolean;
  list(): OptOutPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutPolicyStore implements OptOutPolicyStore {
  items: Map<string, OptOutPolicy>;
  order: string[];

  constructor(items: Map<string, OptOutPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutPolicy): void {
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

  list(): OptOutPolicy[] {
    const out: OptOutPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutPolicyStore(): OptOutPolicyStore {
  return new MemoryOptOutPolicyStore(new Map<string, OptOutPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutPolicyStore implements OptOutPolicyStore {
  inner: OptOutPolicyStore;
  cache: cache.TtlCache<OptOutPolicy>;
  hits: number;
  misses: number;

  constructor(inner: OptOutPolicyStore, cacheValue: cache.TtlCache<OptOutPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutPolicy | undefined {
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

  save(item: OptOutPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutPolicy[] {
    return this.inner.list();
  }
}

export function newCachedOptOutPolicyStore(inner: OptOutPolicyStore, ttl: number, clockValue: clock.Clock): OptOutPolicyStore {
  return new CachedOptOutPolicyStore(inner, cache.newTtlCache<OptOutPolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects opt out policies. Empty fields match all. */
export class OptOutPolicyQuery {
  category: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutPolicy): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutPolicy[]): OptOutPolicy[] {
    const matched = collections.filter(items, (candidate: OptOutPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutPolicies(store: OptOutPolicyStore, query: OptOutPolicyQuery): OptOutPolicy[] {
  return query.apply(store.list());
}
