import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativePreference } from "./creative-preference.js";

/** Keeps creative preferences by code. */
export interface CreativePreferenceStore {
  find(code: string): CreativePreference | undefined;
  save(item: CreativePreference): void;
  remove(code: string): boolean;
  list(): CreativePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativePreferenceStore implements CreativePreferenceStore {
  items: Map<string, CreativePreference>;
  order: string[];

  constructor(items: Map<string, CreativePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativePreference): void {
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

  list(): CreativePreference[] {
    const out: CreativePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativePreferenceStore(): CreativePreferenceStore {
  return new MemoryCreativePreferenceStore(new Map<string, CreativePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativePreferenceStore implements CreativePreferenceStore {
  inner: CreativePreferenceStore;
  cache: cache.TtlCache<CreativePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativePreferenceStore,
    cacheValue: cache.TtlCache<CreativePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativePreference | undefined {
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

  save(item: CreativePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativePreference[] {
    return this.inner.list();
  }
}

export function newCachedCreativePreferenceStore(inner: CreativePreferenceStore, ttl: number, clockValue: clock.Clock): CreativePreferenceStore {
  return new CachedCreativePreferenceStore(inner, cache.newTtlCache<CreativePreference>(64, ttl, clockValue), 0, 0);
}

/** Selects creative preferences. Empty fields match all. */
export class CreativePreferenceQuery {
  source: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBid: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativePreference): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativePreference[]): CreativePreference[] {
    const matched = collections.filter(items, (candidate: CreativePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativePreferences(store: CreativePreferenceStore, query: CreativePreferenceQuery): CreativePreference[] {
  return query.apply(store.list());
}
