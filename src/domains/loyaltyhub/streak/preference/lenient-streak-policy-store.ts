import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientStreakPolicy } from "./lenient-streak-policy.js";

/** Keeps lenient streak policies by code. */
export interface LenientStreakPolicyStore {
  find(code: string): LenientStreakPolicy | undefined;
  save(item: LenientStreakPolicy): void;
  remove(code: string): boolean;
  list(): LenientStreakPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientStreakPolicyStore implements LenientStreakPolicyStore {
  items: Map<string, LenientStreakPolicy>;
  order: string[];

  constructor(items: Map<string, LenientStreakPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientStreakPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientStreakPolicy): void {
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

  list(): LenientStreakPolicy[] {
    const out: LenientStreakPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientStreakPolicyStore(): LenientStreakPolicyStore {
  return new MemoryLenientStreakPolicyStore(new Map<string, LenientStreakPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientStreakPolicyStore implements LenientStreakPolicyStore {
  inner: LenientStreakPolicyStore;
  cache: cache.TtlCache<LenientStreakPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientStreakPolicyStore,
    cacheValue: cache.TtlCache<LenientStreakPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientStreakPolicy | undefined {
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

  save(item: LenientStreakPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientStreakPolicy[] {
    return this.inner.list();
  }
}

export function newCachedLenientStreakPolicyStore(inner: LenientStreakPolicyStore, ttl: number, clockValue: clock.Clock): LenientStreakPolicyStore {
  return new CachedLenientStreakPolicyStore(inner, cache.newTtlCache<LenientStreakPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient streak policies. Empty fields match all. */
export class LenientStreakPolicyQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientStreakPolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientStreakPolicy[]): LenientStreakPolicy[] {
    const matched = collections.filter(items, (candidate: LenientStreakPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientStreakPolicies(store: LenientStreakPolicyStore, query: LenientStreakPolicyQuery): LenientStreakPolicy[] {
  return query.apply(store.list());
}
