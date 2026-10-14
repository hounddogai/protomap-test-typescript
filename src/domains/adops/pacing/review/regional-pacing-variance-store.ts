import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPacingVariance } from "./regional-pacing-variance.js";

/** Keeps regional pacing variances by code. */
export interface RegionalPacingVarianceStore {
  find(code: string): RegionalPacingVariance | undefined;
  save(item: RegionalPacingVariance): void;
  remove(code: string): boolean;
  list(): RegionalPacingVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPacingVarianceStore implements RegionalPacingVarianceStore {
  items: Map<string, RegionalPacingVariance>;
  order: string[];

  constructor(items: Map<string, RegionalPacingVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPacingVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPacingVariance): void {
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

  list(): RegionalPacingVariance[] {
    const out: RegionalPacingVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPacingVarianceStore(): RegionalPacingVarianceStore {
  return new MemoryRegionalPacingVarianceStore(new Map<string, RegionalPacingVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPacingVarianceStore implements RegionalPacingVarianceStore {
  inner: RegionalPacingVarianceStore;
  cache: cache.TtlCache<RegionalPacingVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPacingVarianceStore,
    cacheValue: cache.TtlCache<RegionalPacingVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPacingVariance | undefined {
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

  save(item: RegionalPacingVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPacingVariance[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPacingVarianceStore(inner: RegionalPacingVarianceStore, ttl: number, clockValue: clock.Clock): RegionalPacingVarianceStore {
  return new CachedRegionalPacingVarianceStore(
    inner,
    cache.newTtlCache<RegionalPacingVariance>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional pacing variances. Empty fields match all. */
export class RegionalPacingVarianceQuery {
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

  matches(item: RegionalPacingVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPacingVariance[]): RegionalPacingVariance[] {
    const matched = collections.filter(items, (candidate: RegionalPacingVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPacingVariances(store: RegionalPacingVarianceStore, query: RegionalPacingVarianceQuery): RegionalPacingVariance[] {
  return query.apply(store.list());
}
