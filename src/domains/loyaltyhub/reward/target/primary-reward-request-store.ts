import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryRewardRequest } from "./primary-reward-request.js";

/** Keeps primary reward requests by code. */
export interface PrimaryRewardRequestStore {
  find(code: string): PrimaryRewardRequest | undefined;
  save(item: PrimaryRewardRequest): void;
  remove(code: string): boolean;
  list(): PrimaryRewardRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryRewardRequestStore implements PrimaryRewardRequestStore {
  items: Map<string, PrimaryRewardRequest>;
  order: string[];

  constructor(items: Map<string, PrimaryRewardRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryRewardRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryRewardRequest): void {
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

  list(): PrimaryRewardRequest[] {
    const out: PrimaryRewardRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryRewardRequestStore(): PrimaryRewardRequestStore {
  return new MemoryPrimaryRewardRequestStore(new Map<string, PrimaryRewardRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryRewardRequestStore implements PrimaryRewardRequestStore {
  inner: PrimaryRewardRequestStore;
  cache: cache.TtlCache<PrimaryRewardRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryRewardRequestStore,
    cacheValue: cache.TtlCache<PrimaryRewardRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryRewardRequest | undefined {
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

  save(item: PrimaryRewardRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryRewardRequest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryRewardRequestStore(inner: PrimaryRewardRequestStore, ttl: number, clockValue: clock.Clock): PrimaryRewardRequestStore {
  return new CachedPrimaryRewardRequestStore(
    inner,
    cache.newTtlCache<PrimaryRewardRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary reward requests. Empty fields match all. */
export class PrimaryRewardRequestQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryRewardRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryRewardRequest[]): PrimaryRewardRequest[] {
    const matched = collections.filter(items, (candidate: PrimaryRewardRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryRewardRequests(store: PrimaryRewardRequestStore, query: PrimaryRewardRequestQuery): PrimaryRewardRequest[] {
  return query.apply(store.list());
}
