import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalFunnelRequest } from "./regional-funnel-request.js";

/** Keeps regional funnel requests by code. */
export interface RegionalFunnelRequestStore {
  find(code: string): RegionalFunnelRequest | undefined;
  save(item: RegionalFunnelRequest): void;
  remove(code: string): boolean;
  list(): RegionalFunnelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalFunnelRequestStore implements RegionalFunnelRequestStore {
  items: Map<string, RegionalFunnelRequest>;
  order: string[];

  constructor(items: Map<string, RegionalFunnelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalFunnelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalFunnelRequest): void {
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

  list(): RegionalFunnelRequest[] {
    const out: RegionalFunnelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalFunnelRequestStore(): RegionalFunnelRequestStore {
  return new MemoryRegionalFunnelRequestStore(new Map<string, RegionalFunnelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalFunnelRequestStore implements RegionalFunnelRequestStore {
  inner: RegionalFunnelRequestStore;
  cache: cache.TtlCache<RegionalFunnelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalFunnelRequestStore,
    cacheValue: cache.TtlCache<RegionalFunnelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalFunnelRequest | undefined {
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

  save(item: RegionalFunnelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalFunnelRequest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalFunnelRequestStore(inner: RegionalFunnelRequestStore, ttl: number, clockValue: clock.Clock): RegionalFunnelRequestStore {
  return new CachedRegionalFunnelRequestStore(
    inner,
    cache.newTtlCache<RegionalFunnelRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional funnel requests. Empty fields match all. */
export class RegionalFunnelRequestQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalFunnelRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalFunnelRequest[]): RegionalFunnelRequest[] {
    const matched = collections.filter(items, (candidate: RegionalFunnelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalFunnelRequests(store: RegionalFunnelRequestStore, query: RegionalFunnelRequestQuery): RegionalFunnelRequest[] {
  return query.apply(store.list());
}
