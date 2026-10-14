import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingJourneyTarget } from "./rolling-journey-target.js";

/** Keeps rolling journey targets by code. */
export interface RollingJourneyTargetStore {
  find(code: string): RollingJourneyTarget | undefined;
  save(item: RollingJourneyTarget): void;
  remove(code: string): boolean;
  list(): RollingJourneyTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingJourneyTargetStore implements RollingJourneyTargetStore {
  items: Map<string, RollingJourneyTarget>;
  order: string[];

  constructor(items: Map<string, RollingJourneyTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingJourneyTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingJourneyTarget): void {
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

  list(): RollingJourneyTarget[] {
    const out: RollingJourneyTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingJourneyTargetStore(): RollingJourneyTargetStore {
  return new MemoryRollingJourneyTargetStore(new Map<string, RollingJourneyTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingJourneyTargetStore implements RollingJourneyTargetStore {
  inner: RollingJourneyTargetStore;
  cache: cache.TtlCache<RollingJourneyTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingJourneyTargetStore,
    cacheValue: cache.TtlCache<RollingJourneyTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingJourneyTarget | undefined {
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

  save(item: RollingJourneyTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingJourneyTarget[] {
    return this.inner.list();
  }
}

export function newCachedRollingJourneyTargetStore(inner: RollingJourneyTargetStore, ttl: number, clockValue: clock.Clock): RollingJourneyTargetStore {
  return new CachedRollingJourneyTargetStore(
    inner,
    cache.newTtlCache<RollingJourneyTarget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling journey targets. Empty fields match all. */
export class RollingJourneyTargetQuery {
  country: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFloorValue: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingJourneyTarget): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingJourneyTarget[]): RollingJourneyTarget[] {
    const matched = collections.filter(items, (candidate: RollingJourneyTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingJourneyTargets(store: RollingJourneyTargetStore, query: RollingJourneyTargetQuery): RollingJourneyTarget[] {
  return query.apply(store.list());
}
