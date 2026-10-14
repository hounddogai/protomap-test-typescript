import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPreferenceRequest } from "./primary-preference-request.js";

/** Keeps primary preference requests by code. */
export interface PrimaryPreferenceRequestStore {
  find(code: string): PrimaryPreferenceRequest | undefined;
  save(item: PrimaryPreferenceRequest): void;
  remove(code: string): boolean;
  list(): PrimaryPreferenceRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPreferenceRequestStore implements PrimaryPreferenceRequestStore {
  items: Map<string, PrimaryPreferenceRequest>;
  order: string[];

  constructor(items: Map<string, PrimaryPreferenceRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPreferenceRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPreferenceRequest): void {
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

  list(): PrimaryPreferenceRequest[] {
    const out: PrimaryPreferenceRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPreferenceRequestStore(): PrimaryPreferenceRequestStore {
  return new MemoryPrimaryPreferenceRequestStore(new Map<string, PrimaryPreferenceRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPreferenceRequestStore implements PrimaryPreferenceRequestStore {
  inner: PrimaryPreferenceRequestStore;
  cache: cache.TtlCache<PrimaryPreferenceRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPreferenceRequestStore,
    cacheValue: cache.TtlCache<PrimaryPreferenceRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPreferenceRequest | undefined {
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

  save(item: PrimaryPreferenceRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPreferenceRequest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPreferenceRequestStore(inner: PrimaryPreferenceRequestStore, ttl: number, clockValue: clock.Clock): PrimaryPreferenceRequestStore {
  return new CachedPrimaryPreferenceRequestStore(
    inner,
    cache.newTtlCache<PrimaryPreferenceRequest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary preference requests. Empty fields match all. */
export class PrimaryPreferenceRequestQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPreferenceRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPreferenceRequest[]): PrimaryPreferenceRequest[] {
    const matched = collections.filter(items, (candidate: PrimaryPreferenceRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPreferenceRequests(store: PrimaryPreferenceRequestStore, query: PrimaryPreferenceRequestQuery): PrimaryPreferenceRequest[] {
  return query.apply(store.list());
}
