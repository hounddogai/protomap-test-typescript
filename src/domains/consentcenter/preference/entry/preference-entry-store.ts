import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceEntry } from "./preference-entry.js";

/** Keeps preference entries by code. */
export interface PreferenceEntryStore {
  find(code: string): PreferenceEntry | undefined;
  save(item: PreferenceEntry): void;
  remove(code: string): boolean;
  list(): PreferenceEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceEntryStore implements PreferenceEntryStore {
  items: Map<string, PreferenceEntry>;
  order: string[];

  constructor(items: Map<string, PreferenceEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceEntry): void {
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

  list(): PreferenceEntry[] {
    const out: PreferenceEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceEntryStore(): PreferenceEntryStore {
  return new MemoryPreferenceEntryStore(new Map<string, PreferenceEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceEntryStore implements PreferenceEntryStore {
  inner: PreferenceEntryStore;
  cache: cache.TtlCache<PreferenceEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceEntryStore,
    cacheValue: cache.TtlCache<PreferenceEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceEntry | undefined {
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

  save(item: PreferenceEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceEntry[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceEntryStore(inner: PreferenceEntryStore, ttl: number, clockValue: clock.Clock): PreferenceEntryStore {
  return new CachedPreferenceEntryStore(inner, cache.newTtlCache<PreferenceEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects preference entries. Empty fields match all. */
export class PreferenceEntryQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceEntry[]): PreferenceEntry[] {
    const matched = collections.filter(items, (candidate: PreferenceEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceEntries(store: PreferenceEntryStore, query: PreferenceEntryQuery): PreferenceEntry[] {
  return query.apply(store.list());
}
