import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingModelRequest } from "./pending-model-request.js";

/** Keeps pending model requests by code. */
export interface PendingModelRequestStore {
  find(code: string): PendingModelRequest | undefined;
  save(item: PendingModelRequest): void;
  remove(code: string): boolean;
  list(): PendingModelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingModelRequestStore implements PendingModelRequestStore {
  items: Map<string, PendingModelRequest>;
  order: string[];

  constructor(items: Map<string, PendingModelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingModelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingModelRequest): void {
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

  list(): PendingModelRequest[] {
    const out: PendingModelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingModelRequestStore(): PendingModelRequestStore {
  return new MemoryPendingModelRequestStore(new Map<string, PendingModelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingModelRequestStore implements PendingModelRequestStore {
  inner: PendingModelRequestStore;
  cache: cache.TtlCache<PendingModelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingModelRequestStore,
    cacheValue: cache.TtlCache<PendingModelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingModelRequest | undefined {
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

  save(item: PendingModelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingModelRequest[] {
    return this.inner.list();
  }
}

export function newCachedPendingModelRequestStore(inner: PendingModelRequestStore, ttl: number, clockValue: clock.Clock): PendingModelRequestStore {
  return new CachedPendingModelRequestStore(inner, cache.newTtlCache<PendingModelRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects pending model requests. Empty fields match all. */
export class PendingModelRequestQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingModelRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingModelRequest[]): PendingModelRequest[] {
    const matched = collections.filter(items, (candidate: PendingModelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingModelRequests(store: PendingModelRequestStore, query: PendingModelRequestQuery): PendingModelRequest[] {
  return query.apply(store.list());
}
