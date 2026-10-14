import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTouchpointTarget } from "./primary-touchpoint-target.js";

/** Keeps primary touchpoint targets by code. */
export interface PrimaryTouchpointTargetStore {
  find(code: string): PrimaryTouchpointTarget | undefined;
  save(item: PrimaryTouchpointTarget): void;
  remove(code: string): boolean;
  list(): PrimaryTouchpointTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTouchpointTargetStore implements PrimaryTouchpointTargetStore {
  items: Map<string, PrimaryTouchpointTarget>;
  order: string[];

  constructor(items: Map<string, PrimaryTouchpointTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTouchpointTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTouchpointTarget): void {
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

  list(): PrimaryTouchpointTarget[] {
    const out: PrimaryTouchpointTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTouchpointTargetStore(): PrimaryTouchpointTargetStore {
  return new MemoryPrimaryTouchpointTargetStore(new Map<string, PrimaryTouchpointTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTouchpointTargetStore implements PrimaryTouchpointTargetStore {
  inner: PrimaryTouchpointTargetStore;
  cache: cache.TtlCache<PrimaryTouchpointTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTouchpointTargetStore,
    cacheValue: cache.TtlCache<PrimaryTouchpointTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTouchpointTarget | undefined {
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

  save(item: PrimaryTouchpointTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTouchpointTarget[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTouchpointTargetStore(inner: PrimaryTouchpointTargetStore, ttl: number, clockValue: clock.Clock): PrimaryTouchpointTargetStore {
  return new CachedPrimaryTouchpointTargetStore(
    inner,
    cache.newTtlCache<PrimaryTouchpointTarget>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary touchpoint targets. Empty fields match all. */
export class PrimaryTouchpointTargetQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTouchpointTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTouchpointTarget[]): PrimaryTouchpointTarget[] {
    const matched = collections.filter(items, (candidate: PrimaryTouchpointTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTouchpointTargets(store: PrimaryTouchpointTargetStore, query: PrimaryTouchpointTargetQuery): PrimaryTouchpointTarget[] {
  return query.apply(store.list());
}
