import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyException } from "./frequency-exception.js";

/** Keeps frequency exceptions by code. */
export interface FrequencyExceptionStore {
  find(code: string): FrequencyException | undefined;
  save(item: FrequencyException): void;
  remove(code: string): boolean;
  list(): FrequencyException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyExceptionStore implements FrequencyExceptionStore {
  items: Map<string, FrequencyException>;
  order: string[];

  constructor(items: Map<string, FrequencyException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyException): void {
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

  list(): FrequencyException[] {
    const out: FrequencyException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyExceptionStore(): FrequencyExceptionStore {
  return new MemoryFrequencyExceptionStore(new Map<string, FrequencyException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyExceptionStore implements FrequencyExceptionStore {
  inner: FrequencyExceptionStore;
  cache: cache.TtlCache<FrequencyException>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyExceptionStore,
    cacheValue: cache.TtlCache<FrequencyException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyException | undefined {
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

  save(item: FrequencyException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyException[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyExceptionStore(inner: FrequencyExceptionStore, ttl: number, clockValue: clock.Clock): FrequencyExceptionStore {
  return new CachedFrequencyExceptionStore(inner, cache.newTtlCache<FrequencyException>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency exceptions. Empty fields match all. */
export class FrequencyExceptionQuery {
  country: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMargin: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyException): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyException[]): FrequencyException[] {
    const matched = collections.filter(items, (candidate: FrequencyException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyExceptions(store: FrequencyExceptionStore, query: FrequencyExceptionQuery): FrequencyException[] {
  return query.apply(store.list());
}
