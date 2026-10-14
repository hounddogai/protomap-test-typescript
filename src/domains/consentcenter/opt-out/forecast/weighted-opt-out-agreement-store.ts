import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

/** Keeps weighted opt out agreements by code. */
export interface WeightedOptOutAgreementStore {
  find(code: string): WeightedOptOutAgreement | undefined;
  save(item: WeightedOptOutAgreement): void;
  remove(code: string): boolean;
  list(): WeightedOptOutAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedOptOutAgreementStore implements WeightedOptOutAgreementStore {
  items: Map<string, WeightedOptOutAgreement>;
  order: string[];

  constructor(items: Map<string, WeightedOptOutAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedOptOutAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedOptOutAgreement): void {
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

  list(): WeightedOptOutAgreement[] {
    const out: WeightedOptOutAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedOptOutAgreementStore(): WeightedOptOutAgreementStore {
  return new MemoryWeightedOptOutAgreementStore(new Map<string, WeightedOptOutAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedOptOutAgreementStore implements WeightedOptOutAgreementStore {
  inner: WeightedOptOutAgreementStore;
  cache: cache.TtlCache<WeightedOptOutAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedOptOutAgreementStore,
    cacheValue: cache.TtlCache<WeightedOptOutAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedOptOutAgreement | undefined {
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

  save(item: WeightedOptOutAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedOptOutAgreement[] {
    return this.inner.list();
  }
}

export function newCachedWeightedOptOutAgreementStore(inner: WeightedOptOutAgreementStore, ttl: number, clockValue: clock.Clock): WeightedOptOutAgreementStore {
  return new CachedWeightedOptOutAgreementStore(
    inner,
    cache.newTtlCache<WeightedOptOutAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted opt out agreements. Empty fields match all. */
export class WeightedOptOutAgreementQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedOptOutAgreement): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedOptOutAgreement[]): WeightedOptOutAgreement[] {
    const matched = collections.filter(items, (candidate: WeightedOptOutAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedOptOutAgreements(store: WeightedOptOutAgreementStore, query: WeightedOptOutAgreementQuery): WeightedOptOutAgreement[] {
  return query.apply(store.list());
}
