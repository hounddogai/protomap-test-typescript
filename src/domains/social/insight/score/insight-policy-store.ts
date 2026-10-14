import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightPolicy } from "./insight-policy.js";

/** Keeps insight policies by code. */
export interface InsightPolicyStore {
  find(code: string): InsightPolicy | undefined;
  save(item: InsightPolicy): void;
  remove(code: string): boolean;
  list(): InsightPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightPolicyStore implements InsightPolicyStore {
  items: Map<string, InsightPolicy>;
  order: string[];

  constructor(items: Map<string, InsightPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightPolicy): void {
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

  list(): InsightPolicy[] {
    const out: InsightPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightPolicyStore(): InsightPolicyStore {
  return new MemoryInsightPolicyStore(new Map<string, InsightPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightPolicyStore implements InsightPolicyStore {
  inner: InsightPolicyStore;
  cache: cache.TtlCache<InsightPolicy>;
  hits: number;
  misses: number;

  constructor(inner: InsightPolicyStore, cacheValue: cache.TtlCache<InsightPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightPolicy | undefined {
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

  save(item: InsightPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightPolicy[] {
    return this.inner.list();
  }
}

export function newCachedInsightPolicyStore(inner: InsightPolicyStore, ttl: number, clockValue: clock.Clock): InsightPolicyStore {
  return new CachedInsightPolicyStore(inner, cache.newTtlCache<InsightPolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects insight policies. Empty fields match all. */
export class InsightPolicyQuery {
  category: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minQuantity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightPolicy): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightPolicy[]): InsightPolicy[] {
    const matched = collections.filter(items, (candidate: InsightPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightPolicies(store: InsightPolicyStore, query: InsightPolicyQuery): InsightPolicy[] {
  return query.apply(store.list());
}
