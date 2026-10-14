import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointThreshold } from "./touchpoint-threshold.js";

/** Keeps touchpoint thresholds by code. */
export interface TouchpointThresholdStore {
  find(code: string): TouchpointThreshold | undefined;
  save(item: TouchpointThreshold): void;
  remove(code: string): boolean;
  list(): TouchpointThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointThresholdStore implements TouchpointThresholdStore {
  items: Map<string, TouchpointThreshold>;
  order: string[];

  constructor(items: Map<string, TouchpointThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointThreshold): void {
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

  list(): TouchpointThreshold[] {
    const out: TouchpointThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointThresholdStore(): TouchpointThresholdStore {
  return new MemoryTouchpointThresholdStore(new Map<string, TouchpointThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointThresholdStore implements TouchpointThresholdStore {
  inner: TouchpointThresholdStore;
  cache: cache.TtlCache<TouchpointThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointThresholdStore,
    cacheValue: cache.TtlCache<TouchpointThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointThreshold | undefined {
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

  save(item: TouchpointThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointThreshold[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointThresholdStore(inner: TouchpointThresholdStore, ttl: number, clockValue: clock.Clock): TouchpointThresholdStore {
  return new CachedTouchpointThresholdStore(inner, cache.newTtlCache<TouchpointThreshold>(512, ttl, clockValue), 0, 0);
}

/** Selects touchpoint thresholds. Empty fields match all. */
export class TouchpointThresholdQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointThreshold): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointThreshold[]): TouchpointThreshold[] {
    const matched = collections.filter(items, (candidate: TouchpointThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointThresholds(store: TouchpointThresholdStore, query: TouchpointThresholdQuery): TouchpointThreshold[] {
  return query.apply(store.list());
}
