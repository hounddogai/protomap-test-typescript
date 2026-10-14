import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSlaPreference } from "./default-sla-preference.js";

/** Keeps default sla preferences by code. */
export interface DefaultSlaPreferenceStore {
  find(code: string): DefaultSlaPreference | undefined;
  save(item: DefaultSlaPreference): void;
  remove(code: string): boolean;
  list(): DefaultSlaPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSlaPreferenceStore implements DefaultSlaPreferenceStore {
  items: Map<string, DefaultSlaPreference>;
  order: string[];

  constructor(items: Map<string, DefaultSlaPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSlaPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSlaPreference): void {
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

  list(): DefaultSlaPreference[] {
    const out: DefaultSlaPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSlaPreferenceStore(): DefaultSlaPreferenceStore {
  return new MemoryDefaultSlaPreferenceStore(new Map<string, DefaultSlaPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSlaPreferenceStore implements DefaultSlaPreferenceStore {
  inner: DefaultSlaPreferenceStore;
  cache: cache.TtlCache<DefaultSlaPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSlaPreferenceStore,
    cacheValue: cache.TtlCache<DefaultSlaPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSlaPreference | undefined {
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

  save(item: DefaultSlaPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSlaPreference[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSlaPreferenceStore(inner: DefaultSlaPreferenceStore, ttl: number, clockValue: clock.Clock): DefaultSlaPreferenceStore {
  return new CachedDefaultSlaPreferenceStore(
    inner,
    cache.newTtlCache<DefaultSlaPreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default sla preferences. Empty fields match all. */
export class DefaultSlaPreferenceQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSlaPreference): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSlaPreference[]): DefaultSlaPreference[] {
    const matched = collections.filter(items, (candidate: DefaultSlaPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSlaPreferences(store: DefaultSlaPreferenceStore, query: DefaultSlaPreferenceQuery): DefaultSlaPreference[] {
  return query.apply(store.list());
}
