import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictFrequencyProfile } from "./strict-frequency-profile.js";

/** Keeps strict frequency profiles by code. */
export interface StrictFrequencyProfileStore {
  find(code: string): StrictFrequencyProfile | undefined;
  save(item: StrictFrequencyProfile): void;
  remove(code: string): boolean;
  list(): StrictFrequencyProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictFrequencyProfileStore implements StrictFrequencyProfileStore {
  items: Map<string, StrictFrequencyProfile>;
  order: string[];

  constructor(items: Map<string, StrictFrequencyProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictFrequencyProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictFrequencyProfile): void {
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

  list(): StrictFrequencyProfile[] {
    const out: StrictFrequencyProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictFrequencyProfileStore(): StrictFrequencyProfileStore {
  return new MemoryStrictFrequencyProfileStore(new Map<string, StrictFrequencyProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictFrequencyProfileStore implements StrictFrequencyProfileStore {
  inner: StrictFrequencyProfileStore;
  cache: cache.TtlCache<StrictFrequencyProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictFrequencyProfileStore,
    cacheValue: cache.TtlCache<StrictFrequencyProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictFrequencyProfile | undefined {
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

  save(item: StrictFrequencyProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictFrequencyProfile[] {
    return this.inner.list();
  }
}

export function newCachedStrictFrequencyProfileStore(inner: StrictFrequencyProfileStore, ttl: number, clockValue: clock.Clock): StrictFrequencyProfileStore {
  return new CachedStrictFrequencyProfileStore(
    inner,
    cache.newTtlCache<StrictFrequencyProfile>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict frequency profiles. Empty fields match all. */
export class StrictFrequencyProfileQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictFrequencyProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictFrequencyProfile[]): StrictFrequencyProfile[] {
    const matched = collections.filter(items, (candidate: StrictFrequencyProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictFrequencyProfiles(store: StrictFrequencyProfileStore, query: StrictFrequencyProfileQuery): StrictFrequencyProfile[] {
  return query.apply(store.list());
}
