import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingReputationRequest } from "./rolling-reputation-request.js";

/** Keeps rolling reputation requests by code. */
export interface RollingReputationRequestStore {
  find(code: string): RollingReputationRequest | undefined;
  save(item: RollingReputationRequest): void;
  remove(code: string): boolean;
  list(): RollingReputationRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingReputationRequestStore implements RollingReputationRequestStore {
  items: Map<string, RollingReputationRequest>;
  order: string[];

  constructor(items: Map<string, RollingReputationRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingReputationRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingReputationRequest): void {
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

  list(): RollingReputationRequest[] {
    const out: RollingReputationRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingReputationRequestStore(): RollingReputationRequestStore {
  return new MemoryRollingReputationRequestStore(new Map<string, RollingReputationRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingReputationRequestStore implements RollingReputationRequestStore {
  inner: RollingReputationRequestStore;
  cache: cache.TtlCache<RollingReputationRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingReputationRequestStore,
    cacheValue: cache.TtlCache<RollingReputationRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingReputationRequest | undefined {
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

  save(item: RollingReputationRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingReputationRequest[] {
    return this.inner.list();
  }
}

export function newCachedRollingReputationRequestStore(inner: RollingReputationRequestStore, ttl: number, clockValue: clock.Clock): RollingReputationRequestStore {
  return new CachedRollingReputationRequestStore(
    inner,
    cache.newTtlCache<RollingReputationRequest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling reputation requests. Empty fields match all. */
export class RollingReputationRequestQuery {
  country: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSequence: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingReputationRequest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingReputationRequest[]): RollingReputationRequest[] {
    const matched = collections.filter(items, (candidate: RollingReputationRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingReputationRequests(store: RollingReputationRequestStore, query: RollingReputationRequestQuery): RollingReputationRequest[] {
  return query.apply(store.list());
}
