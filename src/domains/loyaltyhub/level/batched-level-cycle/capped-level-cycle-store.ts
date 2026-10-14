import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedLevelCycle } from "./capped-level-cycle.js";

/** Keeps capped level cycles by code. */
export interface CappedLevelCycleStore {
  find(code: string): CappedLevelCycle | undefined;
  save(item: CappedLevelCycle): void;
  remove(code: string): boolean;
  list(): CappedLevelCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedLevelCycleStore implements CappedLevelCycleStore {
  items: Map<string, CappedLevelCycle>;
  order: string[];

  constructor(items: Map<string, CappedLevelCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedLevelCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedLevelCycle): void {
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

  list(): CappedLevelCycle[] {
    const out: CappedLevelCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedLevelCycleStore(): CappedLevelCycleStore {
  return new MemoryCappedLevelCycleStore(new Map<string, CappedLevelCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedLevelCycleStore implements CappedLevelCycleStore {
  inner: CappedLevelCycleStore;
  cache: cache.TtlCache<CappedLevelCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedLevelCycleStore,
    cacheValue: cache.TtlCache<CappedLevelCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedLevelCycle | undefined {
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

  save(item: CappedLevelCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedLevelCycle[] {
    return this.inner.list();
  }
}

export function newCachedCappedLevelCycleStore(inner: CappedLevelCycleStore, ttl: number, clockValue: clock.Clock): CappedLevelCycleStore {
  return new CachedCappedLevelCycleStore(inner, cache.newTtlCache<CappedLevelCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects capped level cycles. Empty fields match all. */
export class CappedLevelCycleQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedLevelCycle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedLevelCycle[]): CappedLevelCycle[] {
    const matched = collections.filter(items, (candidate: CappedLevelCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedLevelCycles(store: CappedLevelCycleStore, query: CappedLevelCycleQuery): CappedLevelCycle[] {
  return query.apply(store.list());
}
