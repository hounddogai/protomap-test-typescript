import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeRequest } from "./creative-request.js";

/** Keeps creative requests by code. */
export interface CreativeRequestStore {
  find(code: string): CreativeRequest | undefined;
  save(item: CreativeRequest): void;
  remove(code: string): boolean;
  list(): CreativeRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeRequestStore implements CreativeRequestStore {
  items: Map<string, CreativeRequest>;
  order: string[];

  constructor(items: Map<string, CreativeRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeRequest): void {
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

  list(): CreativeRequest[] {
    const out: CreativeRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeRequestStore(): CreativeRequestStore {
  return new MemoryCreativeRequestStore(new Map<string, CreativeRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeRequestStore implements CreativeRequestStore {
  inner: CreativeRequestStore;
  cache: cache.TtlCache<CreativeRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeRequestStore,
    cacheValue: cache.TtlCache<CreativeRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeRequest | undefined {
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

  save(item: CreativeRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeRequest[] {
    return this.inner.list();
  }
}

export function newCachedCreativeRequestStore(inner: CreativeRequestStore, ttl: number, clockValue: clock.Clock): CreativeRequestStore {
  return new CachedCreativeRequestStore(inner, cache.newTtlCache<CreativeRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects creative requests. Empty fields match all. */
export class CreativeRequestQuery {
  locale: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDiscount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeRequest[]): CreativeRequest[] {
    const matched = collections.filter(items, (candidate: CreativeRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeRequests(store: CreativeRequestStore, query: CreativeRequestQuery): CreativeRequest[] {
  return query.apply(store.list());
}
