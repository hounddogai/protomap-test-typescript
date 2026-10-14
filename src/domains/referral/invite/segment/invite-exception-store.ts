import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteException } from "./invite-exception.js";

/** Keeps invite exceptions by code. */
export interface InviteExceptionStore {
  find(code: string): InviteException | undefined;
  save(item: InviteException): void;
  remove(code: string): boolean;
  list(): InviteException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteExceptionStore implements InviteExceptionStore {
  items: Map<string, InviteException>;
  order: string[];

  constructor(items: Map<string, InviteException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteException): void {
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

  list(): InviteException[] {
    const out: InviteException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteExceptionStore(): InviteExceptionStore {
  return new MemoryInviteExceptionStore(new Map<string, InviteException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteExceptionStore implements InviteExceptionStore {
  inner: InviteExceptionStore;
  cache: cache.TtlCache<InviteException>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteExceptionStore,
    cacheValue: cache.TtlCache<InviteException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteException | undefined {
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

  save(item: InviteException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteException[] {
    return this.inner.list();
  }
}

export function newCachedInviteExceptionStore(inner: InviteExceptionStore, ttl: number, clockValue: clock.Clock): InviteExceptionStore {
  return new CachedInviteExceptionStore(inner, cache.newTtlCache<InviteException>(128, ttl, clockValue), 0, 0);
}

/** Selects invite exceptions. Empty fields match all. */
export class InviteExceptionQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteException[]): InviteException[] {
    const matched = collections.filter(items, (candidate: InviteException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteExceptions(store: InviteExceptionStore, query: InviteExceptionQuery): InviteException[] {
  return query.apply(store.list());
}
