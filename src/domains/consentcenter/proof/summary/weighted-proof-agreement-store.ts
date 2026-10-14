import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedProofAgreement } from "./weighted-proof-agreement.js";

/** Keeps weighted proof agreements by code. */
export interface WeightedProofAgreementStore {
  find(code: string): WeightedProofAgreement | undefined;
  save(item: WeightedProofAgreement): void;
  remove(code: string): boolean;
  list(): WeightedProofAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedProofAgreementStore implements WeightedProofAgreementStore {
  items: Map<string, WeightedProofAgreement>;
  order: string[];

  constructor(items: Map<string, WeightedProofAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedProofAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedProofAgreement): void {
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

  list(): WeightedProofAgreement[] {
    const out: WeightedProofAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedProofAgreementStore(): WeightedProofAgreementStore {
  return new MemoryWeightedProofAgreementStore(new Map<string, WeightedProofAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedProofAgreementStore implements WeightedProofAgreementStore {
  inner: WeightedProofAgreementStore;
  cache: cache.TtlCache<WeightedProofAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedProofAgreementStore,
    cacheValue: cache.TtlCache<WeightedProofAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedProofAgreement | undefined {
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

  save(item: WeightedProofAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedProofAgreement[] {
    return this.inner.list();
  }
}

export function newCachedWeightedProofAgreementStore(inner: WeightedProofAgreementStore, ttl: number, clockValue: clock.Clock): WeightedProofAgreementStore {
  return new CachedWeightedProofAgreementStore(
    inner,
    cache.newTtlCache<WeightedProofAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted proof agreements. Empty fields match all. */
export class WeightedProofAgreementQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedProofAgreement): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedProofAgreement[]): WeightedProofAgreement[] {
    const matched = collections.filter(items, (candidate: WeightedProofAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedProofAgreements(store: WeightedProofAgreementStore, query: WeightedProofAgreementQuery): WeightedProofAgreement[] {
  return query.apply(store.list());
}
