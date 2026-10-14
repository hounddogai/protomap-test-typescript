import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceCycle } from "./preference-cycle.js";

/** Keeps preference cycles by code. */
export interface PreferenceCycleStore {
  find(code: string): PreferenceCycle | undefined;
  save(item: PreferenceCycle): void;
  remove(code: string): boolean;
  list(): PreferenceCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceCycleStore implements PreferenceCycleStore {
  items: Map<string, PreferenceCycle>;
  order: string[];

  constructor(items: Map<string, PreferenceCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceCycle): void {
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

  list(): PreferenceCycle[] {
    const out: PreferenceCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceCycleStore(): PreferenceCycleStore {
  return new MemoryPreferenceCycleStore(new Map<string, PreferenceCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceCycleStore implements PreferenceCycleStore {
  inner: PreferenceCycleStore;
  cache: cache.TtlCache<PreferenceCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceCycleStore,
    cacheValue: cache.TtlCache<PreferenceCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceCycle | undefined {
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

  save(item: PreferenceCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceCycle[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceCycleStore(inner: PreferenceCycleStore, ttl: number, clockValue: clock.Clock): PreferenceCycleStore {
  return new CachedPreferenceCycleStore(inner, cache.newTtlCache<PreferenceCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects preference cycles. Empty fields match all. */
export class PreferenceCycleQuery {
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

  matches(item: PreferenceCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceCycle[]): PreferenceCycle[] {
    const matched = collections.filter(items, (candidate: PreferenceCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceCycles(store: PreferenceCycleStore, query: PreferenceCycleQuery): PreferenceCycle[] {
  return query.apply(store.list());
}
