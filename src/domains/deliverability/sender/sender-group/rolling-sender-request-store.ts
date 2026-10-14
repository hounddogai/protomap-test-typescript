import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSenderRequest } from "./rolling-sender-request.js";

/** Keeps rolling sender requests by code. */
export interface RollingSenderRequestStore {
  find(code: string): RollingSenderRequest | undefined;
  save(item: RollingSenderRequest): void;
  remove(code: string): boolean;
  list(): RollingSenderRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSenderRequestStore implements RollingSenderRequestStore {
  items: Map<string, RollingSenderRequest>;
  order: string[];

  constructor(items: Map<string, RollingSenderRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSenderRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSenderRequest): void {
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

  list(): RollingSenderRequest[] {
    const out: RollingSenderRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSenderRequestStore(): RollingSenderRequestStore {
  return new MemoryRollingSenderRequestStore(new Map<string, RollingSenderRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSenderRequestStore implements RollingSenderRequestStore {
  inner: RollingSenderRequestStore;
  cache: cache.TtlCache<RollingSenderRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSenderRequestStore,
    cacheValue: cache.TtlCache<RollingSenderRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSenderRequest | undefined {
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

  save(item: RollingSenderRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSenderRequest[] {
    return this.inner.list();
  }
}

export function newCachedRollingSenderRequestStore(inner: RollingSenderRequestStore, ttl: number, clockValue: clock.Clock): RollingSenderRequestStore {
  return new CachedRollingSenderRequestStore(
    inner,
    cache.newTtlCache<RollingSenderRequest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling sender requests. Empty fields match all. */
export class RollingSenderRequestQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSenderRequest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSenderRequest[]): RollingSenderRequest[] {
    const matched = collections.filter(items, (candidate: RollingSenderRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSenderRequests(store: RollingSenderRequestStore, query: RollingSenderRequestQuery): RollingSenderRequest[] {
  return query.apply(store.list());
}
