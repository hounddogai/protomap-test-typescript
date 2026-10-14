import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedQueueWindow } from "./capped-queue-window.js";

/** Keeps capped queue windows by code. */
export interface CappedQueueWindowStore {
  find(code: string): CappedQueueWindow | undefined;
  save(item: CappedQueueWindow): void;
  remove(code: string): boolean;
  list(): CappedQueueWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedQueueWindowStore implements CappedQueueWindowStore {
  items: Map<string, CappedQueueWindow>;
  order: string[];

  constructor(items: Map<string, CappedQueueWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedQueueWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedQueueWindow): void {
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

  list(): CappedQueueWindow[] {
    const out: CappedQueueWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedQueueWindowStore(): CappedQueueWindowStore {
  return new MemoryCappedQueueWindowStore(new Map<string, CappedQueueWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedQueueWindowStore implements CappedQueueWindowStore {
  inner: CappedQueueWindowStore;
  cache: cache.TtlCache<CappedQueueWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedQueueWindowStore,
    cacheValue: cache.TtlCache<CappedQueueWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedQueueWindow | undefined {
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

  save(item: CappedQueueWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedQueueWindow[] {
    return this.inner.list();
  }
}

export function newCachedCappedQueueWindowStore(inner: CappedQueueWindowStore, ttl: number, clockValue: clock.Clock): CappedQueueWindowStore {
  return new CachedCappedQueueWindowStore(inner, cache.newTtlCache<CappedQueueWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped queue windows. Empty fields match all. */
export class CappedQueueWindowQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedQueueWindow): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedQueueWindow[]): CappedQueueWindow[] {
    const matched = collections.filter(items, (candidate: CappedQueueWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedQueueWindows(store: CappedQueueWindowStore, query: CappedQueueWindowQuery): CappedQueueWindow[] {
  return query.apply(store.list());
}
