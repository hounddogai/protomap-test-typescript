import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredWindowException } from "./tiered-window-exception.js";

/** Keeps tiered window exceptions by code. */
export interface TieredWindowExceptionStore {
  find(code: string): TieredWindowException | undefined;
  save(item: TieredWindowException): void;
  remove(code: string): boolean;
  list(): TieredWindowException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredWindowExceptionStore implements TieredWindowExceptionStore {
  items: Map<string, TieredWindowException>;
  order: string[];

  constructor(items: Map<string, TieredWindowException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredWindowException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredWindowException): void {
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

  list(): TieredWindowException[] {
    const out: TieredWindowException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredWindowExceptionStore(): TieredWindowExceptionStore {
  return new MemoryTieredWindowExceptionStore(new Map<string, TieredWindowException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredWindowExceptionStore implements TieredWindowExceptionStore {
  inner: TieredWindowExceptionStore;
  cache: cache.TtlCache<TieredWindowException>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredWindowExceptionStore,
    cacheValue: cache.TtlCache<TieredWindowException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredWindowException | undefined {
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

  save(item: TieredWindowException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredWindowException[] {
    return this.inner.list();
  }
}

export function newCachedTieredWindowExceptionStore(inner: TieredWindowExceptionStore, ttl: number, clockValue: clock.Clock): TieredWindowExceptionStore {
  return new CachedTieredWindowExceptionStore(
    inner,
    cache.newTtlCache<TieredWindowException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered window exceptions. Empty fields match all. */
export class TieredWindowExceptionQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredWindowException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredWindowException[]): TieredWindowException[] {
    const matched = collections.filter(items, (candidate: TieredWindowException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredWindowExceptions(store: TieredWindowExceptionStore, query: TieredWindowExceptionQuery): TieredWindowException[] {
  return query.apply(store.list());
}
