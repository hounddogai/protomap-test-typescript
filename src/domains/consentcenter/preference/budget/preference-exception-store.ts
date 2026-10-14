import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceException } from "./preference-exception.js";

/** Keeps preference exceptions by code. */
export interface PreferenceExceptionStore {
  find(code: string): PreferenceException | undefined;
  save(item: PreferenceException): void;
  remove(code: string): boolean;
  list(): PreferenceException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceExceptionStore implements PreferenceExceptionStore {
  items: Map<string, PreferenceException>;
  order: string[];

  constructor(items: Map<string, PreferenceException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceException): void {
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

  list(): PreferenceException[] {
    const out: PreferenceException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceExceptionStore(): PreferenceExceptionStore {
  return new MemoryPreferenceExceptionStore(new Map<string, PreferenceException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceExceptionStore implements PreferenceExceptionStore {
  inner: PreferenceExceptionStore;
  cache: cache.TtlCache<PreferenceException>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceExceptionStore,
    cacheValue: cache.TtlCache<PreferenceException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceException | undefined {
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

  save(item: PreferenceException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceException[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceExceptionStore(inner: PreferenceExceptionStore, ttl: number, clockValue: clock.Clock): PreferenceExceptionStore {
  return new CachedPreferenceExceptionStore(inner, cache.newTtlCache<PreferenceException>(512, ttl, clockValue), 0, 0);
}

/** Selects preference exceptions. Empty fields match all. */
export class PreferenceExceptionQuery {
  segment: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceException): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceException[]): PreferenceException[] {
    const matched = collections.filter(items, (candidate: PreferenceException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceExceptions(store: PreferenceExceptionStore, query: PreferenceExceptionQuery): PreferenceException[] {
  return query.apply(store.list());
}
