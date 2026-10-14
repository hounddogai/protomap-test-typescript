import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyBadgePreference } from "./legacy-badge-preference.js";

/** Keeps legacy badge preferences by code. */
export interface LegacyBadgePreferenceStore {
  find(code: string): LegacyBadgePreference | undefined;
  save(item: LegacyBadgePreference): void;
  remove(code: string): boolean;
  list(): LegacyBadgePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyBadgePreferenceStore implements LegacyBadgePreferenceStore {
  items: Map<string, LegacyBadgePreference>;
  order: string[];

  constructor(items: Map<string, LegacyBadgePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyBadgePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyBadgePreference): void {
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

  list(): LegacyBadgePreference[] {
    const out: LegacyBadgePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyBadgePreferenceStore(): LegacyBadgePreferenceStore {
  return new MemoryLegacyBadgePreferenceStore(new Map<string, LegacyBadgePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyBadgePreferenceStore implements LegacyBadgePreferenceStore {
  inner: LegacyBadgePreferenceStore;
  cache: cache.TtlCache<LegacyBadgePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyBadgePreferenceStore,
    cacheValue: cache.TtlCache<LegacyBadgePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyBadgePreference | undefined {
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

  save(item: LegacyBadgePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyBadgePreference[] {
    return this.inner.list();
  }
}

export function newCachedLegacyBadgePreferenceStore(inner: LegacyBadgePreferenceStore, ttl: number, clockValue: clock.Clock): LegacyBadgePreferenceStore {
  return new CachedLegacyBadgePreferenceStore(
    inner,
    cache.newTtlCache<LegacyBadgePreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy badge preferences. Empty fields match all. */
export class LegacyBadgePreferenceQuery {
  name: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMargin: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyBadgePreference): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyBadgePreference[]): LegacyBadgePreference[] {
    const matched = collections.filter(items, (candidate: LegacyBadgePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyBadgePreferences(store: LegacyBadgePreferenceStore, query: LegacyBadgePreferenceQuery): LegacyBadgePreference[] {
  return query.apply(store.list());
}
