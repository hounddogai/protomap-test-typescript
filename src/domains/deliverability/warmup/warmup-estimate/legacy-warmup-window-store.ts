import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyWarmupWindow } from "./legacy-warmup-window.js";

/** Keeps legacy warmup windows by code. */
export interface LegacyWarmupWindowStore {
  find(code: string): LegacyWarmupWindow | undefined;
  save(item: LegacyWarmupWindow): void;
  remove(code: string): boolean;
  list(): LegacyWarmupWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyWarmupWindowStore implements LegacyWarmupWindowStore {
  items: Map<string, LegacyWarmupWindow>;
  order: string[];

  constructor(items: Map<string, LegacyWarmupWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyWarmupWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyWarmupWindow): void {
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

  list(): LegacyWarmupWindow[] {
    const out: LegacyWarmupWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyWarmupWindowStore(): LegacyWarmupWindowStore {
  return new MemoryLegacyWarmupWindowStore(new Map<string, LegacyWarmupWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyWarmupWindowStore implements LegacyWarmupWindowStore {
  inner: LegacyWarmupWindowStore;
  cache: cache.TtlCache<LegacyWarmupWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyWarmupWindowStore,
    cacheValue: cache.TtlCache<LegacyWarmupWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyWarmupWindow | undefined {
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

  save(item: LegacyWarmupWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyWarmupWindow[] {
    return this.inner.list();
  }
}

export function newCachedLegacyWarmupWindowStore(inner: LegacyWarmupWindowStore, ttl: number, clockValue: clock.Clock): LegacyWarmupWindowStore {
  return new CachedLegacyWarmupWindowStore(inner, cache.newTtlCache<LegacyWarmupWindow>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy warmup windows. Empty fields match all. */
export class LegacyWarmupWindowQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyWarmupWindow): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyWarmupWindow[]): LegacyWarmupWindow[] {
    const matched = collections.filter(items, (candidate: LegacyWarmupWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyWarmupWindows(store: LegacyWarmupWindowStore, query: LegacyWarmupWindowQuery): LegacyWarmupWindow[] {
  return query.apply(store.list());
}
