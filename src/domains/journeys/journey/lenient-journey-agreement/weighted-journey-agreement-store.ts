import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedJourneyAgreement } from "./weighted-journey-agreement.js";

/** Keeps weighted journey agreements by code. */
export interface WeightedJourneyAgreementStore {
  find(code: string): WeightedJourneyAgreement | undefined;
  save(item: WeightedJourneyAgreement): void;
  remove(code: string): boolean;
  list(): WeightedJourneyAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedJourneyAgreementStore implements WeightedJourneyAgreementStore {
  items: Map<string, WeightedJourneyAgreement>;
  order: string[];

  constructor(items: Map<string, WeightedJourneyAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedJourneyAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedJourneyAgreement): void {
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

  list(): WeightedJourneyAgreement[] {
    const out: WeightedJourneyAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedJourneyAgreementStore(): WeightedJourneyAgreementStore {
  return new MemoryWeightedJourneyAgreementStore(new Map<string, WeightedJourneyAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedJourneyAgreementStore implements WeightedJourneyAgreementStore {
  inner: WeightedJourneyAgreementStore;
  cache: cache.TtlCache<WeightedJourneyAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedJourneyAgreementStore,
    cacheValue: cache.TtlCache<WeightedJourneyAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedJourneyAgreement | undefined {
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

  save(item: WeightedJourneyAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedJourneyAgreement[] {
    return this.inner.list();
  }
}

export function newCachedWeightedJourneyAgreementStore(inner: WeightedJourneyAgreementStore, ttl: number, clockValue: clock.Clock): WeightedJourneyAgreementStore {
  return new CachedWeightedJourneyAgreementStore(
    inner,
    cache.newTtlCache<WeightedJourneyAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted journey agreements. Empty fields match all. */
export class WeightedJourneyAgreementQuery {
  segment: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedJourneyAgreement): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedJourneyAgreement[]): WeightedJourneyAgreement[] {
    const matched = collections.filter(items, (candidate: WeightedJourneyAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedJourneyAgreements(store: WeightedJourneyAgreementStore, query: WeightedJourneyAgreementQuery): WeightedJourneyAgreement[] {
  return query.apply(store.list());
}
