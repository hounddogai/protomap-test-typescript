import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveMacroProfile } from "./adaptive-macro-profile.js";

/** Keeps adaptive macro profiles by code. */
export interface AdaptiveMacroProfileStore {
  find(code: string): AdaptiveMacroProfile | undefined;
  save(item: AdaptiveMacroProfile): void;
  remove(code: string): boolean;
  list(): AdaptiveMacroProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveMacroProfileStore implements AdaptiveMacroProfileStore {
  items: Map<string, AdaptiveMacroProfile>;
  order: string[];

  constructor(items: Map<string, AdaptiveMacroProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveMacroProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveMacroProfile): void {
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

  list(): AdaptiveMacroProfile[] {
    const out: AdaptiveMacroProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveMacroProfileStore(): AdaptiveMacroProfileStore {
  return new MemoryAdaptiveMacroProfileStore(new Map<string, AdaptiveMacroProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveMacroProfileStore implements AdaptiveMacroProfileStore {
  inner: AdaptiveMacroProfileStore;
  cache: cache.TtlCache<AdaptiveMacroProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveMacroProfileStore,
    cacheValue: cache.TtlCache<AdaptiveMacroProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveMacroProfile | undefined {
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

  save(item: AdaptiveMacroProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveMacroProfile[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveMacroProfileStore(inner: AdaptiveMacroProfileStore, ttl: number, clockValue: clock.Clock): AdaptiveMacroProfileStore {
  return new CachedAdaptiveMacroProfileStore(
    inner,
    cache.newTtlCache<AdaptiveMacroProfile>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive macro profiles. Empty fields match all. */
export class AdaptiveMacroProfileQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveMacroProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveMacroProfile[]): AdaptiveMacroProfile[] {
    const matched = collections.filter(items, (candidate: AdaptiveMacroProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveMacroProfiles(store: AdaptiveMacroProfileStore, query: AdaptiveMacroProfileQuery): AdaptiveMacroProfile[] {
  return query.apply(store.list());
}
