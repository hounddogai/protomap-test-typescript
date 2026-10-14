import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintWindow } from "./complaint-window.js";

/** Keeps complaint windows by code. */
export interface ComplaintWindowStore {
  find(code: string): ComplaintWindow | undefined;
  save(item: ComplaintWindow): void;
  remove(code: string): boolean;
  list(): ComplaintWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintWindowStore implements ComplaintWindowStore {
  items: Map<string, ComplaintWindow>;
  order: string[];

  constructor(items: Map<string, ComplaintWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintWindow): void {
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

  list(): ComplaintWindow[] {
    const out: ComplaintWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintWindowStore(): ComplaintWindowStore {
  return new MemoryComplaintWindowStore(new Map<string, ComplaintWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintWindowStore implements ComplaintWindowStore {
  inner: ComplaintWindowStore;
  cache: cache.TtlCache<ComplaintWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintWindowStore,
    cacheValue: cache.TtlCache<ComplaintWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintWindow | undefined {
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

  save(item: ComplaintWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintWindow[] {
    return this.inner.list();
  }
}

export function newCachedComplaintWindowStore(inner: ComplaintWindowStore, ttl: number, clockValue: clock.Clock): ComplaintWindowStore {
  return new CachedComplaintWindowStore(inner, cache.newTtlCache<ComplaintWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects complaint windows. Empty fields match all. */
export class ComplaintWindowQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintWindow[]): ComplaintWindow[] {
    const matched = collections.filter(items, (candidate: ComplaintWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintWindows(store: ComplaintWindowStore, query: ComplaintWindowQuery): ComplaintWindow[] {
  return query.apply(store.list());
}
