import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalLevelThreshold } from "./global-level-threshold.js";

/** Keeps global level thresholds by code. */
export interface GlobalLevelThresholdStore {
  find(code: string): GlobalLevelThreshold | undefined;
  save(item: GlobalLevelThreshold): void;
  remove(code: string): boolean;
  list(): GlobalLevelThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalLevelThresholdStore implements GlobalLevelThresholdStore {
  items: Map<string, GlobalLevelThreshold>;
  order: string[];

  constructor(items: Map<string, GlobalLevelThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalLevelThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalLevelThreshold): void {
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

  list(): GlobalLevelThreshold[] {
    const out: GlobalLevelThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalLevelThresholdStore(): GlobalLevelThresholdStore {
  return new MemoryGlobalLevelThresholdStore(new Map<string, GlobalLevelThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalLevelThresholdStore implements GlobalLevelThresholdStore {
  inner: GlobalLevelThresholdStore;
  cache: cache.TtlCache<GlobalLevelThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalLevelThresholdStore,
    cacheValue: cache.TtlCache<GlobalLevelThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalLevelThreshold | undefined {
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

  save(item: GlobalLevelThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalLevelThreshold[] {
    return this.inner.list();
  }
}

export function newCachedGlobalLevelThresholdStore(inner: GlobalLevelThresholdStore, ttl: number, clockValue: clock.Clock): GlobalLevelThresholdStore {
  return new CachedGlobalLevelThresholdStore(
    inner,
    cache.newTtlCache<GlobalLevelThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global level thresholds. Empty fields match all. */
export class GlobalLevelThresholdQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalLevelThreshold): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalLevelThreshold[]): GlobalLevelThreshold[] {
    const matched = collections.filter(items, (candidate: GlobalLevelThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalLevelThresholds(store: GlobalLevelThresholdStore, query: GlobalLevelThresholdQuery): GlobalLevelThreshold[] {
  return query.apply(store.list());
}
