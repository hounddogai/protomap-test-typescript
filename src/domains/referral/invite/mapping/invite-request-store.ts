import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteRequest } from "./invite-request.js";

/** Keeps invite requests by code. */
export interface InviteRequestStore {
  find(code: string): InviteRequest | undefined;
  save(item: InviteRequest): void;
  remove(code: string): boolean;
  list(): InviteRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteRequestStore implements InviteRequestStore {
  items: Map<string, InviteRequest>;
  order: string[];

  constructor(items: Map<string, InviteRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteRequest): void {
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

  list(): InviteRequest[] {
    const out: InviteRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteRequestStore(): InviteRequestStore {
  return new MemoryInviteRequestStore(new Map<string, InviteRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteRequestStore implements InviteRequestStore {
  inner: InviteRequestStore;
  cache: cache.TtlCache<InviteRequest>;
  hits: number;
  misses: number;

  constructor(inner: InviteRequestStore, cacheValue: cache.TtlCache<InviteRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteRequest | undefined {
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

  save(item: InviteRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteRequest[] {
    return this.inner.list();
  }
}

export function newCachedInviteRequestStore(inner: InviteRequestStore, ttl: number, clockValue: clock.Clock): InviteRequestStore {
  return new CachedInviteRequestStore(inner, cache.newTtlCache<InviteRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects invite requests. Empty fields match all. */
export class InviteRequestQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteRequest[]): InviteRequest[] {
    const matched = collections.filter(items, (candidate: InviteRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteRequests(store: InviteRequestStore, query: InviteRequestQuery): InviteRequest[] {
  return query.apply(store.list());
}
