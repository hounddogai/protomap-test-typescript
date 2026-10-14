import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyBundle } from "./journey-bundle.js";

/** Keeps journey bundles by code. */
export interface JourneyBundleStore {
  find(code: string): JourneyBundle | undefined;
  save(item: JourneyBundle): void;
  remove(code: string): boolean;
  list(): JourneyBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyBundleStore implements JourneyBundleStore {
  items: Map<string, JourneyBundle>;
  order: string[];

  constructor(items: Map<string, JourneyBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyBundle): void {
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

  list(): JourneyBundle[] {
    const out: JourneyBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyBundleStore(): JourneyBundleStore {
  return new MemoryJourneyBundleStore(new Map<string, JourneyBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyBundleStore implements JourneyBundleStore {
  inner: JourneyBundleStore;
  cache: cache.TtlCache<JourneyBundle>;
  hits: number;
  misses: number;

  constructor(inner: JourneyBundleStore, cacheValue: cache.TtlCache<JourneyBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyBundle | undefined {
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

  save(item: JourneyBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyBundle[] {
    return this.inner.list();
  }
}

export function newCachedJourneyBundleStore(inner: JourneyBundleStore, ttl: number, clockValue: clock.Clock): JourneyBundleStore {
  return new CachedJourneyBundleStore(inner, cache.newTtlCache<JourneyBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects journey bundles. Empty fields match all. */
export class JourneyBundleQuery {
  utmSource: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCapacity: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyBundle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyBundle[]): JourneyBundle[] {
    const matched = collections.filter(items, (candidate: JourneyBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyBundles(store: JourneyBundleStore, query: JourneyBundleQuery): JourneyBundle[] {
  return query.apply(store.list());
}
