import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgePreference } from "./nudge-preference.js";

/** Keeps nudge preferences by code. */
export interface NudgePreferenceStore {
  find(code: string): NudgePreference | undefined;
  save(item: NudgePreference): void;
  remove(code: string): boolean;
  list(): NudgePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgePreferenceStore implements NudgePreferenceStore {
  items: Map<string, NudgePreference>;
  order: string[];

  constructor(items: Map<string, NudgePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgePreference): void {
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

  list(): NudgePreference[] {
    const out: NudgePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgePreferenceStore(): NudgePreferenceStore {
  return new MemoryNudgePreferenceStore(new Map<string, NudgePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgePreferenceStore implements NudgePreferenceStore {
  inner: NudgePreferenceStore;
  cache: cache.TtlCache<NudgePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: NudgePreferenceStore,
    cacheValue: cache.TtlCache<NudgePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgePreference | undefined {
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

  save(item: NudgePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgePreference[] {
    return this.inner.list();
  }
}

export function newCachedNudgePreferenceStore(inner: NudgePreferenceStore, ttl: number, clockValue: clock.Clock): NudgePreferenceStore {
  return new CachedNudgePreferenceStore(inner, cache.newTtlCache<NudgePreference>(256, ttl, clockValue), 0, 0);
}

/** Selects nudge preferences. Empty fields match all. */
export class NudgePreferenceQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgePreference): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgePreference[]): NudgePreference[] {
    const matched = collections.filter(items, (candidate: NudgePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgePreferences(store: NudgePreferenceStore, query: NudgePreferenceQuery): NudgePreference[] {
  return query.apply(store.list());
}
