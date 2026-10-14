import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchPolicy } from "./branch-policy.js";

/** Keeps branch policies by code. */
export interface BranchPolicyStore {
  find(code: string): BranchPolicy | undefined;
  save(item: BranchPolicy): void;
  remove(code: string): boolean;
  list(): BranchPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchPolicyStore implements BranchPolicyStore {
  items: Map<string, BranchPolicy>;
  order: string[];

  constructor(items: Map<string, BranchPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchPolicy): void {
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

  list(): BranchPolicy[] {
    const out: BranchPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchPolicyStore(): BranchPolicyStore {
  return new MemoryBranchPolicyStore(new Map<string, BranchPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchPolicyStore implements BranchPolicyStore {
  inner: BranchPolicyStore;
  cache: cache.TtlCache<BranchPolicy>;
  hits: number;
  misses: number;

  constructor(inner: BranchPolicyStore, cacheValue: cache.TtlCache<BranchPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchPolicy | undefined {
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

  save(item: BranchPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchPolicy[] {
    return this.inner.list();
  }
}

export function newCachedBranchPolicyStore(inner: BranchPolicyStore, ttl: number, clockValue: clock.Clock): BranchPolicyStore {
  return new CachedBranchPolicyStore(inner, cache.newTtlCache<BranchPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects branch policies. Empty fields match all. */
export class BranchPolicyQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchPolicy[]): BranchPolicy[] {
    const matched = collections.filter(items, (candidate: BranchPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchPolicies(store: BranchPolicyStore, query: BranchPolicyQuery): BranchPolicy[] {
  return query.apply(store.list());
}
