import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionPolicy } from "./suppression-policy.js";

/** Keeps suppression policies by code. */
export interface SuppressionPolicyStore {
  find(code: string): SuppressionPolicy | undefined;
  save(item: SuppressionPolicy): void;
  remove(code: string): boolean;
  list(): SuppressionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionPolicyStore implements SuppressionPolicyStore {
  items: Map<string, SuppressionPolicy>;
  order: string[];

  constructor(items: Map<string, SuppressionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionPolicy): void {
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

  list(): SuppressionPolicy[] {
    const out: SuppressionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionPolicyStore(): SuppressionPolicyStore {
  return new MemorySuppressionPolicyStore(new Map<string, SuppressionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionPolicyStore implements SuppressionPolicyStore {
  inner: SuppressionPolicyStore;
  cache: cache.TtlCache<SuppressionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionPolicyStore,
    cacheValue: cache.TtlCache<SuppressionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionPolicy | undefined {
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

  save(item: SuppressionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionPolicyStore(inner: SuppressionPolicyStore, ttl: number, clockValue: clock.Clock): SuppressionPolicyStore {
  return new CachedSuppressionPolicyStore(inner, cache.newTtlCache<SuppressionPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects suppression policies. Empty fields match all. */
export class SuppressionPolicyQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionPolicy): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionPolicy[]): SuppressionPolicy[] {
    const matched = collections.filter(items, (candidate: SuppressionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionPolicies(store: SuppressionPolicyStore, query: SuppressionPolicyQuery): SuppressionPolicy[] {
  return query.apply(store.list());
}
