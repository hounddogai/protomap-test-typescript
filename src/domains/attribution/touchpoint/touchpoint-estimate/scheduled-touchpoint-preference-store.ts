import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledTouchpointPreference } from "./scheduled-touchpoint-preference.js";

/** Keeps scheduled touchpoint preferences by code. */
export interface ScheduledTouchpointPreferenceStore {
  find(code: string): ScheduledTouchpointPreference | undefined;
  save(item: ScheduledTouchpointPreference): void;
  remove(code: string): boolean;
  list(): ScheduledTouchpointPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledTouchpointPreferenceStore implements ScheduledTouchpointPreferenceStore {
  items: Map<string, ScheduledTouchpointPreference>;
  order: string[];

  constructor(items: Map<string, ScheduledTouchpointPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledTouchpointPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledTouchpointPreference): void {
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

  list(): ScheduledTouchpointPreference[] {
    const out: ScheduledTouchpointPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledTouchpointPreferenceStore(): ScheduledTouchpointPreferenceStore {
  return new MemoryScheduledTouchpointPreferenceStore(new Map<string, ScheduledTouchpointPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledTouchpointPreferenceStore implements ScheduledTouchpointPreferenceStore {
  inner: ScheduledTouchpointPreferenceStore;
  cache: cache.TtlCache<ScheduledTouchpointPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledTouchpointPreferenceStore,
    cacheValue: cache.TtlCache<ScheduledTouchpointPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledTouchpointPreference | undefined {
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

  save(item: ScheduledTouchpointPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledTouchpointPreference[] {
    return this.inner.list();
  }
}

export function newCachedScheduledTouchpointPreferenceStore(inner: ScheduledTouchpointPreferenceStore, ttl: number, clockValue: clock.Clock): ScheduledTouchpointPreferenceStore {
  return new CachedScheduledTouchpointPreferenceStore(
    inner,
    cache.newTtlCache<ScheduledTouchpointPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled touchpoint preferences. Empty fields match all. */
export class ScheduledTouchpointPreferenceQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledTouchpointPreference): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledTouchpointPreference[]): ScheduledTouchpointPreference[] {
    const matched = collections.filter(items, (candidate: ScheduledTouchpointPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledTouchpointPreferences(store: ScheduledTouchpointPreferenceStore, query: ScheduledTouchpointPreferenceQuery): ScheduledTouchpointPreference[] {
  return query.apply(store.list());
}
