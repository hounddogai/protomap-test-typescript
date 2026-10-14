import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditPolicy } from "./credit-policy.js";

/** Keeps credit policies by code. */
export interface CreditPolicyStore {
  find(code: string): CreditPolicy | undefined;
  save(item: CreditPolicy): void;
  remove(code: string): boolean;
  list(): CreditPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditPolicyStore implements CreditPolicyStore {
  items: Map<string, CreditPolicy>;
  order: string[];

  constructor(items: Map<string, CreditPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditPolicy): void {
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

  list(): CreditPolicy[] {
    const out: CreditPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditPolicyStore(): CreditPolicyStore {
  return new MemoryCreditPolicyStore(new Map<string, CreditPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditPolicyStore implements CreditPolicyStore {
  inner: CreditPolicyStore;
  cache: cache.TtlCache<CreditPolicy>;
  hits: number;
  misses: number;

  constructor(inner: CreditPolicyStore, cacheValue: cache.TtlCache<CreditPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditPolicy | undefined {
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

  save(item: CreditPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditPolicy[] {
    return this.inner.list();
  }
}

export function newCachedCreditPolicyStore(inner: CreditPolicyStore, ttl: number, clockValue: clock.Clock): CreditPolicyStore {
  return new CachedCreditPolicyStore(inner, cache.newTtlCache<CreditPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects credit policies. Empty fields match all. */
export class CreditPolicyQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditPolicy[]): CreditPolicy[] {
    const matched = collections.filter(items, (candidate: CreditPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditPolicies(store: CreditPolicyStore, query: CreditPolicyQuery): CreditPolicy[] {
  return query.apply(store.list());
}
