import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredTierBaseline } from "./tiered-tier-baseline.js";

/** Keeps tiered tier baselines by code. */
export interface TieredTierBaselineStore {
  find(code: string): TieredTierBaseline | undefined;
  save(item: TieredTierBaseline): void;
  remove(code: string): boolean;
  list(): TieredTierBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredTierBaselineStore implements TieredTierBaselineStore {
  items: Map<string, TieredTierBaseline>;
  order: string[];

  constructor(items: Map<string, TieredTierBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredTierBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredTierBaseline): void {
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

  list(): TieredTierBaseline[] {
    const out: TieredTierBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredTierBaselineStore(): TieredTierBaselineStore {
  return new MemoryTieredTierBaselineStore(new Map<string, TieredTierBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredTierBaselineStore implements TieredTierBaselineStore {
  inner: TieredTierBaselineStore;
  cache: cache.TtlCache<TieredTierBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredTierBaselineStore,
    cacheValue: cache.TtlCache<TieredTierBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredTierBaseline | undefined {
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

  save(item: TieredTierBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredTierBaseline[] {
    return this.inner.list();
  }
}

export function newCachedTieredTierBaselineStore(inner: TieredTierBaselineStore, ttl: number, clockValue: clock.Clock): TieredTierBaselineStore {
  return new CachedTieredTierBaselineStore(inner, cache.newTtlCache<TieredTierBaseline>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered tier baselines. Empty fields match all. */
export class TieredTierBaselineQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredTierBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredTierBaseline[]): TieredTierBaseline[] {
    const matched = collections.filter(items, (candidate: TieredTierBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredTierBaselines(store: TieredTierBaselineStore, query: TieredTierBaselineQuery): TieredTierBaseline[] {
  return query.apply(store.list());
}
