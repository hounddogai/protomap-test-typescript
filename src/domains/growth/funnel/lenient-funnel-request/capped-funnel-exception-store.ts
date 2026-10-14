import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFunnelException } from "./capped-funnel-exception.js";

/** Keeps capped funnel exceptions by code. */
export interface CappedFunnelExceptionStore {
  find(code: string): CappedFunnelException | undefined;
  save(item: CappedFunnelException): void;
  remove(code: string): boolean;
  list(): CappedFunnelException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFunnelExceptionStore implements CappedFunnelExceptionStore {
  items: Map<string, CappedFunnelException>;
  order: string[];

  constructor(items: Map<string, CappedFunnelException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFunnelException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFunnelException): void {
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

  list(): CappedFunnelException[] {
    const out: CappedFunnelException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFunnelExceptionStore(): CappedFunnelExceptionStore {
  return new MemoryCappedFunnelExceptionStore(new Map<string, CappedFunnelException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFunnelExceptionStore implements CappedFunnelExceptionStore {
  inner: CappedFunnelExceptionStore;
  cache: cache.TtlCache<CappedFunnelException>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFunnelExceptionStore,
    cacheValue: cache.TtlCache<CappedFunnelException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFunnelException | undefined {
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

  save(item: CappedFunnelException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFunnelException[] {
    return this.inner.list();
  }
}

export function newCachedCappedFunnelExceptionStore(inner: CappedFunnelExceptionStore, ttl: number, clockValue: clock.Clock): CappedFunnelExceptionStore {
  return new CachedCappedFunnelExceptionStore(
    inner,
    cache.newTtlCache<CappedFunnelException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped funnel exceptions. Empty fields match all. */
export class CappedFunnelExceptionQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFunnelException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFunnelException[]): CappedFunnelException[] {
    const matched = collections.filter(items, (candidate: CappedFunnelException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFunnelExceptions(store: CappedFunnelExceptionStore, query: CappedFunnelExceptionQuery): CappedFunnelException[] {
  return query.apply(store.list());
}
