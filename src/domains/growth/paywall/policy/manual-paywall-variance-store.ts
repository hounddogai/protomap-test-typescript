import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPaywallVariance } from "./manual-paywall-variance.js";

/** Keeps manual paywall variances by code. */
export interface ManualPaywallVarianceStore {
  find(code: string): ManualPaywallVariance | undefined;
  save(item: ManualPaywallVariance): void;
  remove(code: string): boolean;
  list(): ManualPaywallVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPaywallVarianceStore implements ManualPaywallVarianceStore {
  items: Map<string, ManualPaywallVariance>;
  order: string[];

  constructor(items: Map<string, ManualPaywallVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPaywallVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPaywallVariance): void {
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

  list(): ManualPaywallVariance[] {
    const out: ManualPaywallVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPaywallVarianceStore(): ManualPaywallVarianceStore {
  return new MemoryManualPaywallVarianceStore(new Map<string, ManualPaywallVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPaywallVarianceStore implements ManualPaywallVarianceStore {
  inner: ManualPaywallVarianceStore;
  cache: cache.TtlCache<ManualPaywallVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPaywallVarianceStore,
    cacheValue: cache.TtlCache<ManualPaywallVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPaywallVariance | undefined {
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

  save(item: ManualPaywallVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPaywallVariance[] {
    return this.inner.list();
  }
}

export function newCachedManualPaywallVarianceStore(inner: ManualPaywallVarianceStore, ttl: number, clockValue: clock.Clock): ManualPaywallVarianceStore {
  return new CachedManualPaywallVarianceStore(
    inner,
    cache.newTtlCache<ManualPaywallVariance>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual paywall variances. Empty fields match all. */
export class ManualPaywallVarianceQuery {
  utmSource: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minEndsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPaywallVariance): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPaywallVariance[]): ManualPaywallVariance[] {
    const matched = collections.filter(items, (candidate: ManualPaywallVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPaywallVariances(store: ManualPaywallVarianceStore, query: ManualPaywallVarianceQuery): ManualPaywallVariance[] {
  return query.apply(store.list());
}
