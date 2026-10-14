import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyProfile } from "./frequency-profile.js";

/** Keeps frequency profiles by code. */
export interface FrequencyProfileStore {
  find(code: string): FrequencyProfile | undefined;
  save(item: FrequencyProfile): void;
  remove(code: string): boolean;
  list(): FrequencyProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyProfileStore implements FrequencyProfileStore {
  items: Map<string, FrequencyProfile>;
  order: string[];

  constructor(items: Map<string, FrequencyProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyProfile): void {
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

  list(): FrequencyProfile[] {
    const out: FrequencyProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyProfileStore(): FrequencyProfileStore {
  return new MemoryFrequencyProfileStore(new Map<string, FrequencyProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyProfileStore implements FrequencyProfileStore {
  inner: FrequencyProfileStore;
  cache: cache.TtlCache<FrequencyProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyProfileStore,
    cacheValue: cache.TtlCache<FrequencyProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyProfile | undefined {
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

  save(item: FrequencyProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyProfile[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyProfileStore(inner: FrequencyProfileStore, ttl: number, clockValue: clock.Clock): FrequencyProfileStore {
  return new CachedFrequencyProfileStore(inner, cache.newTtlCache<FrequencyProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects frequency profiles. Empty fields match all. */
export class FrequencyProfileQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyProfile[]): FrequencyProfile[] {
    const matched = collections.filter(items, (candidate: FrequencyProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyProfiles(store: FrequencyProfileStore, query: FrequencyProfileQuery): FrequencyProfile[] {
  return query.apply(store.list());
}
