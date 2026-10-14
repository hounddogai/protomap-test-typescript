import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierGroup } from "./tier-group.js";

/** Keeps tier groups by code. */
export interface TierGroupStore {
  find(code: string): TierGroup | undefined;
  save(item: TierGroup): void;
  remove(code: string): boolean;
  list(): TierGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierGroupStore implements TierGroupStore {
  items: Map<string, TierGroup>;
  order: string[];

  constructor(items: Map<string, TierGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierGroup): void {
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

  list(): TierGroup[] {
    const out: TierGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierGroupStore(): TierGroupStore {
  return new MemoryTierGroupStore(new Map<string, TierGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierGroupStore implements TierGroupStore {
  inner: TierGroupStore;
  cache: cache.TtlCache<TierGroup>;
  hits: number;
  misses: number;

  constructor(inner: TierGroupStore, cacheValue: cache.TtlCache<TierGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierGroup | undefined {
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

  save(item: TierGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierGroup[] {
    return this.inner.list();
  }
}

export function newCachedTierGroupStore(inner: TierGroupStore, ttl: number, clockValue: clock.Clock): TierGroupStore {
  return new CachedTierGroupStore(inner, cache.newTtlCache<TierGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects tier groups. Empty fields match all. */
export class TierGroupQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierGroup[]): TierGroup[] {
    const matched = collections.filter(items, (candidate: TierGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierGroups(store: TierGroupStore, query: TierGroupQuery): TierGroup[] {
  return query.apply(store.list());
}
