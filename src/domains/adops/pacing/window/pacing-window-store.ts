import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingWindow } from "./pacing-window.js";

/** Keeps pacing windows by code. */
export interface PacingWindowStore {
  find(code: string): PacingWindow | undefined;
  save(item: PacingWindow): void;
  remove(code: string): boolean;
  list(): PacingWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingWindowStore implements PacingWindowStore {
  items: Map<string, PacingWindow>;
  order: string[];

  constructor(items: Map<string, PacingWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingWindow): void {
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

  list(): PacingWindow[] {
    const out: PacingWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingWindowStore(): PacingWindowStore {
  return new MemoryPacingWindowStore(new Map<string, PacingWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingWindowStore implements PacingWindowStore {
  inner: PacingWindowStore;
  cache: cache.TtlCache<PacingWindow>;
  hits: number;
  misses: number;

  constructor(inner: PacingWindowStore, cacheValue: cache.TtlCache<PacingWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingWindow | undefined {
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

  save(item: PacingWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingWindow[] {
    return this.inner.list();
  }
}

export function newCachedPacingWindowStore(inner: PacingWindowStore, ttl: number, clockValue: clock.Clock): PacingWindowStore {
  return new CachedPacingWindowStore(inner, cache.newTtlCache<PacingWindow>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing windows. Empty fields match all. */
export class PacingWindowQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingWindow): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingWindow[]): PacingWindow[] {
    const matched = collections.filter(items, (candidate: PacingWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingWindows(store: PacingWindowStore, query: PacingWindowQuery): PacingWindow[] {
  return query.apply(store.list());
}
