import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPlacementProfile } from "./regional-placement-profile.js";

/** Keeps regional placement profiles by code. */
export interface RegionalPlacementProfileStore {
  find(code: string): RegionalPlacementProfile | undefined;
  save(item: RegionalPlacementProfile): void;
  remove(code: string): boolean;
  list(): RegionalPlacementProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPlacementProfileStore implements RegionalPlacementProfileStore {
  items: Map<string, RegionalPlacementProfile>;
  order: string[];

  constructor(items: Map<string, RegionalPlacementProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPlacementProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPlacementProfile): void {
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

  list(): RegionalPlacementProfile[] {
    const out: RegionalPlacementProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPlacementProfileStore(): RegionalPlacementProfileStore {
  return new MemoryRegionalPlacementProfileStore(new Map<string, RegionalPlacementProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPlacementProfileStore implements RegionalPlacementProfileStore {
  inner: RegionalPlacementProfileStore;
  cache: cache.TtlCache<RegionalPlacementProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPlacementProfileStore,
    cacheValue: cache.TtlCache<RegionalPlacementProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPlacementProfile | undefined {
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

  save(item: RegionalPlacementProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPlacementProfile[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPlacementProfileStore(inner: RegionalPlacementProfileStore, ttl: number, clockValue: clock.Clock): RegionalPlacementProfileStore {
  return new CachedRegionalPlacementProfileStore(
    inner,
    cache.newTtlCache<RegionalPlacementProfile>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional placement profiles. Empty fields match all. */
export class RegionalPlacementProfileQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPlacementProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPlacementProfile[]): RegionalPlacementProfile[] {
    const matched = collections.filter(items, (candidate: RegionalPlacementProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPlacementProfiles(store: RegionalPlacementProfileStore, query: RegionalPlacementProfileQuery): RegionalPlacementProfile[] {
  return query.apply(store.list());
}
