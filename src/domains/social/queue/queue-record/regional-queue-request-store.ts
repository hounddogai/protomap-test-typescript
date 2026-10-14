import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalQueueRequest } from "./regional-queue-request.js";

/** Keeps regional queue requests by code. */
export interface RegionalQueueRequestStore {
  find(code: string): RegionalQueueRequest | undefined;
  save(item: RegionalQueueRequest): void;
  remove(code: string): boolean;
  list(): RegionalQueueRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalQueueRequestStore implements RegionalQueueRequestStore {
  items: Map<string, RegionalQueueRequest>;
  order: string[];

  constructor(items: Map<string, RegionalQueueRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalQueueRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalQueueRequest): void {
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

  list(): RegionalQueueRequest[] {
    const out: RegionalQueueRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalQueueRequestStore(): RegionalQueueRequestStore {
  return new MemoryRegionalQueueRequestStore(new Map<string, RegionalQueueRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalQueueRequestStore implements RegionalQueueRequestStore {
  inner: RegionalQueueRequestStore;
  cache: cache.TtlCache<RegionalQueueRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalQueueRequestStore,
    cacheValue: cache.TtlCache<RegionalQueueRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalQueueRequest | undefined {
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

  save(item: RegionalQueueRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalQueueRequest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalQueueRequestStore(inner: RegionalQueueRequestStore, ttl: number, clockValue: clock.Clock): RegionalQueueRequestStore {
  return new CachedRegionalQueueRequestStore(inner, cache.newTtlCache<RegionalQueueRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects regional queue requests. Empty fields match all. */
export class RegionalQueueRequestQuery {
  label: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSequence: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalQueueRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalQueueRequest[]): RegionalQueueRequest[] {
    const matched = collections.filter(items, (candidate: RegionalQueueRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalQueueRequests(store: RegionalQueueRequestStore, query: RegionalQueueRequestQuery): RegionalQueueRequest[] {
  return query.apply(store.list());
}
