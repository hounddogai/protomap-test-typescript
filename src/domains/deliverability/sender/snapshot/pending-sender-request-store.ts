import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSenderRequest } from "./pending-sender-request.js";

/** Keeps pending sender requests by code. */
export interface PendingSenderRequestStore {
  find(code: string): PendingSenderRequest | undefined;
  save(item: PendingSenderRequest): void;
  remove(code: string): boolean;
  list(): PendingSenderRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSenderRequestStore implements PendingSenderRequestStore {
  items: Map<string, PendingSenderRequest>;
  order: string[];

  constructor(items: Map<string, PendingSenderRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSenderRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSenderRequest): void {
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

  list(): PendingSenderRequest[] {
    const out: PendingSenderRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSenderRequestStore(): PendingSenderRequestStore {
  return new MemoryPendingSenderRequestStore(new Map<string, PendingSenderRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSenderRequestStore implements PendingSenderRequestStore {
  inner: PendingSenderRequestStore;
  cache: cache.TtlCache<PendingSenderRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSenderRequestStore,
    cacheValue: cache.TtlCache<PendingSenderRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSenderRequest | undefined {
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

  save(item: PendingSenderRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSenderRequest[] {
    return this.inner.list();
  }
}

export function newCachedPendingSenderRequestStore(inner: PendingSenderRequestStore, ttl: number, clockValue: clock.Clock): PendingSenderRequestStore {
  return new CachedPendingSenderRequestStore(
    inner,
    cache.newTtlCache<PendingSenderRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending sender requests. Empty fields match all. */
export class PendingSenderRequestQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSenderRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSenderRequest[]): PendingSenderRequest[] {
    const matched = collections.filter(items, (candidate: PendingSenderRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSenderRequests(store: PendingSenderRequestStore, query: PendingSenderRequestQuery): PendingSenderRequest[] {
  return query.apply(store.list());
}
