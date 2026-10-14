import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientActivationThreshold } from "./lenient-activation-threshold.js";

/** Keeps lenient activation thresholds by code. */
export interface LenientActivationThresholdStore {
  find(code: string): LenientActivationThreshold | undefined;
  save(item: LenientActivationThreshold): void;
  remove(code: string): boolean;
  list(): LenientActivationThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientActivationThresholdStore implements LenientActivationThresholdStore {
  items: Map<string, LenientActivationThreshold>;
  order: string[];

  constructor(items: Map<string, LenientActivationThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientActivationThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientActivationThreshold): void {
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

  list(): LenientActivationThreshold[] {
    const out: LenientActivationThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientActivationThresholdStore(): LenientActivationThresholdStore {
  return new MemoryLenientActivationThresholdStore(new Map<string, LenientActivationThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientActivationThresholdStore implements LenientActivationThresholdStore {
  inner: LenientActivationThresholdStore;
  cache: cache.TtlCache<LenientActivationThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientActivationThresholdStore,
    cacheValue: cache.TtlCache<LenientActivationThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientActivationThreshold | undefined {
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

  save(item: LenientActivationThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientActivationThreshold[] {
    return this.inner.list();
  }
}

export function newCachedLenientActivationThresholdStore(inner: LenientActivationThresholdStore, ttl: number, clockValue: clock.Clock): LenientActivationThresholdStore {
  return new CachedLenientActivationThresholdStore(
    inner,
    cache.newTtlCache<LenientActivationThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient activation thresholds. Empty fields match all. */
export class LenientActivationThresholdQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientActivationThreshold): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientActivationThreshold[]): LenientActivationThreshold[] {
    const matched = collections.filter(items, (candidate: LenientActivationThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientActivationThresholds(store: LenientActivationThresholdStore, query: LenientActivationThresholdQuery): LenientActivationThreshold[] {
  return query.apply(store.list());
}
