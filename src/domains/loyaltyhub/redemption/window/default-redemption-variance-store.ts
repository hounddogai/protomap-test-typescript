import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRedemptionVariance } from "./default-redemption-variance.js";

/** Keeps default redemption variances by code. */
export interface DefaultRedemptionVarianceStore {
  find(code: string): DefaultRedemptionVariance | undefined;
  save(item: DefaultRedemptionVariance): void;
  remove(code: string): boolean;
  list(): DefaultRedemptionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRedemptionVarianceStore implements DefaultRedemptionVarianceStore {
  items: Map<string, DefaultRedemptionVariance>;
  order: string[];

  constructor(items: Map<string, DefaultRedemptionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRedemptionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRedemptionVariance): void {
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

  list(): DefaultRedemptionVariance[] {
    const out: DefaultRedemptionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRedemptionVarianceStore(): DefaultRedemptionVarianceStore {
  return new MemoryDefaultRedemptionVarianceStore(new Map<string, DefaultRedemptionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRedemptionVarianceStore implements DefaultRedemptionVarianceStore {
  inner: DefaultRedemptionVarianceStore;
  cache: cache.TtlCache<DefaultRedemptionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRedemptionVarianceStore,
    cacheValue: cache.TtlCache<DefaultRedemptionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRedemptionVariance | undefined {
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

  save(item: DefaultRedemptionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRedemptionVariance[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRedemptionVarianceStore(inner: DefaultRedemptionVarianceStore, ttl: number, clockValue: clock.Clock): DefaultRedemptionVarianceStore {
  return new CachedDefaultRedemptionVarianceStore(
    inner,
    cache.newTtlCache<DefaultRedemptionVariance>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default redemption variances. Empty fields match all. */
export class DefaultRedemptionVarianceQuery {
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

  matches(item: DefaultRedemptionVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRedemptionVariance[]): DefaultRedemptionVariance[] {
    const matched = collections.filter(items, (candidate: DefaultRedemptionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRedemptionVariances(store: DefaultRedemptionVarianceStore, query: DefaultRedemptionVarianceQuery): DefaultRedemptionVariance[] {
  return query.apply(store.list());
}
