import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBounceRequest } from "./rolling-bounce-request.js";

/** Keeps rolling bounce requests by code. */
export interface RollingBounceRequestStore {
  find(code: string): RollingBounceRequest | undefined;
  save(item: RollingBounceRequest): void;
  remove(code: string): boolean;
  list(): RollingBounceRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBounceRequestStore implements RollingBounceRequestStore {
  items: Map<string, RollingBounceRequest>;
  order: string[];

  constructor(items: Map<string, RollingBounceRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBounceRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBounceRequest): void {
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

  list(): RollingBounceRequest[] {
    const out: RollingBounceRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBounceRequestStore(): RollingBounceRequestStore {
  return new MemoryRollingBounceRequestStore(new Map<string, RollingBounceRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBounceRequestStore implements RollingBounceRequestStore {
  inner: RollingBounceRequestStore;
  cache: cache.TtlCache<RollingBounceRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBounceRequestStore,
    cacheValue: cache.TtlCache<RollingBounceRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBounceRequest | undefined {
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

  save(item: RollingBounceRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBounceRequest[] {
    return this.inner.list();
  }
}

export function newCachedRollingBounceRequestStore(inner: RollingBounceRequestStore, ttl: number, clockValue: clock.Clock): RollingBounceRequestStore {
  return new CachedRollingBounceRequestStore(
    inner,
    cache.newTtlCache<RollingBounceRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling bounce requests. Empty fields match all. */
export class RollingBounceRequestQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBounceRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBounceRequest[]): RollingBounceRequest[] {
    const matched = collections.filter(items, (candidate: RollingBounceRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBounceRequests(store: RollingBounceRequestStore, query: RollingBounceRequestQuery): RollingBounceRequest[] {
  return query.apply(store.list());
}
