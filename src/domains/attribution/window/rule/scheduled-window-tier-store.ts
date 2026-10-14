import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWindowTier } from "./scheduled-window-tier.js";

/** Keeps scheduled window tiers by code. */
export interface ScheduledWindowTierStore {
  find(code: string): ScheduledWindowTier | undefined;
  save(item: ScheduledWindowTier): void;
  remove(code: string): boolean;
  list(): ScheduledWindowTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWindowTierStore implements ScheduledWindowTierStore {
  items: Map<string, ScheduledWindowTier>;
  order: string[];

  constructor(items: Map<string, ScheduledWindowTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWindowTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWindowTier): void {
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

  list(): ScheduledWindowTier[] {
    const out: ScheduledWindowTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWindowTierStore(): ScheduledWindowTierStore {
  return new MemoryScheduledWindowTierStore(new Map<string, ScheduledWindowTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWindowTierStore implements ScheduledWindowTierStore {
  inner: ScheduledWindowTierStore;
  cache: cache.TtlCache<ScheduledWindowTier>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWindowTierStore,
    cacheValue: cache.TtlCache<ScheduledWindowTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWindowTier | undefined {
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

  save(item: ScheduledWindowTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWindowTier[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWindowTierStore(inner: ScheduledWindowTierStore, ttl: number, clockValue: clock.Clock): ScheduledWindowTierStore {
  return new CachedScheduledWindowTierStore(inner, cache.newTtlCache<ScheduledWindowTier>(512, ttl, clockValue), 0, 0);
}

/** Selects scheduled window tiers. Empty fields match all. */
export class ScheduledWindowTierQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWindowTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWindowTier[]): ScheduledWindowTier[] {
    const matched = collections.filter(items, (candidate: ScheduledWindowTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWindowTiers(store: ScheduledWindowTierStore, query: ScheduledWindowTierQuery): ScheduledWindowTier[] {
  return query.apply(store.list());
}
