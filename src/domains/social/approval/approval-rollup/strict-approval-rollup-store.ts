import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictApprovalRollup } from "./strict-approval-rollup.js";

/** Keeps strict approval rollups by code. */
export interface StrictApprovalRollupStore {
  find(code: string): StrictApprovalRollup | undefined;
  save(item: StrictApprovalRollup): void;
  remove(code: string): boolean;
  list(): StrictApprovalRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictApprovalRollupStore implements StrictApprovalRollupStore {
  items: Map<string, StrictApprovalRollup>;
  order: string[];

  constructor(items: Map<string, StrictApprovalRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictApprovalRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictApprovalRollup): void {
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

  list(): StrictApprovalRollup[] {
    const out: StrictApprovalRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictApprovalRollupStore(): StrictApprovalRollupStore {
  return new MemoryStrictApprovalRollupStore(new Map<string, StrictApprovalRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictApprovalRollupStore implements StrictApprovalRollupStore {
  inner: StrictApprovalRollupStore;
  cache: cache.TtlCache<StrictApprovalRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictApprovalRollupStore,
    cacheValue: cache.TtlCache<StrictApprovalRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictApprovalRollup | undefined {
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

  save(item: StrictApprovalRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictApprovalRollup[] {
    return this.inner.list();
  }
}

export function newCachedStrictApprovalRollupStore(inner: StrictApprovalRollupStore, ttl: number, clockValue: clock.Clock): StrictApprovalRollupStore {
  return new CachedStrictApprovalRollupStore(
    inner,
    cache.newTtlCache<StrictApprovalRollup>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict approval rollups. Empty fields match all. */
export class StrictApprovalRollupQuery {
  category: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictApprovalRollup): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictApprovalRollup[]): StrictApprovalRollup[] {
    const matched = collections.filter(items, (candidate: StrictApprovalRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictApprovalRollups(store: StrictApprovalRollupStore, query: StrictApprovalRollupQuery): StrictApprovalRollup[] {
  return query.apply(store.list());
}
