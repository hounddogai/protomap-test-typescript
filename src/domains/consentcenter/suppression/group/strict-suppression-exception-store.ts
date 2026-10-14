import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictSuppressionException } from "./strict-suppression-exception.js";

/** Keeps strict suppression exceptions by code. */
export interface StrictSuppressionExceptionStore {
  find(code: string): StrictSuppressionException | undefined;
  save(item: StrictSuppressionException): void;
  remove(code: string): boolean;
  list(): StrictSuppressionException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictSuppressionExceptionStore implements StrictSuppressionExceptionStore {
  items: Map<string, StrictSuppressionException>;
  order: string[];

  constructor(items: Map<string, StrictSuppressionException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictSuppressionException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictSuppressionException): void {
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

  list(): StrictSuppressionException[] {
    const out: StrictSuppressionException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictSuppressionExceptionStore(): StrictSuppressionExceptionStore {
  return new MemoryStrictSuppressionExceptionStore(new Map<string, StrictSuppressionException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictSuppressionExceptionStore implements StrictSuppressionExceptionStore {
  inner: StrictSuppressionExceptionStore;
  cache: cache.TtlCache<StrictSuppressionException>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictSuppressionExceptionStore,
    cacheValue: cache.TtlCache<StrictSuppressionException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictSuppressionException | undefined {
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

  save(item: StrictSuppressionException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictSuppressionException[] {
    return this.inner.list();
  }
}

export function newCachedStrictSuppressionExceptionStore(inner: StrictSuppressionExceptionStore, ttl: number, clockValue: clock.Clock): StrictSuppressionExceptionStore {
  return new CachedStrictSuppressionExceptionStore(
    inner,
    cache.newTtlCache<StrictSuppressionException>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict suppression exceptions. Empty fields match all. */
export class StrictSuppressionExceptionQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictSuppressionException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictSuppressionException[]): StrictSuppressionException[] {
    const matched = collections.filter(items, (candidate: StrictSuppressionException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictSuppressionExceptions(store: StrictSuppressionExceptionStore, query: StrictSuppressionExceptionQuery): StrictSuppressionException[] {
  return query.apply(store.list());
}
