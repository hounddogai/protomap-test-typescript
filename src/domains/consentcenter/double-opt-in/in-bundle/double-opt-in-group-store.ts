import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInGroup } from "./double-opt-in-group.js";

/** Keeps double opt in groups by code. */
export interface DoubleOptInGroupStore {
  find(code: string): DoubleOptInGroup | undefined;
  save(item: DoubleOptInGroup): void;
  remove(code: string): boolean;
  list(): DoubleOptInGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInGroupStore implements DoubleOptInGroupStore {
  items: Map<string, DoubleOptInGroup>;
  order: string[];

  constructor(items: Map<string, DoubleOptInGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInGroup): void {
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

  list(): DoubleOptInGroup[] {
    const out: DoubleOptInGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInGroupStore(): DoubleOptInGroupStore {
  return new MemoryDoubleOptInGroupStore(new Map<string, DoubleOptInGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInGroupStore implements DoubleOptInGroupStore {
  inner: DoubleOptInGroupStore;
  cache: cache.TtlCache<DoubleOptInGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInGroupStore,
    cacheValue: cache.TtlCache<DoubleOptInGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInGroup | undefined {
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

  save(item: DoubleOptInGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInGroup[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInGroupStore(inner: DoubleOptInGroupStore, ttl: number, clockValue: clock.Clock): DoubleOptInGroupStore {
  return new CachedDoubleOptInGroupStore(inner, cache.newTtlCache<DoubleOptInGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in groups. Empty fields match all. */
export class DoubleOptInGroupQuery {
  category: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minMargin: number, statuses: string[], limit: number) {
    this.category = category;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInGroup): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInGroup[]): DoubleOptInGroup[] {
    const matched = collections.filter(items, (candidate: DoubleOptInGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInGroups(store: DoubleOptInGroupStore, query: DoubleOptInGroupQuery): DoubleOptInGroup[] {
  return query.apply(store.list());
}
