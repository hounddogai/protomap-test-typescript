import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictBounceCycle } from "./strict-bounce-cycle.js";

/** Keeps strict bounce cycles by code. */
export interface StrictBounceCycleStore {
  find(code: string): StrictBounceCycle | undefined;
  save(item: StrictBounceCycle): void;
  remove(code: string): boolean;
  list(): StrictBounceCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictBounceCycleStore implements StrictBounceCycleStore {
  items: Map<string, StrictBounceCycle>;
  order: string[];

  constructor(items: Map<string, StrictBounceCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictBounceCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictBounceCycle): void {
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

  list(): StrictBounceCycle[] {
    const out: StrictBounceCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictBounceCycleStore(): StrictBounceCycleStore {
  return new MemoryStrictBounceCycleStore(new Map<string, StrictBounceCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictBounceCycleStore implements StrictBounceCycleStore {
  inner: StrictBounceCycleStore;
  cache: cache.TtlCache<StrictBounceCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictBounceCycleStore,
    cacheValue: cache.TtlCache<StrictBounceCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictBounceCycle | undefined {
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

  save(item: StrictBounceCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictBounceCycle[] {
    return this.inner.list();
  }
}

export function newCachedStrictBounceCycleStore(inner: StrictBounceCycleStore, ttl: number, clockValue: clock.Clock): StrictBounceCycleStore {
  return new CachedStrictBounceCycleStore(inner, cache.newTtlCache<StrictBounceCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects strict bounce cycles. Empty fields match all. */
export class StrictBounceCycleQuery {
  utmSource: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minEndsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictBounceCycle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictBounceCycle[]): StrictBounceCycle[] {
    const matched = collections.filter(items, (candidate: StrictBounceCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictBounceCycles(store: StrictBounceCycleStore, query: StrictBounceCycleQuery): StrictBounceCycle[] {
  return query.apply(store.list());
}
