import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBadgeBaseline } from "./global-badge-baseline.js";

/** Keeps global badge baselines by code. */
export interface GlobalBadgeBaselineStore {
  find(code: string): GlobalBadgeBaseline | undefined;
  save(item: GlobalBadgeBaseline): void;
  remove(code: string): boolean;
  list(): GlobalBadgeBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBadgeBaselineStore implements GlobalBadgeBaselineStore {
  items: Map<string, GlobalBadgeBaseline>;
  order: string[];

  constructor(items: Map<string, GlobalBadgeBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBadgeBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBadgeBaseline): void {
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

  list(): GlobalBadgeBaseline[] {
    const out: GlobalBadgeBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBadgeBaselineStore(): GlobalBadgeBaselineStore {
  return new MemoryGlobalBadgeBaselineStore(new Map<string, GlobalBadgeBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBadgeBaselineStore implements GlobalBadgeBaselineStore {
  inner: GlobalBadgeBaselineStore;
  cache: cache.TtlCache<GlobalBadgeBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBadgeBaselineStore,
    cacheValue: cache.TtlCache<GlobalBadgeBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBadgeBaseline | undefined {
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

  save(item: GlobalBadgeBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBadgeBaseline[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBadgeBaselineStore(inner: GlobalBadgeBaselineStore, ttl: number, clockValue: clock.Clock): GlobalBadgeBaselineStore {
  return new CachedGlobalBadgeBaselineStore(inner, cache.newTtlCache<GlobalBadgeBaseline>(64, ttl, clockValue), 0, 0);
}

/** Selects global badge baselines. Empty fields match all. */
export class GlobalBadgeBaselineQuery {
  segment: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minQuantity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBadgeBaseline): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBadgeBaseline[]): GlobalBadgeBaseline[] {
    const matched = collections.filter(items, (candidate: GlobalBadgeBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBadgeBaselines(store: GlobalBadgeBaselineStore, query: GlobalBadgeBaselineQuery): GlobalBadgeBaseline[] {
  return query.apply(store.list());
}
