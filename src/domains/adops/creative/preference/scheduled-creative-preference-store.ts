import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCreativePreference } from "./scheduled-creative-preference.js";

/** Keeps scheduled creative preferences by code. */
export interface ScheduledCreativePreferenceStore {
  find(code: string): ScheduledCreativePreference | undefined;
  save(item: ScheduledCreativePreference): void;
  remove(code: string): boolean;
  list(): ScheduledCreativePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCreativePreferenceStore implements ScheduledCreativePreferenceStore {
  items: Map<string, ScheduledCreativePreference>;
  order: string[];

  constructor(items: Map<string, ScheduledCreativePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCreativePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCreativePreference): void {
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

  list(): ScheduledCreativePreference[] {
    const out: ScheduledCreativePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCreativePreferenceStore(): ScheduledCreativePreferenceStore {
  return new MemoryScheduledCreativePreferenceStore(new Map<string, ScheduledCreativePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCreativePreferenceStore implements ScheduledCreativePreferenceStore {
  inner: ScheduledCreativePreferenceStore;
  cache: cache.TtlCache<ScheduledCreativePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCreativePreferenceStore,
    cacheValue: cache.TtlCache<ScheduledCreativePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCreativePreference | undefined {
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

  save(item: ScheduledCreativePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCreativePreference[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCreativePreferenceStore(inner: ScheduledCreativePreferenceStore, ttl: number, clockValue: clock.Clock): ScheduledCreativePreferenceStore {
  return new CachedScheduledCreativePreferenceStore(
    inner,
    cache.newTtlCache<ScheduledCreativePreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled creative preferences. Empty fields match all. */
export class ScheduledCreativePreferenceQuery {
  unit: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRatio: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCreativePreference): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCreativePreference[]): ScheduledCreativePreference[] {
    const matched = collections.filter(items, (candidate: ScheduledCreativePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCreativePreferences(store: ScheduledCreativePreferenceStore, query: ScheduledCreativePreferenceQuery): ScheduledCreativePreference[] {
  return query.apply(store.list());
}
