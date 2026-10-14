import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingRequest } from "./pacing-request.js";

/** Keeps pacing requests by code. */
export interface PacingRequestStore {
  find(code: string): PacingRequest | undefined;
  save(item: PacingRequest): void;
  remove(code: string): boolean;
  list(): PacingRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingRequestStore implements PacingRequestStore {
  items: Map<string, PacingRequest>;
  order: string[];

  constructor(items: Map<string, PacingRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingRequest): void {
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

  list(): PacingRequest[] {
    const out: PacingRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingRequestStore(): PacingRequestStore {
  return new MemoryPacingRequestStore(new Map<string, PacingRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingRequestStore implements PacingRequestStore {
  inner: PacingRequestStore;
  cache: cache.TtlCache<PacingRequest>;
  hits: number;
  misses: number;

  constructor(inner: PacingRequestStore, cacheValue: cache.TtlCache<PacingRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingRequest | undefined {
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

  save(item: PacingRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingRequest[] {
    return this.inner.list();
  }
}

export function newCachedPacingRequestStore(inner: PacingRequestStore, ttl: number, clockValue: clock.Clock): PacingRequestStore {
  return new CachedPacingRequestStore(inner, cache.newTtlCache<PacingRequest>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing requests. Empty fields match all. */
export class PacingRequestQuery {
  locale: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCost: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingRequest[]): PacingRequest[] {
    const matched = collections.filter(items, (candidate: PacingRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingRequests(store: PacingRequestStore, query: PacingRequestQuery): PacingRequest[] {
  return query.apply(store.list());
}
