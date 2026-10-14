import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceRollup } from "./preference-rollup.js";

/** Keeps preference rollups by code. */
export interface PreferenceRollupStore {
  find(code: string): PreferenceRollup | undefined;
  save(item: PreferenceRollup): void;
  remove(code: string): boolean;
  list(): PreferenceRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceRollupStore implements PreferenceRollupStore {
  items: Map<string, PreferenceRollup>;
  order: string[];

  constructor(items: Map<string, PreferenceRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceRollup): void {
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

  list(): PreferenceRollup[] {
    const out: PreferenceRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceRollupStore(): PreferenceRollupStore {
  return new MemoryPreferenceRollupStore(new Map<string, PreferenceRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceRollupStore implements PreferenceRollupStore {
  inner: PreferenceRollupStore;
  cache: cache.TtlCache<PreferenceRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceRollupStore,
    cacheValue: cache.TtlCache<PreferenceRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceRollup | undefined {
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

  save(item: PreferenceRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceRollup[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceRollupStore(inner: PreferenceRollupStore, ttl: number, clockValue: clock.Clock): PreferenceRollupStore {
  return new CachedPreferenceRollupStore(inner, cache.newTtlCache<PreferenceRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects preference rollups. Empty fields match all. */
export class PreferenceRollupQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceRollup[]): PreferenceRollup[] {
    const matched = collections.filter(items, (candidate: PreferenceRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceRollups(store: PreferenceRollupStore, query: PreferenceRollupQuery): PreferenceRollup[] {
  return query.apply(store.list());
}
