import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalCreativeGroup } from "./global-creative-group.js";

/** Keeps global creative groups by code. */
export interface GlobalCreativeGroupStore {
  find(code: string): GlobalCreativeGroup | undefined;
  save(item: GlobalCreativeGroup): void;
  remove(code: string): boolean;
  list(): GlobalCreativeGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalCreativeGroupStore implements GlobalCreativeGroupStore {
  items: Map<string, GlobalCreativeGroup>;
  order: string[];

  constructor(items: Map<string, GlobalCreativeGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalCreativeGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalCreativeGroup): void {
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

  list(): GlobalCreativeGroup[] {
    const out: GlobalCreativeGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalCreativeGroupStore(): GlobalCreativeGroupStore {
  return new MemoryGlobalCreativeGroupStore(new Map<string, GlobalCreativeGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalCreativeGroupStore implements GlobalCreativeGroupStore {
  inner: GlobalCreativeGroupStore;
  cache: cache.TtlCache<GlobalCreativeGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalCreativeGroupStore,
    cacheValue: cache.TtlCache<GlobalCreativeGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalCreativeGroup | undefined {
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

  save(item: GlobalCreativeGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalCreativeGroup[] {
    return this.inner.list();
  }
}

export function newCachedGlobalCreativeGroupStore(inner: GlobalCreativeGroupStore, ttl: number, clockValue: clock.Clock): GlobalCreativeGroupStore {
  return new CachedGlobalCreativeGroupStore(inner, cache.newTtlCache<GlobalCreativeGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects global creative groups. Empty fields match all. */
export class GlobalCreativeGroupQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalCreativeGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalCreativeGroup[]): GlobalCreativeGroup[] {
    const matched = collections.filter(items, (candidate: GlobalCreativeGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalCreativeGroups(store: GlobalCreativeGroupStore, query: GlobalCreativeGroupQuery): GlobalCreativeGroup[] {
  return query.apply(store.list());
}
