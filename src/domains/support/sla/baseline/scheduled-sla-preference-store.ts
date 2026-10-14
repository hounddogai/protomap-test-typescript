import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSlaPreference } from "./scheduled-sla-preference.js";

/** Keeps scheduled sla preferences by code. */
export interface ScheduledSlaPreferenceStore {
  find(code: string): ScheduledSlaPreference | undefined;
  save(item: ScheduledSlaPreference): void;
  remove(code: string): boolean;
  list(): ScheduledSlaPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSlaPreferenceStore implements ScheduledSlaPreferenceStore {
  items: Map<string, ScheduledSlaPreference>;
  order: string[];

  constructor(items: Map<string, ScheduledSlaPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSlaPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSlaPreference): void {
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

  list(): ScheduledSlaPreference[] {
    const out: ScheduledSlaPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSlaPreferenceStore(): ScheduledSlaPreferenceStore {
  return new MemoryScheduledSlaPreferenceStore(new Map<string, ScheduledSlaPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSlaPreferenceStore implements ScheduledSlaPreferenceStore {
  inner: ScheduledSlaPreferenceStore;
  cache: cache.TtlCache<ScheduledSlaPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSlaPreferenceStore,
    cacheValue: cache.TtlCache<ScheduledSlaPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSlaPreference | undefined {
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

  save(item: ScheduledSlaPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSlaPreference[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSlaPreferenceStore(inner: ScheduledSlaPreferenceStore, ttl: number, clockValue: clock.Clock): ScheduledSlaPreferenceStore {
  return new CachedScheduledSlaPreferenceStore(
    inner,
    cache.newTtlCache<ScheduledSlaPreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled sla preferences. Empty fields match all. */
export class ScheduledSlaPreferenceQuery {
  utmSource: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minThreshold: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSlaPreference): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSlaPreference[]): ScheduledSlaPreference[] {
    const matched = collections.filter(items, (candidate: ScheduledSlaPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSlaPreferences(store: ScheduledSlaPreferenceStore, query: ScheduledSlaPreferenceQuery): ScheduledSlaPreference[] {
  return query.apply(store.list());
}
