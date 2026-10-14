import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientFunnelRequest } from "./lenient-funnel-request.js";

/** Keeps lenient funnel requests by code. */
export interface LenientFunnelRequestStore {
  find(code: string): LenientFunnelRequest | undefined;
  save(item: LenientFunnelRequest): void;
  remove(code: string): boolean;
  list(): LenientFunnelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientFunnelRequestStore implements LenientFunnelRequestStore {
  items: Map<string, LenientFunnelRequest>;
  order: string[];

  constructor(items: Map<string, LenientFunnelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientFunnelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientFunnelRequest): void {
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

  list(): LenientFunnelRequest[] {
    const out: LenientFunnelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientFunnelRequestStore(): LenientFunnelRequestStore {
  return new MemoryLenientFunnelRequestStore(new Map<string, LenientFunnelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientFunnelRequestStore implements LenientFunnelRequestStore {
  inner: LenientFunnelRequestStore;
  cache: cache.TtlCache<LenientFunnelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientFunnelRequestStore,
    cacheValue: cache.TtlCache<LenientFunnelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientFunnelRequest | undefined {
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

  save(item: LenientFunnelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientFunnelRequest[] {
    return this.inner.list();
  }
}

export function newCachedLenientFunnelRequestStore(inner: LenientFunnelRequestStore, ttl: number, clockValue: clock.Clock): LenientFunnelRequestStore {
  return new CachedLenientFunnelRequestStore(
    inner,
    cache.newTtlCache<LenientFunnelRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient funnel requests. Empty fields match all. */
export class LenientFunnelRequestQuery {
  unit: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minSequence: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientFunnelRequest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientFunnelRequest[]): LenientFunnelRequest[] {
    const matched = collections.filter(items, (candidate: LenientFunnelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientFunnelRequests(store: LenientFunnelRequestStore, query: LenientFunnelRequestQuery): LenientFunnelRequest[] {
  return query.apply(store.list());
}
