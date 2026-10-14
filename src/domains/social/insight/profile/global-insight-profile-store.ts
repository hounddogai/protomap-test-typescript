import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalInsightProfile } from "./global-insight-profile.js";

/** Keeps global insight profiles by code. */
export interface GlobalInsightProfileStore {
  find(code: string): GlobalInsightProfile | undefined;
  save(item: GlobalInsightProfile): void;
  remove(code: string): boolean;
  list(): GlobalInsightProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalInsightProfileStore implements GlobalInsightProfileStore {
  items: Map<string, GlobalInsightProfile>;
  order: string[];

  constructor(items: Map<string, GlobalInsightProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalInsightProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalInsightProfile): void {
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

  list(): GlobalInsightProfile[] {
    const out: GlobalInsightProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalInsightProfileStore(): GlobalInsightProfileStore {
  return new MemoryGlobalInsightProfileStore(new Map<string, GlobalInsightProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalInsightProfileStore implements GlobalInsightProfileStore {
  inner: GlobalInsightProfileStore;
  cache: cache.TtlCache<GlobalInsightProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalInsightProfileStore,
    cacheValue: cache.TtlCache<GlobalInsightProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalInsightProfile | undefined {
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

  save(item: GlobalInsightProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalInsightProfile[] {
    return this.inner.list();
  }
}

export function newCachedGlobalInsightProfileStore(inner: GlobalInsightProfileStore, ttl: number, clockValue: clock.Clock): GlobalInsightProfileStore {
  return new CachedGlobalInsightProfileStore(
    inner,
    cache.newTtlCache<GlobalInsightProfile>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global insight profiles. Empty fields match all. */
export class GlobalInsightProfileQuery {
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

  matches(item: GlobalInsightProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalInsightProfile[]): GlobalInsightProfile[] {
    const matched = collections.filter(items, (candidate: GlobalInsightProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalInsightProfiles(store: GlobalInsightProfileStore, query: GlobalInsightProfileQuery): GlobalInsightProfile[] {
  return query.apply(store.list());
}
