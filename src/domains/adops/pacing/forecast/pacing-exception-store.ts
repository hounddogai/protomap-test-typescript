import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingException } from "./pacing-exception.js";

/** Keeps pacing exceptions by code. */
export interface PacingExceptionStore {
  find(code: string): PacingException | undefined;
  save(item: PacingException): void;
  remove(code: string): boolean;
  list(): PacingException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingExceptionStore implements PacingExceptionStore {
  items: Map<string, PacingException>;
  order: string[];

  constructor(items: Map<string, PacingException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingException): void {
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

  list(): PacingException[] {
    const out: PacingException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingExceptionStore(): PacingExceptionStore {
  return new MemoryPacingExceptionStore(new Map<string, PacingException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingExceptionStore implements PacingExceptionStore {
  inner: PacingExceptionStore;
  cache: cache.TtlCache<PacingException>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingExceptionStore,
    cacheValue: cache.TtlCache<PacingException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingException | undefined {
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

  save(item: PacingException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingException[] {
    return this.inner.list();
  }
}

export function newCachedPacingExceptionStore(inner: PacingExceptionStore, ttl: number, clockValue: clock.Clock): PacingExceptionStore {
  return new CachedPacingExceptionStore(inner, cache.newTtlCache<PacingException>(64, ttl, clockValue), 0, 0);
}

/** Selects pacing exceptions. Empty fields match all. */
export class PacingExceptionQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingException[]): PacingException[] {
    const matched = collections.filter(items, (candidate: PacingException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingExceptions(store: PacingExceptionStore, query: PacingExceptionQuery): PacingException[] {
  return query.apply(store.list());
}
