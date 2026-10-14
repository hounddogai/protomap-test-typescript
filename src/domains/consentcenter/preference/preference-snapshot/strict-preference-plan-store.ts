import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPreferencePlan } from "./strict-preference-plan.js";

/** Keeps strict preference plans by code. */
export interface StrictPreferencePlanStore {
  find(code: string): StrictPreferencePlan | undefined;
  save(item: StrictPreferencePlan): void;
  remove(code: string): boolean;
  list(): StrictPreferencePlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPreferencePlanStore implements StrictPreferencePlanStore {
  items: Map<string, StrictPreferencePlan>;
  order: string[];

  constructor(items: Map<string, StrictPreferencePlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPreferencePlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPreferencePlan): void {
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

  list(): StrictPreferencePlan[] {
    const out: StrictPreferencePlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPreferencePlanStore(): StrictPreferencePlanStore {
  return new MemoryStrictPreferencePlanStore(new Map<string, StrictPreferencePlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPreferencePlanStore implements StrictPreferencePlanStore {
  inner: StrictPreferencePlanStore;
  cache: cache.TtlCache<StrictPreferencePlan>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPreferencePlanStore,
    cacheValue: cache.TtlCache<StrictPreferencePlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPreferencePlan | undefined {
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

  save(item: StrictPreferencePlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPreferencePlan[] {
    return this.inner.list();
  }
}

export function newCachedStrictPreferencePlanStore(inner: StrictPreferencePlanStore, ttl: number, clockValue: clock.Clock): StrictPreferencePlanStore {
  return new CachedStrictPreferencePlanStore(
    inner,
    cache.newTtlCache<StrictPreferencePlan>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict preference plans. Empty fields match all. */
export class StrictPreferencePlanQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPreferencePlan): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPreferencePlan[]): StrictPreferencePlan[] {
    const matched = collections.filter(items, (candidate: StrictPreferencePlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPreferencePlans(store: StrictPreferencePlanStore, query: StrictPreferencePlanQuery): StrictPreferencePlan[] {
  return query.apply(store.list());
}
