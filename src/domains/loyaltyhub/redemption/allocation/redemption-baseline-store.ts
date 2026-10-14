import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionBaseline } from "./redemption-baseline.js";

/** Keeps redemption baselines by code. */
export interface RedemptionBaselineStore {
  find(code: string): RedemptionBaseline | undefined;
  save(item: RedemptionBaseline): void;
  remove(code: string): boolean;
  list(): RedemptionBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionBaselineStore implements RedemptionBaselineStore {
  items: Map<string, RedemptionBaseline>;
  order: string[];

  constructor(items: Map<string, RedemptionBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionBaseline): void {
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

  list(): RedemptionBaseline[] {
    const out: RedemptionBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionBaselineStore(): RedemptionBaselineStore {
  return new MemoryRedemptionBaselineStore(new Map<string, RedemptionBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionBaselineStore implements RedemptionBaselineStore {
  inner: RedemptionBaselineStore;
  cache: cache.TtlCache<RedemptionBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionBaselineStore,
    cacheValue: cache.TtlCache<RedemptionBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionBaseline | undefined {
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

  save(item: RedemptionBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionBaseline[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionBaselineStore(inner: RedemptionBaselineStore, ttl: number, clockValue: clock.Clock): RedemptionBaselineStore {
  return new CachedRedemptionBaselineStore(inner, cache.newTtlCache<RedemptionBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects redemption baselines. Empty fields match all. */
export class RedemptionBaselineQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionBaseline): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionBaseline[]): RedemptionBaseline[] {
    const matched = collections.filter(items, (candidate: RedemptionBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionBaselines(store: RedemptionBaselineStore, query: RedemptionBaselineQuery): RedemptionBaseline[] {
  return query.apply(store.list());
}
