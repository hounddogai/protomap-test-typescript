import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalEscalationVariance } from "./regional-escalation-variance.js";

/** Keeps regional escalation variances by code. */
export interface RegionalEscalationVarianceStore {
  find(code: string): RegionalEscalationVariance | undefined;
  save(item: RegionalEscalationVariance): void;
  remove(code: string): boolean;
  list(): RegionalEscalationVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalEscalationVarianceStore implements RegionalEscalationVarianceStore {
  items: Map<string, RegionalEscalationVariance>;
  order: string[];

  constructor(items: Map<string, RegionalEscalationVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalEscalationVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalEscalationVariance): void {
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

  list(): RegionalEscalationVariance[] {
    const out: RegionalEscalationVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalEscalationVarianceStore(): RegionalEscalationVarianceStore {
  return new MemoryRegionalEscalationVarianceStore(new Map<string, RegionalEscalationVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalEscalationVarianceStore implements RegionalEscalationVarianceStore {
  inner: RegionalEscalationVarianceStore;
  cache: cache.TtlCache<RegionalEscalationVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalEscalationVarianceStore,
    cacheValue: cache.TtlCache<RegionalEscalationVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalEscalationVariance | undefined {
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

  save(item: RegionalEscalationVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalEscalationVariance[] {
    return this.inner.list();
  }
}

export function newCachedRegionalEscalationVarianceStore(inner: RegionalEscalationVarianceStore, ttl: number, clockValue: clock.Clock): RegionalEscalationVarianceStore {
  return new CachedRegionalEscalationVarianceStore(
    inner,
    cache.newTtlCache<RegionalEscalationVariance>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional escalation variances. Empty fields match all. */
export class RegionalEscalationVarianceQuery {
  category: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minThreshold: number, statuses: string[], limit: number) {
    this.category = category;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalEscalationVariance): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalEscalationVariance[]): RegionalEscalationVariance[] {
    const matched = collections.filter(items, (candidate: RegionalEscalationVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalEscalationVariances(store: RegionalEscalationVarianceStore, query: RegionalEscalationVarianceQuery): RegionalEscalationVariance[] {
  return query.apply(store.list());
}
