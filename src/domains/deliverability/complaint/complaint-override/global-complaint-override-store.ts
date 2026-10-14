import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalComplaintOverride } from "./global-complaint-override.js";

/** Keeps global complaint overrides by code. */
export interface GlobalComplaintOverrideStore {
  find(code: string): GlobalComplaintOverride | undefined;
  save(item: GlobalComplaintOverride): void;
  remove(code: string): boolean;
  list(): GlobalComplaintOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalComplaintOverrideStore implements GlobalComplaintOverrideStore {
  items: Map<string, GlobalComplaintOverride>;
  order: string[];

  constructor(items: Map<string, GlobalComplaintOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalComplaintOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalComplaintOverride): void {
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

  list(): GlobalComplaintOverride[] {
    const out: GlobalComplaintOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalComplaintOverrideStore(): GlobalComplaintOverrideStore {
  return new MemoryGlobalComplaintOverrideStore(new Map<string, GlobalComplaintOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalComplaintOverrideStore implements GlobalComplaintOverrideStore {
  inner: GlobalComplaintOverrideStore;
  cache: cache.TtlCache<GlobalComplaintOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalComplaintOverrideStore,
    cacheValue: cache.TtlCache<GlobalComplaintOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalComplaintOverride | undefined {
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

  save(item: GlobalComplaintOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalComplaintOverride[] {
    return this.inner.list();
  }
}

export function newCachedGlobalComplaintOverrideStore(inner: GlobalComplaintOverrideStore, ttl: number, clockValue: clock.Clock): GlobalComplaintOverrideStore {
  return new CachedGlobalComplaintOverrideStore(
    inner,
    cache.newTtlCache<GlobalComplaintOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global complaint overrides. Empty fields match all. */
export class GlobalComplaintOverrideQuery {
  unit: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCapacity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalComplaintOverride): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalComplaintOverride[]): GlobalComplaintOverride[] {
    const matched = collections.filter(items, (candidate: GlobalComplaintOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalComplaintOverrides(store: GlobalComplaintOverrideStore, query: GlobalComplaintOverrideQuery): GlobalComplaintOverride[] {
  return query.apply(store.list());
}
