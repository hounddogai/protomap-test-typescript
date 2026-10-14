import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPacingRequest } from "./global-pacing-request.js";

/** Keeps global pacing requests by code. */
export interface GlobalPacingRequestStore {
  find(code: string): GlobalPacingRequest | undefined;
  save(item: GlobalPacingRequest): void;
  remove(code: string): boolean;
  list(): GlobalPacingRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPacingRequestStore implements GlobalPacingRequestStore {
  items: Map<string, GlobalPacingRequest>;
  order: string[];

  constructor(items: Map<string, GlobalPacingRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPacingRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPacingRequest): void {
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

  list(): GlobalPacingRequest[] {
    const out: GlobalPacingRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPacingRequestStore(): GlobalPacingRequestStore {
  return new MemoryGlobalPacingRequestStore(new Map<string, GlobalPacingRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPacingRequestStore implements GlobalPacingRequestStore {
  inner: GlobalPacingRequestStore;
  cache: cache.TtlCache<GlobalPacingRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPacingRequestStore,
    cacheValue: cache.TtlCache<GlobalPacingRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPacingRequest | undefined {
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

  save(item: GlobalPacingRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPacingRequest[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPacingRequestStore(inner: GlobalPacingRequestStore, ttl: number, clockValue: clock.Clock): GlobalPacingRequestStore {
  return new CachedGlobalPacingRequestStore(inner, cache.newTtlCache<GlobalPacingRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects global pacing requests. Empty fields match all. */
export class GlobalPacingRequestQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPacingRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPacingRequest[]): GlobalPacingRequest[] {
    const matched = collections.filter(items, (candidate: GlobalPacingRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPacingRequests(store: GlobalPacingRequestStore, query: GlobalPacingRequestQuery): GlobalPacingRequest[] {
  return query.apply(store.list());
}
