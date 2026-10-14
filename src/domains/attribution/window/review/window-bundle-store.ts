import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowBundle } from "./window-bundle.js";

/** Keeps window bundles by code. */
export interface WindowBundleStore {
  find(code: string): WindowBundle | undefined;
  save(item: WindowBundle): void;
  remove(code: string): boolean;
  list(): WindowBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowBundleStore implements WindowBundleStore {
  items: Map<string, WindowBundle>;
  order: string[];

  constructor(items: Map<string, WindowBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowBundle): void {
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

  list(): WindowBundle[] {
    const out: WindowBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowBundleStore(): WindowBundleStore {
  return new MemoryWindowBundleStore(new Map<string, WindowBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowBundleStore implements WindowBundleStore {
  inner: WindowBundleStore;
  cache: cache.TtlCache<WindowBundle>;
  hits: number;
  misses: number;

  constructor(inner: WindowBundleStore, cacheValue: cache.TtlCache<WindowBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowBundle | undefined {
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

  save(item: WindowBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowBundle[] {
    return this.inner.list();
  }
}

export function newCachedWindowBundleStore(inner: WindowBundleStore, ttl: number, clockValue: clock.Clock): WindowBundleStore {
  return new CachedWindowBundleStore(inner, cache.newTtlCache<WindowBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects window bundles. Empty fields match all. */
export class WindowBundleQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowBundle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowBundle[]): WindowBundle[] {
    const matched = collections.filter(items, (candidate: WindowBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowBundles(store: WindowBundleStore, query: WindowBundleQuery): WindowBundle[] {
  return query.apply(store.list());
}
