import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPacingRequest } from "./tiered-pacing-request.js";

/** Keeps tiered pacing requests by code. */
export interface TieredPacingRequestStore {
  find(code: string): TieredPacingRequest | undefined;
  save(item: TieredPacingRequest): void;
  remove(code: string): boolean;
  list(): TieredPacingRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPacingRequestStore implements TieredPacingRequestStore {
  items: Map<string, TieredPacingRequest>;
  order: string[];

  constructor(items: Map<string, TieredPacingRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPacingRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPacingRequest): void {
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

  list(): TieredPacingRequest[] {
    const out: TieredPacingRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPacingRequestStore(): TieredPacingRequestStore {
  return new MemoryTieredPacingRequestStore(new Map<string, TieredPacingRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPacingRequestStore implements TieredPacingRequestStore {
  inner: TieredPacingRequestStore;
  cache: cache.TtlCache<TieredPacingRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPacingRequestStore,
    cacheValue: cache.TtlCache<TieredPacingRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPacingRequest | undefined {
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

  save(item: TieredPacingRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPacingRequest[] {
    return this.inner.list();
  }
}

export function newCachedTieredPacingRequestStore(inner: TieredPacingRequestStore, ttl: number, clockValue: clock.Clock): TieredPacingRequestStore {
  return new CachedTieredPacingRequestStore(inner, cache.newTtlCache<TieredPacingRequest>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered pacing requests. Empty fields match all. */
export class TieredPacingRequestQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPacingRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPacingRequest[]): TieredPacingRequest[] {
    const matched = collections.filter(items, (candidate: TieredPacingRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPacingRequests(store: TieredPacingRequestStore, query: TieredPacingRequestQuery): TieredPacingRequest[] {
  return query.apply(store.list());
}
