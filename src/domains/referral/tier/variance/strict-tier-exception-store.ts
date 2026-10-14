import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictTierException } from "./strict-tier-exception.js";

/** Keeps strict tier exceptions by code. */
export interface StrictTierExceptionStore {
  find(code: string): StrictTierException | undefined;
  save(item: StrictTierException): void;
  remove(code: string): boolean;
  list(): StrictTierException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictTierExceptionStore implements StrictTierExceptionStore {
  items: Map<string, StrictTierException>;
  order: string[];

  constructor(items: Map<string, StrictTierException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictTierException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictTierException): void {
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

  list(): StrictTierException[] {
    const out: StrictTierException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictTierExceptionStore(): StrictTierExceptionStore {
  return new MemoryStrictTierExceptionStore(new Map<string, StrictTierException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictTierExceptionStore implements StrictTierExceptionStore {
  inner: StrictTierExceptionStore;
  cache: cache.TtlCache<StrictTierException>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictTierExceptionStore,
    cacheValue: cache.TtlCache<StrictTierException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictTierException | undefined {
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

  save(item: StrictTierException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictTierException[] {
    return this.inner.list();
  }
}

export function newCachedStrictTierExceptionStore(inner: StrictTierExceptionStore, ttl: number, clockValue: clock.Clock): StrictTierExceptionStore {
  return new CachedStrictTierExceptionStore(inner, cache.newTtlCache<StrictTierException>(128, ttl, clockValue), 0, 0);
}

/** Selects strict tier exceptions. Empty fields match all. */
export class StrictTierExceptionQuery {
  channel: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictTierException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictTierException[]): StrictTierException[] {
    const matched = collections.filter(items, (candidate: StrictTierException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictTierExceptions(store: StrictTierExceptionStore, query: StrictTierExceptionQuery): StrictTierException[] {
  return query.apply(store.list());
}
