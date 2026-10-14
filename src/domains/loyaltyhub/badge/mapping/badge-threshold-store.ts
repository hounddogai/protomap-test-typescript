import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeThreshold } from "./badge-threshold.js";

/** Keeps badge thresholds by code. */
export interface BadgeThresholdStore {
  find(code: string): BadgeThreshold | undefined;
  save(item: BadgeThreshold): void;
  remove(code: string): boolean;
  list(): BadgeThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeThresholdStore implements BadgeThresholdStore {
  items: Map<string, BadgeThreshold>;
  order: string[];

  constructor(items: Map<string, BadgeThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeThreshold): void {
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

  list(): BadgeThreshold[] {
    const out: BadgeThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeThresholdStore(): BadgeThresholdStore {
  return new MemoryBadgeThresholdStore(new Map<string, BadgeThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeThresholdStore implements BadgeThresholdStore {
  inner: BadgeThresholdStore;
  cache: cache.TtlCache<BadgeThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: BadgeThresholdStore,
    cacheValue: cache.TtlCache<BadgeThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeThreshold | undefined {
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

  save(item: BadgeThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeThreshold[] {
    return this.inner.list();
  }
}

export function newCachedBadgeThresholdStore(inner: BadgeThresholdStore, ttl: number, clockValue: clock.Clock): BadgeThresholdStore {
  return new CachedBadgeThresholdStore(inner, cache.newTtlCache<BadgeThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects badge thresholds. Empty fields match all. */
export class BadgeThresholdQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeThreshold[]): BadgeThreshold[] {
    const matched = collections.filter(items, (candidate: BadgeThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeThresholds(store: BadgeThresholdStore, query: BadgeThresholdQuery): BadgeThreshold[] {
  return query.apply(store.list());
}
