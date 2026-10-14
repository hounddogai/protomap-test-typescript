import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyWaitException } from "./legacy-wait-exception.js";

/** Keeps legacy wait exceptions by code. */
export interface LegacyWaitExceptionStore {
  find(code: string): LegacyWaitException | undefined;
  save(item: LegacyWaitException): void;
  remove(code: string): boolean;
  list(): LegacyWaitException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyWaitExceptionStore implements LegacyWaitExceptionStore {
  items: Map<string, LegacyWaitException>;
  order: string[];

  constructor(items: Map<string, LegacyWaitException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyWaitException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyWaitException): void {
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

  list(): LegacyWaitException[] {
    const out: LegacyWaitException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyWaitExceptionStore(): LegacyWaitExceptionStore {
  return new MemoryLegacyWaitExceptionStore(new Map<string, LegacyWaitException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyWaitExceptionStore implements LegacyWaitExceptionStore {
  inner: LegacyWaitExceptionStore;
  cache: cache.TtlCache<LegacyWaitException>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyWaitExceptionStore,
    cacheValue: cache.TtlCache<LegacyWaitException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyWaitException | undefined {
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

  save(item: LegacyWaitException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyWaitException[] {
    return this.inner.list();
  }
}

export function newCachedLegacyWaitExceptionStore(inner: LegacyWaitExceptionStore, ttl: number, clockValue: clock.Clock): LegacyWaitExceptionStore {
  return new CachedLegacyWaitExceptionStore(inner, cache.newTtlCache<LegacyWaitException>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy wait exceptions. Empty fields match all. */
export class LegacyWaitExceptionQuery {
  country: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSequence: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyWaitException): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyWaitException[]): LegacyWaitException[] {
    const matched = collections.filter(items, (candidate: LegacyWaitException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyWaitExceptions(store: LegacyWaitExceptionStore, query: LegacyWaitExceptionQuery): LegacyWaitException[] {
  return query.apply(store.list());
}
