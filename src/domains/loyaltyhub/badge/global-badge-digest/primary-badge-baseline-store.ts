import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryBadgeBaseline } from "./primary-badge-baseline.js";

/** Keeps primary badge baselines by code. */
export interface PrimaryBadgeBaselineStore {
  find(code: string): PrimaryBadgeBaseline | undefined;
  save(item: PrimaryBadgeBaseline): void;
  remove(code: string): boolean;
  list(): PrimaryBadgeBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryBadgeBaselineStore implements PrimaryBadgeBaselineStore {
  items: Map<string, PrimaryBadgeBaseline>;
  order: string[];

  constructor(items: Map<string, PrimaryBadgeBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryBadgeBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryBadgeBaseline): void {
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

  list(): PrimaryBadgeBaseline[] {
    const out: PrimaryBadgeBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryBadgeBaselineStore(): PrimaryBadgeBaselineStore {
  return new MemoryPrimaryBadgeBaselineStore(new Map<string, PrimaryBadgeBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryBadgeBaselineStore implements PrimaryBadgeBaselineStore {
  inner: PrimaryBadgeBaselineStore;
  cache: cache.TtlCache<PrimaryBadgeBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryBadgeBaselineStore,
    cacheValue: cache.TtlCache<PrimaryBadgeBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryBadgeBaseline | undefined {
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

  save(item: PrimaryBadgeBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryBadgeBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryBadgeBaselineStore(inner: PrimaryBadgeBaselineStore, ttl: number, clockValue: clock.Clock): PrimaryBadgeBaselineStore {
  return new CachedPrimaryBadgeBaselineStore(
    inner,
    cache.newTtlCache<PrimaryBadgeBaseline>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary badge baselines. Empty fields match all. */
export class PrimaryBadgeBaselineQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryBadgeBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryBadgeBaseline[]): PrimaryBadgeBaseline[] {
    const matched = collections.filter(items, (candidate: PrimaryBadgeBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryBadgeBaselines(store: PrimaryBadgeBaselineStore, query: PrimaryBadgeBaselineQuery): PrimaryBadgeBaseline[] {
  return query.apply(store.list());
}
