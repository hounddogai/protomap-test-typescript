import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowThreshold } from "./window-threshold.js";

/** Keeps window thresholds by code. */
export interface WindowThresholdStore {
  find(code: string): WindowThreshold | undefined;
  save(item: WindowThreshold): void;
  remove(code: string): boolean;
  list(): WindowThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowThresholdStore implements WindowThresholdStore {
  items: Map<string, WindowThreshold>;
  order: string[];

  constructor(items: Map<string, WindowThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowThreshold): void {
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

  list(): WindowThreshold[] {
    const out: WindowThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowThresholdStore(): WindowThresholdStore {
  return new MemoryWindowThresholdStore(new Map<string, WindowThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowThresholdStore implements WindowThresholdStore {
  inner: WindowThresholdStore;
  cache: cache.TtlCache<WindowThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowThresholdStore,
    cacheValue: cache.TtlCache<WindowThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowThreshold | undefined {
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

  save(item: WindowThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowThreshold[] {
    return this.inner.list();
  }
}

export function newCachedWindowThresholdStore(inner: WindowThresholdStore, ttl: number, clockValue: clock.Clock): WindowThresholdStore {
  return new CachedWindowThresholdStore(inner, cache.newTtlCache<WindowThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects window thresholds. Empty fields match all. */
export class WindowThresholdQuery {
  segment: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minGraceDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowThreshold): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowThreshold[]): WindowThreshold[] {
    const matched = collections.filter(items, (candidate: WindowThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowThresholds(store: WindowThresholdStore, query: WindowThresholdQuery): WindowThreshold[] {
  return query.apply(store.list());
}
