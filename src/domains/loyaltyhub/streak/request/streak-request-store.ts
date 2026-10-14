import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakRequest } from "./streak-request.js";

/** Keeps streak requests by code. */
export interface StreakRequestStore {
  find(code: string): StreakRequest | undefined;
  save(item: StreakRequest): void;
  remove(code: string): boolean;
  list(): StreakRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakRequestStore implements StreakRequestStore {
  items: Map<string, StreakRequest>;
  order: string[];

  constructor(items: Map<string, StreakRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakRequest): void {
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

  list(): StreakRequest[] {
    const out: StreakRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakRequestStore(): StreakRequestStore {
  return new MemoryStreakRequestStore(new Map<string, StreakRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakRequestStore implements StreakRequestStore {
  inner: StreakRequestStore;
  cache: cache.TtlCache<StreakRequest>;
  hits: number;
  misses: number;

  constructor(inner: StreakRequestStore, cacheValue: cache.TtlCache<StreakRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakRequest | undefined {
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

  save(item: StreakRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakRequest[] {
    return this.inner.list();
  }
}

export function newCachedStreakRequestStore(inner: StreakRequestStore, ttl: number, clockValue: clock.Clock): StreakRequestStore {
  return new CachedStreakRequestStore(inner, cache.newTtlCache<StreakRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects streak requests. Empty fields match all. */
export class StreakRequestQuery {
  channel: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSendAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakRequest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakRequest[]): StreakRequest[] {
    const matched = collections.filter(items, (candidate: StreakRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakRequests(store: StreakRequestStore, query: StreakRequestQuery): StreakRequest[] {
  return query.apply(store.list());
}
