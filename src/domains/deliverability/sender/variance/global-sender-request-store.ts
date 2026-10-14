import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSenderRequest } from "./global-sender-request.js";

/** Keeps global sender requests by code. */
export interface GlobalSenderRequestStore {
  find(code: string): GlobalSenderRequest | undefined;
  save(item: GlobalSenderRequest): void;
  remove(code: string): boolean;
  list(): GlobalSenderRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSenderRequestStore implements GlobalSenderRequestStore {
  items: Map<string, GlobalSenderRequest>;
  order: string[];

  constructor(items: Map<string, GlobalSenderRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSenderRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSenderRequest): void {
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

  list(): GlobalSenderRequest[] {
    const out: GlobalSenderRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSenderRequestStore(): GlobalSenderRequestStore {
  return new MemoryGlobalSenderRequestStore(new Map<string, GlobalSenderRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSenderRequestStore implements GlobalSenderRequestStore {
  inner: GlobalSenderRequestStore;
  cache: cache.TtlCache<GlobalSenderRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSenderRequestStore,
    cacheValue: cache.TtlCache<GlobalSenderRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSenderRequest | undefined {
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

  save(item: GlobalSenderRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSenderRequest[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSenderRequestStore(inner: GlobalSenderRequestStore, ttl: number, clockValue: clock.Clock): GlobalSenderRequestStore {
  return new CachedGlobalSenderRequestStore(inner, cache.newTtlCache<GlobalSenderRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects global sender requests. Empty fields match all. */
export class GlobalSenderRequestQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSenderRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSenderRequest[]): GlobalSenderRequest[] {
    const matched = collections.filter(items, (candidate: GlobalSenderRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSenderRequests(store: GlobalSenderRequestStore, query: GlobalSenderRequestQuery): GlobalSenderRequest[] {
  return query.apply(store.list());
}
