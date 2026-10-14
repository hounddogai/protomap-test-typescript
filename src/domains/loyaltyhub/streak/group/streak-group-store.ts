import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakGroup } from "./streak-group.js";

/** Keeps streak groups by code. */
export interface StreakGroupStore {
  find(code: string): StreakGroup | undefined;
  save(item: StreakGroup): void;
  remove(code: string): boolean;
  list(): StreakGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakGroupStore implements StreakGroupStore {
  items: Map<string, StreakGroup>;
  order: string[];

  constructor(items: Map<string, StreakGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakGroup): void {
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

  list(): StreakGroup[] {
    const out: StreakGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakGroupStore(): StreakGroupStore {
  return new MemoryStreakGroupStore(new Map<string, StreakGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakGroupStore implements StreakGroupStore {
  inner: StreakGroupStore;
  cache: cache.TtlCache<StreakGroup>;
  hits: number;
  misses: number;

  constructor(inner: StreakGroupStore, cacheValue: cache.TtlCache<StreakGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakGroup | undefined {
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

  save(item: StreakGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakGroup[] {
    return this.inner.list();
  }
}

export function newCachedStreakGroupStore(inner: StreakGroupStore, ttl: number, clockValue: clock.Clock): StreakGroupStore {
  return new CachedStreakGroupStore(inner, cache.newTtlCache<StreakGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects streak groups. Empty fields match all. */
export class StreakGroupQuery {
  region: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMinimum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakGroup): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakGroup[]): StreakGroup[] {
    const matched = collections.filter(items, (candidate: StreakGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakGroups(store: StreakGroupStore, query: StreakGroupQuery): StreakGroup[] {
  return query.apply(store.list());
}
