import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingWaitWindow } from "./rolling-wait-window.js";

/** Keeps rolling wait windows by code. */
export interface RollingWaitWindowStore {
  find(code: string): RollingWaitWindow | undefined;
  save(item: RollingWaitWindow): void;
  remove(code: string): boolean;
  list(): RollingWaitWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingWaitWindowStore implements RollingWaitWindowStore {
  items: Map<string, RollingWaitWindow>;
  order: string[];

  constructor(items: Map<string, RollingWaitWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingWaitWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingWaitWindow): void {
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

  list(): RollingWaitWindow[] {
    const out: RollingWaitWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingWaitWindowStore(): RollingWaitWindowStore {
  return new MemoryRollingWaitWindowStore(new Map<string, RollingWaitWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingWaitWindowStore implements RollingWaitWindowStore {
  inner: RollingWaitWindowStore;
  cache: cache.TtlCache<RollingWaitWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingWaitWindowStore,
    cacheValue: cache.TtlCache<RollingWaitWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingWaitWindow | undefined {
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

  save(item: RollingWaitWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingWaitWindow[] {
    return this.inner.list();
  }
}

export function newCachedRollingWaitWindowStore(inner: RollingWaitWindowStore, ttl: number, clockValue: clock.Clock): RollingWaitWindowStore {
  return new CachedRollingWaitWindowStore(inner, cache.newTtlCache<RollingWaitWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling wait windows. Empty fields match all. */
export class RollingWaitWindowQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingWaitWindow): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingWaitWindow[]): RollingWaitWindow[] {
    const matched = collections.filter(items, (candidate: RollingWaitWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingWaitWindows(store: RollingWaitWindowStore, query: RollingWaitWindowQuery): RollingWaitWindow[] {
  return query.apply(store.list());
}
