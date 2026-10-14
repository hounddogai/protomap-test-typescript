import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementBaseline } from "./placement-baseline.js";

/** Keeps placement baselines by code. */
export interface PlacementBaselineStore {
  find(code: string): PlacementBaseline | undefined;
  save(item: PlacementBaseline): void;
  remove(code: string): boolean;
  list(): PlacementBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementBaselineStore implements PlacementBaselineStore {
  items: Map<string, PlacementBaseline>;
  order: string[];

  constructor(items: Map<string, PlacementBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementBaseline): void {
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

  list(): PlacementBaseline[] {
    const out: PlacementBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementBaselineStore(): PlacementBaselineStore {
  return new MemoryPlacementBaselineStore(new Map<string, PlacementBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementBaselineStore implements PlacementBaselineStore {
  inner: PlacementBaselineStore;
  cache: cache.TtlCache<PlacementBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementBaselineStore,
    cacheValue: cache.TtlCache<PlacementBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementBaseline | undefined {
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

  save(item: PlacementBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPlacementBaselineStore(inner: PlacementBaselineStore, ttl: number, clockValue: clock.Clock): PlacementBaselineStore {
  return new CachedPlacementBaselineStore(inner, cache.newTtlCache<PlacementBaseline>(128, ttl, clockValue), 0, 0);
}

/** Selects placement baselines. Empty fields match all. */
export class PlacementBaselineQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementBaseline): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementBaseline[]): PlacementBaseline[] {
    const matched = collections.filter(items, (candidate: PlacementBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementBaselines(store: PlacementBaselineStore, query: PlacementBaselineQuery): PlacementBaseline[] {
  return query.apply(store.list());
}
