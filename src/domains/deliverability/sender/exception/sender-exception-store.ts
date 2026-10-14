import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderException } from "./sender-exception.js";

/** Keeps sender exceptions by code. */
export interface SenderExceptionStore {
  find(code: string): SenderException | undefined;
  save(item: SenderException): void;
  remove(code: string): boolean;
  list(): SenderException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderExceptionStore implements SenderExceptionStore {
  items: Map<string, SenderException>;
  order: string[];

  constructor(items: Map<string, SenderException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderException): void {
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

  list(): SenderException[] {
    const out: SenderException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderExceptionStore(): SenderExceptionStore {
  return new MemorySenderExceptionStore(new Map<string, SenderException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderExceptionStore implements SenderExceptionStore {
  inner: SenderExceptionStore;
  cache: cache.TtlCache<SenderException>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderExceptionStore,
    cacheValue: cache.TtlCache<SenderException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderException | undefined {
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

  save(item: SenderException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderException[] {
    return this.inner.list();
  }
}

export function newCachedSenderExceptionStore(inner: SenderExceptionStore, ttl: number, clockValue: clock.Clock): SenderExceptionStore {
  return new CachedSenderExceptionStore(inner, cache.newTtlCache<SenderException>(64, ttl, clockValue), 0, 0);
}

/** Selects sender exceptions. Empty fields match all. */
export class SenderExceptionQuery {
  locale: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCost: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderException[]): SenderException[] {
    const matched = collections.filter(items, (candidate: SenderException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderExceptions(store: SenderExceptionStore, query: SenderExceptionQuery): SenderException[] {
  return query.apply(store.list());
}
