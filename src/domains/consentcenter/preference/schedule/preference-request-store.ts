import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceRequest } from "./preference-request.js";

/** Keeps preference requests by code. */
export interface PreferenceRequestStore {
  find(code: string): PreferenceRequest | undefined;
  save(item: PreferenceRequest): void;
  remove(code: string): boolean;
  list(): PreferenceRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceRequestStore implements PreferenceRequestStore {
  items: Map<string, PreferenceRequest>;
  order: string[];

  constructor(items: Map<string, PreferenceRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceRequest): void {
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

  list(): PreferenceRequest[] {
    const out: PreferenceRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceRequestStore(): PreferenceRequestStore {
  return new MemoryPreferenceRequestStore(new Map<string, PreferenceRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceRequestStore implements PreferenceRequestStore {
  inner: PreferenceRequestStore;
  cache: cache.TtlCache<PreferenceRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceRequestStore,
    cacheValue: cache.TtlCache<PreferenceRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceRequest | undefined {
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

  save(item: PreferenceRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceRequest[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceRequestStore(inner: PreferenceRequestStore, ttl: number, clockValue: clock.Clock): PreferenceRequestStore {
  return new CachedPreferenceRequestStore(inner, cache.newTtlCache<PreferenceRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects preference requests. Empty fields match all. */
export class PreferenceRequestQuery {
  locale: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMinimum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceRequest[]): PreferenceRequest[] {
    const matched = collections.filter(items, (candidate: PreferenceRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceRequests(store: PreferenceRequestStore, query: PreferenceRequestQuery): PreferenceRequest[] {
  return query.apply(store.list());
}
