import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedWindowRequest } from "./capped-window-request.js";

/** Keeps capped window requests by code. */
export interface CappedWindowRequestStore {
  find(code: string): CappedWindowRequest | undefined;
  save(item: CappedWindowRequest): void;
  remove(code: string): boolean;
  list(): CappedWindowRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedWindowRequestStore implements CappedWindowRequestStore {
  items: Map<string, CappedWindowRequest>;
  order: string[];

  constructor(items: Map<string, CappedWindowRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedWindowRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedWindowRequest): void {
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

  list(): CappedWindowRequest[] {
    const out: CappedWindowRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedWindowRequestStore(): CappedWindowRequestStore {
  return new MemoryCappedWindowRequestStore(new Map<string, CappedWindowRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedWindowRequestStore implements CappedWindowRequestStore {
  inner: CappedWindowRequestStore;
  cache: cache.TtlCache<CappedWindowRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedWindowRequestStore,
    cacheValue: cache.TtlCache<CappedWindowRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedWindowRequest | undefined {
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

  save(item: CappedWindowRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedWindowRequest[] {
    return this.inner.list();
  }
}

export function newCachedCappedWindowRequestStore(inner: CappedWindowRequestStore, ttl: number, clockValue: clock.Clock): CappedWindowRequestStore {
  return new CachedCappedWindowRequestStore(inner, cache.newTtlCache<CappedWindowRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects capped window requests. Empty fields match all. */
export class CappedWindowRequestQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedWindowRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedWindowRequest[]): CappedWindowRequest[] {
    const matched = collections.filter(items, (candidate: CappedWindowRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedWindowRequests(store: CappedWindowRequestStore, query: CappedWindowRequestQuery): CappedWindowRequest[] {
  return query.apply(store.list());
}
