import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFunnelRequest } from "./scheduled-funnel-request.js";

/** Keeps scheduled funnel requests by code. */
export interface ScheduledFunnelRequestStore {
  find(code: string): ScheduledFunnelRequest | undefined;
  save(item: ScheduledFunnelRequest): void;
  remove(code: string): boolean;
  list(): ScheduledFunnelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFunnelRequestStore implements ScheduledFunnelRequestStore {
  items: Map<string, ScheduledFunnelRequest>;
  order: string[];

  constructor(items: Map<string, ScheduledFunnelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFunnelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFunnelRequest): void {
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

  list(): ScheduledFunnelRequest[] {
    const out: ScheduledFunnelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFunnelRequestStore(): ScheduledFunnelRequestStore {
  return new MemoryScheduledFunnelRequestStore(new Map<string, ScheduledFunnelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFunnelRequestStore implements ScheduledFunnelRequestStore {
  inner: ScheduledFunnelRequestStore;
  cache: cache.TtlCache<ScheduledFunnelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFunnelRequestStore,
    cacheValue: cache.TtlCache<ScheduledFunnelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFunnelRequest | undefined {
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

  save(item: ScheduledFunnelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFunnelRequest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFunnelRequestStore(inner: ScheduledFunnelRequestStore, ttl: number, clockValue: clock.Clock): ScheduledFunnelRequestStore {
  return new CachedScheduledFunnelRequestStore(
    inner,
    cache.newTtlCache<ScheduledFunnelRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled funnel requests. Empty fields match all. */
export class ScheduledFunnelRequestQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFunnelRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFunnelRequest[]): ScheduledFunnelRequest[] {
    const matched = collections.filter(items, (candidate: ScheduledFunnelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFunnelRequests(store: ScheduledFunnelRequestStore, query: ScheduledFunnelRequestQuery): ScheduledFunnelRequest[] {
  return query.apply(store.list());
}
