import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBranchPolicy } from "./global-branch-policy.js";

/** Keeps global branch policies by code. */
export interface GlobalBranchPolicyStore {
  find(code: string): GlobalBranchPolicy | undefined;
  save(item: GlobalBranchPolicy): void;
  remove(code: string): boolean;
  list(): GlobalBranchPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBranchPolicyStore implements GlobalBranchPolicyStore {
  items: Map<string, GlobalBranchPolicy>;
  order: string[];

  constructor(items: Map<string, GlobalBranchPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBranchPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBranchPolicy): void {
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

  list(): GlobalBranchPolicy[] {
    const out: GlobalBranchPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBranchPolicyStore(): GlobalBranchPolicyStore {
  return new MemoryGlobalBranchPolicyStore(new Map<string, GlobalBranchPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBranchPolicyStore implements GlobalBranchPolicyStore {
  inner: GlobalBranchPolicyStore;
  cache: cache.TtlCache<GlobalBranchPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBranchPolicyStore,
    cacheValue: cache.TtlCache<GlobalBranchPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBranchPolicy | undefined {
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

  save(item: GlobalBranchPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBranchPolicy[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBranchPolicyStore(inner: GlobalBranchPolicyStore, ttl: number, clockValue: clock.Clock): GlobalBranchPolicyStore {
  return new CachedGlobalBranchPolicyStore(inner, cache.newTtlCache<GlobalBranchPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects global branch policies. Empty fields match all. */
export class GlobalBranchPolicyQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBranchPolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBranchPolicy[]): GlobalBranchPolicy[] {
    const matched = collections.filter(items, (candidate: GlobalBranchPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBranchPolicies(store: GlobalBranchPolicyStore, query: GlobalBranchPolicyQuery): GlobalBranchPolicy[] {
  return query.apply(store.list());
}
