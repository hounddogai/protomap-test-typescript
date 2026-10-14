import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceWindow } from "./preference-window.js";

/** Keeps preference windows by code. */
export interface PreferenceWindowStore {
  find(code: string): PreferenceWindow | undefined;
  save(item: PreferenceWindow): void;
  remove(code: string): boolean;
  list(): PreferenceWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceWindowStore implements PreferenceWindowStore {
  items: Map<string, PreferenceWindow>;
  order: string[];

  constructor(items: Map<string, PreferenceWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceWindow): void {
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

  list(): PreferenceWindow[] {
    const out: PreferenceWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceWindowStore(): PreferenceWindowStore {
  return new MemoryPreferenceWindowStore(new Map<string, PreferenceWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceWindowStore implements PreferenceWindowStore {
  inner: PreferenceWindowStore;
  cache: cache.TtlCache<PreferenceWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceWindowStore,
    cacheValue: cache.TtlCache<PreferenceWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceWindow | undefined {
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

  save(item: PreferenceWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceWindow[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceWindowStore(inner: PreferenceWindowStore, ttl: number, clockValue: clock.Clock): PreferenceWindowStore {
  return new CachedPreferenceWindowStore(inner, cache.newTtlCache<PreferenceWindow>(256, ttl, clockValue), 0, 0);
}

/** Selects preference windows. Empty fields match all. */
export class PreferenceWindowQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceWindow): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceWindow[]): PreferenceWindow[] {
    const matched = collections.filter(items, (candidate: PreferenceWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceWindows(store: PreferenceWindowStore, query: PreferenceWindowQuery): PreferenceWindow[] {
  return query.apply(store.list());
}
