import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatRequest } from "./csat-request.js";

/** Keeps csat requests by code. */
export interface CsatRequestStore {
  find(code: string): CsatRequest | undefined;
  save(item: CsatRequest): void;
  remove(code: string): boolean;
  list(): CsatRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatRequestStore implements CsatRequestStore {
  items: Map<string, CsatRequest>;
  order: string[];

  constructor(items: Map<string, CsatRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatRequest): void {
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

  list(): CsatRequest[] {
    const out: CsatRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatRequestStore(): CsatRequestStore {
  return new MemoryCsatRequestStore(new Map<string, CsatRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatRequestStore implements CsatRequestStore {
  inner: CsatRequestStore;
  cache: cache.TtlCache<CsatRequest>;
  hits: number;
  misses: number;

  constructor(inner: CsatRequestStore, cacheValue: cache.TtlCache<CsatRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatRequest | undefined {
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

  save(item: CsatRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatRequest[] {
    return this.inner.list();
  }
}

export function newCachedCsatRequestStore(inner: CsatRequestStore, ttl: number, clockValue: clock.Clock): CsatRequestStore {
  return new CachedCsatRequestStore(inner, cache.newTtlCache<CsatRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects csat requests. Empty fields match all. */
export class CsatRequestQuery {
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

  matches(item: CsatRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatRequest[]): CsatRequest[] {
    const matched = collections.filter(items, (candidate: CsatRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatRequests(store: CsatRequestStore, query: CsatRequestQuery): CsatRequest[] {
  return query.apply(store.list());
}
