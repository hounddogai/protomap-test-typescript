import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyCreativeWindow } from "./legacy-creative-window.js";

/** Keeps legacy creative windows by code. */
export interface LegacyCreativeWindowStore {
  find(code: string): LegacyCreativeWindow | undefined;
  save(item: LegacyCreativeWindow): void;
  remove(code: string): boolean;
  list(): LegacyCreativeWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyCreativeWindowStore implements LegacyCreativeWindowStore {
  items: Map<string, LegacyCreativeWindow>;
  order: string[];

  constructor(items: Map<string, LegacyCreativeWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyCreativeWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyCreativeWindow): void {
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

  list(): LegacyCreativeWindow[] {
    const out: LegacyCreativeWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyCreativeWindowStore(): LegacyCreativeWindowStore {
  return new MemoryLegacyCreativeWindowStore(new Map<string, LegacyCreativeWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyCreativeWindowStore implements LegacyCreativeWindowStore {
  inner: LegacyCreativeWindowStore;
  cache: cache.TtlCache<LegacyCreativeWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyCreativeWindowStore,
    cacheValue: cache.TtlCache<LegacyCreativeWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyCreativeWindow | undefined {
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

  save(item: LegacyCreativeWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyCreativeWindow[] {
    return this.inner.list();
  }
}

export function newCachedLegacyCreativeWindowStore(inner: LegacyCreativeWindowStore, ttl: number, clockValue: clock.Clock): LegacyCreativeWindowStore {
  return new CachedLegacyCreativeWindowStore(
    inner,
    cache.newTtlCache<LegacyCreativeWindow>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy creative windows. Empty fields match all. */
export class LegacyCreativeWindowQuery {
  country: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBatchSize: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyCreativeWindow): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyCreativeWindow[]): LegacyCreativeWindow[] {
    const matched = collections.filter(items, (candidate: LegacyCreativeWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyCreativeWindows(store: LegacyCreativeWindowStore, query: LegacyCreativeWindowQuery): LegacyCreativeWindow[] {
  return query.apply(store.list());
}
