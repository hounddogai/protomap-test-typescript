import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientCsatWindow } from "./lenient-csat-window.js";

/** Keeps lenient csat windows by code. */
export interface LenientCsatWindowStore {
  find(code: string): LenientCsatWindow | undefined;
  save(item: LenientCsatWindow): void;
  remove(code: string): boolean;
  list(): LenientCsatWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientCsatWindowStore implements LenientCsatWindowStore {
  items: Map<string, LenientCsatWindow>;
  order: string[];

  constructor(items: Map<string, LenientCsatWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientCsatWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientCsatWindow): void {
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

  list(): LenientCsatWindow[] {
    const out: LenientCsatWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientCsatWindowStore(): LenientCsatWindowStore {
  return new MemoryLenientCsatWindowStore(new Map<string, LenientCsatWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientCsatWindowStore implements LenientCsatWindowStore {
  inner: LenientCsatWindowStore;
  cache: cache.TtlCache<LenientCsatWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientCsatWindowStore,
    cacheValue: cache.TtlCache<LenientCsatWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientCsatWindow | undefined {
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

  save(item: LenientCsatWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientCsatWindow[] {
    return this.inner.list();
  }
}

export function newCachedLenientCsatWindowStore(inner: LenientCsatWindowStore, ttl: number, clockValue: clock.Clock): LenientCsatWindowStore {
  return new CachedLenientCsatWindowStore(inner, cache.newTtlCache<LenientCsatWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient csat windows. Empty fields match all. */
export class LenientCsatWindowQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientCsatWindow): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientCsatWindow[]): LenientCsatWindow[] {
    const matched = collections.filter(items, (candidate: LenientCsatWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientCsatWindows(store: LenientCsatWindowStore, query: LenientCsatWindowQuery): LenientCsatWindow[] {
  return query.apply(store.list());
}
