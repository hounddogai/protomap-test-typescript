import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeWindow } from "./creative-window.js";

/** Keeps creative windows by code. */
export interface CreativeWindowStore {
  find(code: string): CreativeWindow | undefined;
  save(item: CreativeWindow): void;
  remove(code: string): boolean;
  list(): CreativeWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeWindowStore implements CreativeWindowStore {
  items: Map<string, CreativeWindow>;
  order: string[];

  constructor(items: Map<string, CreativeWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeWindow): void {
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

  list(): CreativeWindow[] {
    const out: CreativeWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeWindowStore(): CreativeWindowStore {
  return new MemoryCreativeWindowStore(new Map<string, CreativeWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeWindowStore implements CreativeWindowStore {
  inner: CreativeWindowStore;
  cache: cache.TtlCache<CreativeWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeWindowStore,
    cacheValue: cache.TtlCache<CreativeWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeWindow | undefined {
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

  save(item: CreativeWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeWindow[] {
    return this.inner.list();
  }
}

export function newCachedCreativeWindowStore(inner: CreativeWindowStore, ttl: number, clockValue: clock.Clock): CreativeWindowStore {
  return new CachedCreativeWindowStore(inner, cache.newTtlCache<CreativeWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects creative windows. Empty fields match all. */
export class CreativeWindowQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeWindow[]): CreativeWindow[] {
    const matched = collections.filter(items, (candidate: CreativeWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeWindows(store: CreativeWindowStore, query: CreativeWindowQuery): CreativeWindow[] {
  return query.apply(store.list());
}
