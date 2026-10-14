import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBranchBaseline } from "./pending-branch-baseline.js";

/** Keeps pending branch baselines by code. */
export interface PendingBranchBaselineStore {
  find(code: string): PendingBranchBaseline | undefined;
  save(item: PendingBranchBaseline): void;
  remove(code: string): boolean;
  list(): PendingBranchBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBranchBaselineStore implements PendingBranchBaselineStore {
  items: Map<string, PendingBranchBaseline>;
  order: string[];

  constructor(items: Map<string, PendingBranchBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBranchBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBranchBaseline): void {
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

  list(): PendingBranchBaseline[] {
    const out: PendingBranchBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBranchBaselineStore(): PendingBranchBaselineStore {
  return new MemoryPendingBranchBaselineStore(new Map<string, PendingBranchBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBranchBaselineStore implements PendingBranchBaselineStore {
  inner: PendingBranchBaselineStore;
  cache: cache.TtlCache<PendingBranchBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBranchBaselineStore,
    cacheValue: cache.TtlCache<PendingBranchBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBranchBaseline | undefined {
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

  save(item: PendingBranchBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBranchBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPendingBranchBaselineStore(inner: PendingBranchBaselineStore, ttl: number, clockValue: clock.Clock): PendingBranchBaselineStore {
  return new CachedPendingBranchBaselineStore(
    inner,
    cache.newTtlCache<PendingBranchBaseline>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending branch baselines. Empty fields match all. */
export class PendingBranchBaselineQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBranchBaseline): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBranchBaseline[]): PendingBranchBaseline[] {
    const matched = collections.filter(items, (candidate: PendingBranchBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBranchBaselines(store: PendingBranchBaselineStore, query: PendingBranchBaselineQuery): PendingBranchBaseline[] {
  return query.apply(store.list());
}
