import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictActivationException } from "./strict-activation-exception.js";

/** Keeps strict activation exceptions by code. */
export interface StrictActivationExceptionStore {
  find(code: string): StrictActivationException | undefined;
  save(item: StrictActivationException): void;
  remove(code: string): boolean;
  list(): StrictActivationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictActivationExceptionStore implements StrictActivationExceptionStore {
  items: Map<string, StrictActivationException>;
  order: string[];

  constructor(items: Map<string, StrictActivationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictActivationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictActivationException): void {
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

  list(): StrictActivationException[] {
    const out: StrictActivationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictActivationExceptionStore(): StrictActivationExceptionStore {
  return new MemoryStrictActivationExceptionStore(new Map<string, StrictActivationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictActivationExceptionStore implements StrictActivationExceptionStore {
  inner: StrictActivationExceptionStore;
  cache: cache.TtlCache<StrictActivationException>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictActivationExceptionStore,
    cacheValue: cache.TtlCache<StrictActivationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictActivationException | undefined {
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

  save(item: StrictActivationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictActivationException[] {
    return this.inner.list();
  }
}

export function newCachedStrictActivationExceptionStore(inner: StrictActivationExceptionStore, ttl: number, clockValue: clock.Clock): StrictActivationExceptionStore {
  return new CachedStrictActivationExceptionStore(
    inner,
    cache.newTtlCache<StrictActivationException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict activation exceptions. Empty fields match all. */
export class StrictActivationExceptionQuery {
  country: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minClicks: number, statuses: string[], limit: number) {
    this.country = country;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictActivationException): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictActivationException[]): StrictActivationException[] {
    const matched = collections.filter(items, (candidate: StrictActivationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictActivationExceptions(store: StrictActivationExceptionStore, query: StrictActivationExceptionQuery): StrictActivationException[] {
  return query.apply(store.list());
}
