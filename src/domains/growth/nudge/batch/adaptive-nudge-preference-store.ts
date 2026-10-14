import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

/** Keeps adaptive nudge preferences by code. */
export interface AdaptiveNudgePreferenceStore {
  find(code: string): AdaptiveNudgePreference | undefined;
  save(item: AdaptiveNudgePreference): void;
  remove(code: string): boolean;
  list(): AdaptiveNudgePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveNudgePreferenceStore implements AdaptiveNudgePreferenceStore {
  items: Map<string, AdaptiveNudgePreference>;
  order: string[];

  constructor(items: Map<string, AdaptiveNudgePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveNudgePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveNudgePreference): void {
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

  list(): AdaptiveNudgePreference[] {
    const out: AdaptiveNudgePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveNudgePreferenceStore(): AdaptiveNudgePreferenceStore {
  return new MemoryAdaptiveNudgePreferenceStore(new Map<string, AdaptiveNudgePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveNudgePreferenceStore implements AdaptiveNudgePreferenceStore {
  inner: AdaptiveNudgePreferenceStore;
  cache: cache.TtlCache<AdaptiveNudgePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveNudgePreferenceStore,
    cacheValue: cache.TtlCache<AdaptiveNudgePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveNudgePreference | undefined {
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

  save(item: AdaptiveNudgePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveNudgePreference[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveNudgePreferenceStore(inner: AdaptiveNudgePreferenceStore, ttl: number, clockValue: clock.Clock): AdaptiveNudgePreferenceStore {
  return new CachedAdaptiveNudgePreferenceStore(
    inner,
    cache.newTtlCache<AdaptiveNudgePreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive nudge preferences. Empty fields match all. */
export class AdaptiveNudgePreferenceQuery {
  source: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveNudgePreference): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveNudgePreference[]): AdaptiveNudgePreference[] {
    const matched = collections.filter(items, (candidate: AdaptiveNudgePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveNudgePreferences(store: AdaptiveNudgePreferenceStore, query: AdaptiveNudgePreferenceQuery): AdaptiveNudgePreference[] {
  return query.apply(store.list());
}
