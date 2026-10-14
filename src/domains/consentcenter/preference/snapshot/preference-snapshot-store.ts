import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceSnapshot } from "./preference-snapshot.js";

/** Keeps preference snapshots by code. */
export interface PreferenceSnapshotStore {
  find(code: string): PreferenceSnapshot | undefined;
  save(item: PreferenceSnapshot): void;
  remove(code: string): boolean;
  list(): PreferenceSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceSnapshotStore implements PreferenceSnapshotStore {
  items: Map<string, PreferenceSnapshot>;
  order: string[];

  constructor(items: Map<string, PreferenceSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceSnapshot): void {
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

  list(): PreferenceSnapshot[] {
    const out: PreferenceSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceSnapshotStore(): PreferenceSnapshotStore {
  return new MemoryPreferenceSnapshotStore(new Map<string, PreferenceSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceSnapshotStore implements PreferenceSnapshotStore {
  inner: PreferenceSnapshotStore;
  cache: cache.TtlCache<PreferenceSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceSnapshotStore,
    cacheValue: cache.TtlCache<PreferenceSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceSnapshot | undefined {
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

  save(item: PreferenceSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceSnapshotStore(inner: PreferenceSnapshotStore, ttl: number, clockValue: clock.Clock): PreferenceSnapshotStore {
  return new CachedPreferenceSnapshotStore(inner, cache.newTtlCache<PreferenceSnapshot>(128, ttl, clockValue), 0, 0);
}

/** Selects preference snapshots. Empty fields match all. */
export class PreferenceSnapshotQuery {
  locale: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWindowDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceSnapshot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceSnapshot[]): PreferenceSnapshot[] {
    const matched = collections.filter(items, (candidate: PreferenceSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceSnapshots(store: PreferenceSnapshotStore, query: PreferenceSnapshotQuery): PreferenceSnapshot[] {
  return query.apply(store.list());
}
