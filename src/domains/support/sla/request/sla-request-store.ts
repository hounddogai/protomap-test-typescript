import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaRequest } from "./sla-request.js";

/** Keeps sla requests by code. */
export interface SlaRequestStore {
  find(code: string): SlaRequest | undefined;
  save(item: SlaRequest): void;
  remove(code: string): boolean;
  list(): SlaRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaRequestStore implements SlaRequestStore {
  items: Map<string, SlaRequest>;
  order: string[];

  constructor(items: Map<string, SlaRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaRequest): void {
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

  list(): SlaRequest[] {
    const out: SlaRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaRequestStore(): SlaRequestStore {
  return new MemorySlaRequestStore(new Map<string, SlaRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaRequestStore implements SlaRequestStore {
  inner: SlaRequestStore;
  cache: cache.TtlCache<SlaRequest>;
  hits: number;
  misses: number;

  constructor(inner: SlaRequestStore, cacheValue: cache.TtlCache<SlaRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaRequest | undefined {
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

  save(item: SlaRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaRequest[] {
    return this.inner.list();
  }
}

export function newCachedSlaRequestStore(inner: SlaRequestStore, ttl: number, clockValue: clock.Clock): SlaRequestStore {
  return new CachedSlaRequestStore(inner, cache.newTtlCache<SlaRequest>(512, ttl, clockValue), 0, 0);
}

/** Selects sla requests. Empty fields match all. */
export class SlaRequestQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaRequest[]): SlaRequest[] {
    const matched = collections.filter(items, (candidate: SlaRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaRequests(store: SlaRequestStore, query: SlaRequestQuery): SlaRequest[] {
  return query.apply(store.list());
}
