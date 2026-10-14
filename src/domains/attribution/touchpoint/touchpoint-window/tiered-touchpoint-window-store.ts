import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredTouchpointWindow } from "./tiered-touchpoint-window.js";

/** Keeps tiered touchpoint windows by code. */
export interface TieredTouchpointWindowStore {
  find(code: string): TieredTouchpointWindow | undefined;
  save(item: TieredTouchpointWindow): void;
  remove(code: string): boolean;
  list(): TieredTouchpointWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredTouchpointWindowStore implements TieredTouchpointWindowStore {
  items: Map<string, TieredTouchpointWindow>;
  order: string[];

  constructor(items: Map<string, TieredTouchpointWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredTouchpointWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredTouchpointWindow): void {
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

  list(): TieredTouchpointWindow[] {
    const out: TieredTouchpointWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredTouchpointWindowStore(): TieredTouchpointWindowStore {
  return new MemoryTieredTouchpointWindowStore(new Map<string, TieredTouchpointWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredTouchpointWindowStore implements TieredTouchpointWindowStore {
  inner: TieredTouchpointWindowStore;
  cache: cache.TtlCache<TieredTouchpointWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredTouchpointWindowStore,
    cacheValue: cache.TtlCache<TieredTouchpointWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredTouchpointWindow | undefined {
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

  save(item: TieredTouchpointWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredTouchpointWindow[] {
    return this.inner.list();
  }
}

export function newCachedTieredTouchpointWindowStore(inner: TieredTouchpointWindowStore, ttl: number, clockValue: clock.Clock): TieredTouchpointWindowStore {
  return new CachedTieredTouchpointWindowStore(
    inner,
    cache.newTtlCache<TieredTouchpointWindow>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered touchpoint windows. Empty fields match all. */
export class TieredTouchpointWindowQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredTouchpointWindow): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredTouchpointWindow[]): TieredTouchpointWindow[] {
    const matched = collections.filter(items, (candidate: TieredTouchpointWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredTouchpointWindows(store: TieredTouchpointWindowStore, query: TieredTouchpointWindowQuery): TieredTouchpointWindow[] {
  return query.apply(store.list());
}
