import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowGroup } from "./window-group.js";

/** Keeps window groups by code. */
export interface WindowGroupStore {
  find(code: string): WindowGroup | undefined;
  save(item: WindowGroup): void;
  remove(code: string): boolean;
  list(): WindowGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowGroupStore implements WindowGroupStore {
  items: Map<string, WindowGroup>;
  order: string[];

  constructor(items: Map<string, WindowGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowGroup): void {
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

  list(): WindowGroup[] {
    const out: WindowGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowGroupStore(): WindowGroupStore {
  return new MemoryWindowGroupStore(new Map<string, WindowGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowGroupStore implements WindowGroupStore {
  inner: WindowGroupStore;
  cache: cache.TtlCache<WindowGroup>;
  hits: number;
  misses: number;

  constructor(inner: WindowGroupStore, cacheValue: cache.TtlCache<WindowGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowGroup | undefined {
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

  save(item: WindowGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowGroup[] {
    return this.inner.list();
  }
}

export function newCachedWindowGroupStore(inner: WindowGroupStore, ttl: number, clockValue: clock.Clock): WindowGroupStore {
  return new CachedWindowGroupStore(inner, cache.newTtlCache<WindowGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects window groups. Empty fields match all. */
export class WindowGroupQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowGroup[]): WindowGroup[] {
    const matched = collections.filter(items, (candidate: WindowGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowGroups(store: WindowGroupStore, query: WindowGroupQuery): WindowGroup[] {
  return query.apply(store.list());
}
