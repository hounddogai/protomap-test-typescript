import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupPreference } from "./warmup-preference.js";

/** Keeps warmup preferences by code. */
export interface WarmupPreferenceStore {
  find(code: string): WarmupPreference | undefined;
  save(item: WarmupPreference): void;
  remove(code: string): boolean;
  list(): WarmupPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupPreferenceStore implements WarmupPreferenceStore {
  items: Map<string, WarmupPreference>;
  order: string[];

  constructor(items: Map<string, WarmupPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupPreference): void {
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

  list(): WarmupPreference[] {
    const out: WarmupPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupPreferenceStore(): WarmupPreferenceStore {
  return new MemoryWarmupPreferenceStore(new Map<string, WarmupPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupPreferenceStore implements WarmupPreferenceStore {
  inner: WarmupPreferenceStore;
  cache: cache.TtlCache<WarmupPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupPreferenceStore,
    cacheValue: cache.TtlCache<WarmupPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupPreference | undefined {
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

  save(item: WarmupPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupPreference[] {
    return this.inner.list();
  }
}

export function newCachedWarmupPreferenceStore(inner: WarmupPreferenceStore, ttl: number, clockValue: clock.Clock): WarmupPreferenceStore {
  return new CachedWarmupPreferenceStore(inner, cache.newTtlCache<WarmupPreference>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup preferences. Empty fields match all. */
export class WarmupPreferenceQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupPreference[]): WarmupPreference[] {
    const matched = collections.filter(items, (candidate: WarmupPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupPreferences(store: WarmupPreferenceStore, query: WarmupPreferenceQuery): WarmupPreference[] {
  return query.apply(store.list());
}
