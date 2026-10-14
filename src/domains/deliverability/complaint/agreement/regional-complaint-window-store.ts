import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalComplaintWindow } from "./regional-complaint-window.js";

/** Keeps regional complaint windows by code. */
export interface RegionalComplaintWindowStore {
  find(code: string): RegionalComplaintWindow | undefined;
  save(item: RegionalComplaintWindow): void;
  remove(code: string): boolean;
  list(): RegionalComplaintWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalComplaintWindowStore implements RegionalComplaintWindowStore {
  items: Map<string, RegionalComplaintWindow>;
  order: string[];

  constructor(items: Map<string, RegionalComplaintWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalComplaintWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalComplaintWindow): void {
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

  list(): RegionalComplaintWindow[] {
    const out: RegionalComplaintWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalComplaintWindowStore(): RegionalComplaintWindowStore {
  return new MemoryRegionalComplaintWindowStore(new Map<string, RegionalComplaintWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalComplaintWindowStore implements RegionalComplaintWindowStore {
  inner: RegionalComplaintWindowStore;
  cache: cache.TtlCache<RegionalComplaintWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalComplaintWindowStore,
    cacheValue: cache.TtlCache<RegionalComplaintWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalComplaintWindow | undefined {
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

  save(item: RegionalComplaintWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalComplaintWindow[] {
    return this.inner.list();
  }
}

export function newCachedRegionalComplaintWindowStore(inner: RegionalComplaintWindowStore, ttl: number, clockValue: clock.Clock): RegionalComplaintWindowStore {
  return new CachedRegionalComplaintWindowStore(
    inner,
    cache.newTtlCache<RegionalComplaintWindow>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional complaint windows. Empty fields match all. */
export class RegionalComplaintWindowQuery {
  locale: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalComplaintWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalComplaintWindow[]): RegionalComplaintWindow[] {
    const matched = collections.filter(items, (candidate: RegionalComplaintWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalComplaintWindows(store: RegionalComplaintWindowStore, query: RegionalComplaintWindowQuery): RegionalComplaintWindow[] {
  return query.apply(store.list());
}
