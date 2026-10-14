import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatException } from "./csat-exception.js";

/** Keeps csat exceptions by code. */
export interface CsatExceptionStore {
  find(code: string): CsatException | undefined;
  save(item: CsatException): void;
  remove(code: string): boolean;
  list(): CsatException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatExceptionStore implements CsatExceptionStore {
  items: Map<string, CsatException>;
  order: string[];

  constructor(items: Map<string, CsatException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatException): void {
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

  list(): CsatException[] {
    const out: CsatException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatExceptionStore(): CsatExceptionStore {
  return new MemoryCsatExceptionStore(new Map<string, CsatException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatExceptionStore implements CsatExceptionStore {
  inner: CsatExceptionStore;
  cache: cache.TtlCache<CsatException>;
  hits: number;
  misses: number;

  constructor(inner: CsatExceptionStore, cacheValue: cache.TtlCache<CsatException>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatException | undefined {
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

  save(item: CsatException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatException[] {
    return this.inner.list();
  }
}

export function newCachedCsatExceptionStore(inner: CsatExceptionStore, ttl: number, clockValue: clock.Clock): CsatExceptionStore {
  return new CachedCsatExceptionStore(inner, cache.newTtlCache<CsatException>(64, ttl, clockValue), 0, 0);
}

/** Selects csat exceptions. Empty fields match all. */
export class CsatExceptionQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatException[]): CsatException[] {
    const matched = collections.filter(items, (candidate: CsatException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatExceptions(store: CsatExceptionStore, query: CsatExceptionQuery): CsatException[] {
  return query.apply(store.list());
}
