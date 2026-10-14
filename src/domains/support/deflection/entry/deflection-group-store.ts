import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionGroup } from "./deflection-group.js";

/** Keeps deflection groups by code. */
export interface DeflectionGroupStore {
  find(code: string): DeflectionGroup | undefined;
  save(item: DeflectionGroup): void;
  remove(code: string): boolean;
  list(): DeflectionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionGroupStore implements DeflectionGroupStore {
  items: Map<string, DeflectionGroup>;
  order: string[];

  constructor(items: Map<string, DeflectionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionGroup): void {
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

  list(): DeflectionGroup[] {
    const out: DeflectionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionGroupStore(): DeflectionGroupStore {
  return new MemoryDeflectionGroupStore(new Map<string, DeflectionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionGroupStore implements DeflectionGroupStore {
  inner: DeflectionGroupStore;
  cache: cache.TtlCache<DeflectionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionGroupStore,
    cacheValue: cache.TtlCache<DeflectionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionGroup | undefined {
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

  save(item: DeflectionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionGroup[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionGroupStore(inner: DeflectionGroupStore, ttl: number, clockValue: clock.Clock): DeflectionGroupStore {
  return new CachedDeflectionGroupStore(inner, cache.newTtlCache<DeflectionGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects deflection groups. Empty fields match all. */
export class DeflectionGroupQuery {
  segment: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWindowDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionGroup): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionGroup[]): DeflectionGroup[] {
    const matched = collections.filter(items, (candidate: DeflectionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionGroups(store: DeflectionGroupStore, query: DeflectionGroupQuery): DeflectionGroup[] {
  return query.apply(store.list());
}
