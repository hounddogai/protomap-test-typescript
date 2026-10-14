import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingOptOutException } from "./rolling-opt-out-exception.js";

/** Keeps rolling opt out exceptions by code. */
export interface RollingOptOutExceptionStore {
  find(code: string): RollingOptOutException | undefined;
  save(item: RollingOptOutException): void;
  remove(code: string): boolean;
  list(): RollingOptOutException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingOptOutExceptionStore implements RollingOptOutExceptionStore {
  items: Map<string, RollingOptOutException>;
  order: string[];

  constructor(items: Map<string, RollingOptOutException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingOptOutException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingOptOutException): void {
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

  list(): RollingOptOutException[] {
    const out: RollingOptOutException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingOptOutExceptionStore(): RollingOptOutExceptionStore {
  return new MemoryRollingOptOutExceptionStore(new Map<string, RollingOptOutException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingOptOutExceptionStore implements RollingOptOutExceptionStore {
  inner: RollingOptOutExceptionStore;
  cache: cache.TtlCache<RollingOptOutException>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingOptOutExceptionStore,
    cacheValue: cache.TtlCache<RollingOptOutException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingOptOutException | undefined {
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

  save(item: RollingOptOutException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingOptOutException[] {
    return this.inner.list();
  }
}

export function newCachedRollingOptOutExceptionStore(inner: RollingOptOutExceptionStore, ttl: number, clockValue: clock.Clock): RollingOptOutExceptionStore {
  return new CachedRollingOptOutExceptionStore(
    inner,
    cache.newTtlCache<RollingOptOutException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling opt out exceptions. Empty fields match all. */
export class RollingOptOutExceptionQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingOptOutException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingOptOutException[]): RollingOptOutException[] {
    const matched = collections.filter(items, (candidate: RollingOptOutException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingOptOutExceptions(store: RollingOptOutExceptionStore, query: RollingOptOutExceptionQuery): RollingOptOutException[] {
  return query.apply(store.list());
}
