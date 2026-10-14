import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckAgreement } from "./fraud-check-agreement.js";

/** Keeps fraud check agreements by code. */
export interface FraudCheckAgreementStore {
  find(code: string): FraudCheckAgreement | undefined;
  save(item: FraudCheckAgreement): void;
  remove(code: string): boolean;
  list(): FraudCheckAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckAgreementStore implements FraudCheckAgreementStore {
  items: Map<string, FraudCheckAgreement>;
  order: string[];

  constructor(items: Map<string, FraudCheckAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckAgreement): void {
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

  list(): FraudCheckAgreement[] {
    const out: FraudCheckAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckAgreementStore(): FraudCheckAgreementStore {
  return new MemoryFraudCheckAgreementStore(new Map<string, FraudCheckAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckAgreementStore implements FraudCheckAgreementStore {
  inner: FraudCheckAgreementStore;
  cache: cache.TtlCache<FraudCheckAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckAgreementStore,
    cacheValue: cache.TtlCache<FraudCheckAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckAgreement | undefined {
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

  save(item: FraudCheckAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckAgreement[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckAgreementStore(inner: FraudCheckAgreementStore, ttl: number, clockValue: clock.Clock): FraudCheckAgreementStore {
  return new CachedFraudCheckAgreementStore(inner, cache.newTtlCache<FraudCheckAgreement>(128, ttl, clockValue), 0, 0);
}

/** Selects fraud check agreements. Empty fields match all. */
export class FraudCheckAgreementQuery {
  category: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minMargin: number, statuses: string[], limit: number) {
    this.category = category;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckAgreement): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckAgreement[]): FraudCheckAgreement[] {
    const matched = collections.filter(items, (candidate: FraudCheckAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckAgreements(store: FraudCheckAgreementStore, query: FraudCheckAgreementQuery): FraudCheckAgreement[] {
  return query.apply(store.list());
}
