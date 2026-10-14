import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakPolicy } from "./streak-policy.js";

/** Keeps streak policies by code. */
export interface StreakPolicyStore {
  find(code: string): StreakPolicy | undefined;
  save(item: StreakPolicy): void;
  remove(code: string): boolean;
  list(): StreakPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakPolicyStore implements StreakPolicyStore {
  items: Map<string, StreakPolicy>;
  order: string[];

  constructor(items: Map<string, StreakPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakPolicy): void {
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

  list(): StreakPolicy[] {
    const out: StreakPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakPolicyStore(): StreakPolicyStore {
  return new MemoryStreakPolicyStore(new Map<string, StreakPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakPolicyStore implements StreakPolicyStore {
  inner: StreakPolicyStore;
  cache: cache.TtlCache<StreakPolicy>;
  hits: number;
  misses: number;

  constructor(inner: StreakPolicyStore, cacheValue: cache.TtlCache<StreakPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakPolicy | undefined {
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

  save(item: StreakPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakPolicy[] {
    return this.inner.list();
  }
}

export function newCachedStreakPolicyStore(inner: StreakPolicyStore, ttl: number, clockValue: clock.Clock): StreakPolicyStore {
  return new CachedStreakPolicyStore(inner, cache.newTtlCache<StreakPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects streak policies. Empty fields match all. */
export class StreakPolicyQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakPolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakPolicy[]): StreakPolicy[] {
    const matched = collections.filter(items, (candidate: StreakPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakPolicies(store: StreakPolicyStore, query: StreakPolicyQuery): StreakPolicy[] {
  return query.apply(store.list());
}
