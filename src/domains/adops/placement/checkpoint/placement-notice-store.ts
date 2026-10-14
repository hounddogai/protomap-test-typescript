import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementNotice } from "./placement-notice.js";

/** Keeps placement notices by code. */
export interface PlacementNoticeStore {
  find(code: string): PlacementNotice | undefined;
  save(item: PlacementNotice): void;
  remove(code: string): boolean;
  list(): PlacementNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementNoticeStore implements PlacementNoticeStore {
  items: Map<string, PlacementNotice>;
  order: string[];

  constructor(items: Map<string, PlacementNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementNotice): void {
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

  list(): PlacementNotice[] {
    const out: PlacementNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementNoticeStore(): PlacementNoticeStore {
  return new MemoryPlacementNoticeStore(new Map<string, PlacementNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementNoticeStore implements PlacementNoticeStore {
  inner: PlacementNoticeStore;
  cache: cache.TtlCache<PlacementNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementNoticeStore,
    cacheValue: cache.TtlCache<PlacementNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementNotice | undefined {
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

  save(item: PlacementNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementNotice[] {
    return this.inner.list();
  }
}

export function newCachedPlacementNoticeStore(inner: PlacementNoticeStore, ttl: number, clockValue: clock.Clock): PlacementNoticeStore {
  return new CachedPlacementNoticeStore(inner, cache.newTtlCache<PlacementNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects placement notices. Empty fields match all. */
export class PlacementNoticeQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementNotice[]): PlacementNotice[] {
    const matched = collections.filter(items, (candidate: PlacementNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementNotices(store: PlacementNoticeStore, query: PlacementNoticeQuery): PlacementNotice[] {
  return query.apply(store.list());
}
