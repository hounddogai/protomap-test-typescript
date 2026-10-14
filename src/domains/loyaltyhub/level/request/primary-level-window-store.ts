import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryLevelWindow } from "./primary-level-window.js";

/** Keeps primary level windows by code. */
export interface PrimaryLevelWindowStore {
  find(code: string): PrimaryLevelWindow | undefined;
  save(item: PrimaryLevelWindow): void;
  remove(code: string): boolean;
  list(): PrimaryLevelWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryLevelWindowStore implements PrimaryLevelWindowStore {
  items: Map<string, PrimaryLevelWindow>;
  order: string[];

  constructor(items: Map<string, PrimaryLevelWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryLevelWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryLevelWindow): void {
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

  list(): PrimaryLevelWindow[] {
    const out: PrimaryLevelWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryLevelWindowStore(): PrimaryLevelWindowStore {
  return new MemoryPrimaryLevelWindowStore(new Map<string, PrimaryLevelWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryLevelWindowStore implements PrimaryLevelWindowStore {
  inner: PrimaryLevelWindowStore;
  cache: cache.TtlCache<PrimaryLevelWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryLevelWindowStore,
    cacheValue: cache.TtlCache<PrimaryLevelWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryLevelWindow | undefined {
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

  save(item: PrimaryLevelWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryLevelWindow[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryLevelWindowStore(inner: PrimaryLevelWindowStore, ttl: number, clockValue: clock.Clock): PrimaryLevelWindowStore {
  return new CachedPrimaryLevelWindowStore(inner, cache.newTtlCache<PrimaryLevelWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary level windows. Empty fields match all. */
export class PrimaryLevelWindowQuery {
  category: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBatchSize: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryLevelWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryLevelWindow[]): PrimaryLevelWindow[] {
    const matched = collections.filter(items, (candidate: PrimaryLevelWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryLevelWindows(store: PrimaryLevelWindowStore, query: PrimaryLevelWindowQuery): PrimaryLevelWindow[] {
  return query.apply(store.list());
}
