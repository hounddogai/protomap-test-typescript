import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedFunnelAgreement } from "./weighted-funnel-agreement.js";

/** Keeps weighted funnel agreements by code. */
export interface WeightedFunnelAgreementStore {
  find(code: string): WeightedFunnelAgreement | undefined;
  save(item: WeightedFunnelAgreement): void;
  remove(code: string): boolean;
  list(): WeightedFunnelAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedFunnelAgreementStore implements WeightedFunnelAgreementStore {
  items: Map<string, WeightedFunnelAgreement>;
  order: string[];

  constructor(items: Map<string, WeightedFunnelAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedFunnelAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedFunnelAgreement): void {
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

  list(): WeightedFunnelAgreement[] {
    const out: WeightedFunnelAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedFunnelAgreementStore(): WeightedFunnelAgreementStore {
  return new MemoryWeightedFunnelAgreementStore(new Map<string, WeightedFunnelAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedFunnelAgreementStore implements WeightedFunnelAgreementStore {
  inner: WeightedFunnelAgreementStore;
  cache: cache.TtlCache<WeightedFunnelAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedFunnelAgreementStore,
    cacheValue: cache.TtlCache<WeightedFunnelAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedFunnelAgreement | undefined {
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

  save(item: WeightedFunnelAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedFunnelAgreement[] {
    return this.inner.list();
  }
}

export function newCachedWeightedFunnelAgreementStore(inner: WeightedFunnelAgreementStore, ttl: number, clockValue: clock.Clock): WeightedFunnelAgreementStore {
  return new CachedWeightedFunnelAgreementStore(
    inner,
    cache.newTtlCache<WeightedFunnelAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted funnel agreements. Empty fields match all. */
export class WeightedFunnelAgreementQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedFunnelAgreement): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedFunnelAgreement[]): WeightedFunnelAgreement[] {
    const matched = collections.filter(items, (candidate: WeightedFunnelAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedFunnelAgreements(store: WeightedFunnelAgreementStore, query: WeightedFunnelAgreementQuery): WeightedFunnelAgreement[] {
  return query.apply(store.list());
}
