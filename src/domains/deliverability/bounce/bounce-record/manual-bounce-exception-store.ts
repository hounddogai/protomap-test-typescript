import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBounceException } from "./manual-bounce-exception.js";

/** Keeps manual bounce exceptions by code. */
export interface ManualBounceExceptionStore {
  find(code: string): ManualBounceException | undefined;
  save(item: ManualBounceException): void;
  remove(code: string): boolean;
  list(): ManualBounceException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBounceExceptionStore implements ManualBounceExceptionStore {
  items: Map<string, ManualBounceException>;
  order: string[];

  constructor(items: Map<string, ManualBounceException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBounceException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBounceException): void {
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

  list(): ManualBounceException[] {
    const out: ManualBounceException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBounceExceptionStore(): ManualBounceExceptionStore {
  return new MemoryManualBounceExceptionStore(new Map<string, ManualBounceException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBounceExceptionStore implements ManualBounceExceptionStore {
  inner: ManualBounceExceptionStore;
  cache: cache.TtlCache<ManualBounceException>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBounceExceptionStore,
    cacheValue: cache.TtlCache<ManualBounceException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBounceException | undefined {
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

  save(item: ManualBounceException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBounceException[] {
    return this.inner.list();
  }
}

export function newCachedManualBounceExceptionStore(inner: ManualBounceExceptionStore, ttl: number, clockValue: clock.Clock): ManualBounceExceptionStore {
  return new CachedManualBounceExceptionStore(
    inner,
    cache.newTtlCache<ManualBounceException>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual bounce exceptions. Empty fields match all. */
export class ManualBounceExceptionQuery {
  source: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRevision: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBounceException): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBounceException[]): ManualBounceException[] {
    const matched = collections.filter(items, (candidate: ManualBounceException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBounceExceptions(store: ManualBounceExceptionStore, query: ManualBounceExceptionQuery): ManualBounceException[] {
  return query.apply(store.list());
}
