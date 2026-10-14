import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowManifest } from "./window-manifest.js";

/** Keeps window manifests by code. */
export interface WindowManifestStore {
  find(code: string): WindowManifest | undefined;
  save(item: WindowManifest): void;
  remove(code: string): boolean;
  list(): WindowManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowManifestStore implements WindowManifestStore {
  items: Map<string, WindowManifest>;
  order: string[];

  constructor(items: Map<string, WindowManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowManifest): void {
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

  list(): WindowManifest[] {
    const out: WindowManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowManifestStore(): WindowManifestStore {
  return new MemoryWindowManifestStore(new Map<string, WindowManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowManifestStore implements WindowManifestStore {
  inner: WindowManifestStore;
  cache: cache.TtlCache<WindowManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowManifestStore,
    cacheValue: cache.TtlCache<WindowManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowManifest | undefined {
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

  save(item: WindowManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowManifest[] {
    return this.inner.list();
  }
}

export function newCachedWindowManifestStore(inner: WindowManifestStore, ttl: number, clockValue: clock.Clock): WindowManifestStore {
  return new CachedWindowManifestStore(inner, cache.newTtlCache<WindowManifest>(128, ttl, clockValue), 0, 0);
}

/** Selects window manifests. Empty fields match all. */
export class WindowManifestQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowManifest[]): WindowManifest[] {
    const matched = collections.filter(items, (candidate: WindowManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowManifests(store: WindowManifestStore, query: WindowManifestQuery): WindowManifest[] {
  return query.apply(store.list());
}
