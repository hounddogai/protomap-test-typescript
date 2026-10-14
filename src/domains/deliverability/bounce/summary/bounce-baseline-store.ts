import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceBaseline } from "./bounce-baseline.js";

/** Keeps bounce baselines by code. */
export interface BounceBaselineStore {
  find(code: string): BounceBaseline | undefined;
  save(item: BounceBaseline): void;
  remove(code: string): boolean;
  list(): BounceBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceBaselineStore implements BounceBaselineStore {
  items: Map<string, BounceBaseline>;
  order: string[];

  constructor(items: Map<string, BounceBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceBaseline): void {
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

  list(): BounceBaseline[] {
    const out: BounceBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceBaselineStore(): BounceBaselineStore {
  return new MemoryBounceBaselineStore(new Map<string, BounceBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceBaselineStore implements BounceBaselineStore {
  inner: BounceBaselineStore;
  cache: cache.TtlCache<BounceBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceBaselineStore,
    cacheValue: cache.TtlCache<BounceBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceBaseline | undefined {
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

  save(item: BounceBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceBaseline[] {
    return this.inner.list();
  }
}

export function newCachedBounceBaselineStore(inner: BounceBaselineStore, ttl: number, clockValue: clock.Clock): BounceBaselineStore {
  return new CachedBounceBaselineStore(inner, cache.newTtlCache<BounceBaseline>(512, ttl, clockValue), 0, 0);
}

/** Selects bounce baselines. Empty fields match all. */
export class BounceBaselineQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceBaseline[]): BounceBaseline[] {
    const matched = collections.filter(items, (candidate: BounceBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceBaselines(store: BounceBaselineStore, query: BounceBaselineQuery): BounceBaseline[] {
  return query.apply(store.list());
}
