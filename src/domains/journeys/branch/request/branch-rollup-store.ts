import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchRollup } from "./branch-rollup.js";

/** Keeps branch rollups by code. */
export interface BranchRollupStore {
  find(code: string): BranchRollup | undefined;
  save(item: BranchRollup): void;
  remove(code: string): boolean;
  list(): BranchRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchRollupStore implements BranchRollupStore {
  items: Map<string, BranchRollup>;
  order: string[];

  constructor(items: Map<string, BranchRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchRollup): void {
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

  list(): BranchRollup[] {
    const out: BranchRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchRollupStore(): BranchRollupStore {
  return new MemoryBranchRollupStore(new Map<string, BranchRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchRollupStore implements BranchRollupStore {
  inner: BranchRollupStore;
  cache: cache.TtlCache<BranchRollup>;
  hits: number;
  misses: number;

  constructor(inner: BranchRollupStore, cacheValue: cache.TtlCache<BranchRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchRollup | undefined {
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

  save(item: BranchRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchRollup[] {
    return this.inner.list();
  }
}

export function newCachedBranchRollupStore(inner: BranchRollupStore, ttl: number, clockValue: clock.Clock): BranchRollupStore {
  return new CachedBranchRollupStore(inner, cache.newTtlCache<BranchRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects branch rollups. Empty fields match all. */
export class BranchRollupQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchRollup): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchRollup[]): BranchRollup[] {
    const matched = collections.filter(items, (candidate: BranchRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchRollups(store: BranchRollupStore, query: BranchRollupQuery): BranchRollup[] {
  return query.apply(store.list());
}
