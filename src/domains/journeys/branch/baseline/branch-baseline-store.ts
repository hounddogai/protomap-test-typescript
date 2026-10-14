import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchBaseline } from "./branch-baseline.js";

/** Keeps branch baselines by code. */
export interface BranchBaselineStore {
  find(code: string): BranchBaseline | undefined;
  save(item: BranchBaseline): void;
  remove(code: string): boolean;
  list(): BranchBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchBaselineStore implements BranchBaselineStore {
  items: Map<string, BranchBaseline>;
  order: string[];

  constructor(items: Map<string, BranchBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchBaseline): void {
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

  list(): BranchBaseline[] {
    const out: BranchBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchBaselineStore(): BranchBaselineStore {
  return new MemoryBranchBaselineStore(new Map<string, BranchBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchBaselineStore implements BranchBaselineStore {
  inner: BranchBaselineStore;
  cache: cache.TtlCache<BranchBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchBaselineStore,
    cacheValue: cache.TtlCache<BranchBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchBaseline | undefined {
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

  save(item: BranchBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchBaseline[] {
    return this.inner.list();
  }
}

export function newCachedBranchBaselineStore(inner: BranchBaselineStore, ttl: number, clockValue: clock.Clock): BranchBaselineStore {
  return new CachedBranchBaselineStore(inner, cache.newTtlCache<BranchBaseline>(64, ttl, clockValue), 0, 0);
}

/** Selects branch baselines. Empty fields match all. */
export class BranchBaselineQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchBaseline[]): BranchBaseline[] {
    const matched = collections.filter(items, (candidate: BranchBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchBaselines(store: BranchBaselineStore, query: BranchBaselineQuery): BranchBaseline[] {
  return query.apply(store.list());
}
