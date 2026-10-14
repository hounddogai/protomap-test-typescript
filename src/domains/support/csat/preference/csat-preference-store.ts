import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatPreference } from "./csat-preference.js";

/** Keeps csat preferences by code. */
export interface CsatPreferenceStore {
  find(code: string): CsatPreference | undefined;
  save(item: CsatPreference): void;
  remove(code: string): boolean;
  list(): CsatPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatPreferenceStore implements CsatPreferenceStore {
  items: Map<string, CsatPreference>;
  order: string[];

  constructor(items: Map<string, CsatPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatPreference): void {
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

  list(): CsatPreference[] {
    const out: CsatPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatPreferenceStore(): CsatPreferenceStore {
  return new MemoryCsatPreferenceStore(new Map<string, CsatPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatPreferenceStore implements CsatPreferenceStore {
  inner: CsatPreferenceStore;
  cache: cache.TtlCache<CsatPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: CsatPreferenceStore,
    cacheValue: cache.TtlCache<CsatPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatPreference | undefined {
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

  save(item: CsatPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatPreference[] {
    return this.inner.list();
  }
}

export function newCachedCsatPreferenceStore(inner: CsatPreferenceStore, ttl: number, clockValue: clock.Clock): CsatPreferenceStore {
  return new CachedCsatPreferenceStore(inner, cache.newTtlCache<CsatPreference>(64, ttl, clockValue), 0, 0);
}

/** Selects csat preferences. Empty fields match all. */
export class CsatPreferenceQuery {
  channel: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCapacity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatPreference): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatPreference[]): CsatPreference[] {
    const matched = collections.filter(items, (candidate: CsatPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatPreferences(store: CsatPreferenceStore, query: CsatPreferenceQuery): CsatPreference[] {
  return query.apply(store.list());
}
