import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientLevelThreshold } from "./lenient-level-threshold.js";

/** Keeps lenient level thresholds by code. */
export interface LenientLevelThresholdStore {
  find(code: string): LenientLevelThreshold | undefined;
  save(item: LenientLevelThreshold): void;
  remove(code: string): boolean;
  list(): LenientLevelThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientLevelThresholdStore implements LenientLevelThresholdStore {
  items: Map<string, LenientLevelThreshold>;
  order: string[];

  constructor(items: Map<string, LenientLevelThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientLevelThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientLevelThreshold): void {
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

  list(): LenientLevelThreshold[] {
    const out: LenientLevelThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientLevelThresholdStore(): LenientLevelThresholdStore {
  return new MemoryLenientLevelThresholdStore(new Map<string, LenientLevelThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientLevelThresholdStore implements LenientLevelThresholdStore {
  inner: LenientLevelThresholdStore;
  cache: cache.TtlCache<LenientLevelThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientLevelThresholdStore,
    cacheValue: cache.TtlCache<LenientLevelThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientLevelThreshold | undefined {
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

  save(item: LenientLevelThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientLevelThreshold[] {
    return this.inner.list();
  }
}

export function newCachedLenientLevelThresholdStore(inner: LenientLevelThresholdStore, ttl: number, clockValue: clock.Clock): LenientLevelThresholdStore {
  return new CachedLenientLevelThresholdStore(
    inner,
    cache.newTtlCache<LenientLevelThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient level thresholds. Empty fields match all. */
export class LenientLevelThresholdQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientLevelThreshold): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientLevelThreshold[]): LenientLevelThreshold[] {
    const matched = collections.filter(items, (candidate: LenientLevelThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientLevelThresholds(store: LenientLevelThresholdStore, query: LenientLevelThresholdQuery): LenientLevelThreshold[] {
  return query.apply(store.list());
}
