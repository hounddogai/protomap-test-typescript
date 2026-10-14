import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCreativeCycle } from "./strict-creative-cycle.js";

/** Keeps strict creative cycles by code. */
export interface StrictCreativeCycleStore {
  find(code: string): StrictCreativeCycle | undefined;
  save(item: StrictCreativeCycle): void;
  remove(code: string): boolean;
  list(): StrictCreativeCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCreativeCycleStore implements StrictCreativeCycleStore {
  items: Map<string, StrictCreativeCycle>;
  order: string[];

  constructor(items: Map<string, StrictCreativeCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCreativeCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCreativeCycle): void {
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

  list(): StrictCreativeCycle[] {
    const out: StrictCreativeCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCreativeCycleStore(): StrictCreativeCycleStore {
  return new MemoryStrictCreativeCycleStore(new Map<string, StrictCreativeCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCreativeCycleStore implements StrictCreativeCycleStore {
  inner: StrictCreativeCycleStore;
  cache: cache.TtlCache<StrictCreativeCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCreativeCycleStore,
    cacheValue: cache.TtlCache<StrictCreativeCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCreativeCycle | undefined {
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

  save(item: StrictCreativeCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCreativeCycle[] {
    return this.inner.list();
  }
}

export function newCachedStrictCreativeCycleStore(inner: StrictCreativeCycleStore, ttl: number, clockValue: clock.Clock): StrictCreativeCycleStore {
  return new CachedStrictCreativeCycleStore(inner, cache.newTtlCache<StrictCreativeCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects strict creative cycles. Empty fields match all. */
export class StrictCreativeCycleQuery {
  utmSource: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAmount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCreativeCycle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCreativeCycle[]): StrictCreativeCycle[] {
    const matched = collections.filter(items, (candidate: StrictCreativeCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCreativeCycles(store: StrictCreativeCycleStore, query: StrictCreativeCycleQuery): StrictCreativeCycle[] {
  return query.apply(store.list());
}
