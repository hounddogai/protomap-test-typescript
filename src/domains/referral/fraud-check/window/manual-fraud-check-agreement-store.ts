import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualFraudCheckAgreement } from "./manual-fraud-check-agreement.js";

/** Keeps manual fraud check agreements by code. */
export interface ManualFraudCheckAgreementStore {
  find(code: string): ManualFraudCheckAgreement | undefined;
  save(item: ManualFraudCheckAgreement): void;
  remove(code: string): boolean;
  list(): ManualFraudCheckAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualFraudCheckAgreementStore implements ManualFraudCheckAgreementStore {
  items: Map<string, ManualFraudCheckAgreement>;
  order: string[];

  constructor(items: Map<string, ManualFraudCheckAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualFraudCheckAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualFraudCheckAgreement): void {
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

  list(): ManualFraudCheckAgreement[] {
    const out: ManualFraudCheckAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualFraudCheckAgreementStore(): ManualFraudCheckAgreementStore {
  return new MemoryManualFraudCheckAgreementStore(new Map<string, ManualFraudCheckAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualFraudCheckAgreementStore implements ManualFraudCheckAgreementStore {
  inner: ManualFraudCheckAgreementStore;
  cache: cache.TtlCache<ManualFraudCheckAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualFraudCheckAgreementStore,
    cacheValue: cache.TtlCache<ManualFraudCheckAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualFraudCheckAgreement | undefined {
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

  save(item: ManualFraudCheckAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualFraudCheckAgreement[] {
    return this.inner.list();
  }
}

export function newCachedManualFraudCheckAgreementStore(inner: ManualFraudCheckAgreementStore, ttl: number, clockValue: clock.Clock): ManualFraudCheckAgreementStore {
  return new CachedManualFraudCheckAgreementStore(
    inner,
    cache.newTtlCache<ManualFraudCheckAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual fraud check agreements. Empty fields match all. */
export class ManualFraudCheckAgreementQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualFraudCheckAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualFraudCheckAgreement[]): ManualFraudCheckAgreement[] {
    const matched = collections.filter(items, (candidate: ManualFraudCheckAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualFraudCheckAgreements(store: ManualFraudCheckAgreementStore, query: ManualFraudCheckAgreementQuery): ManualFraudCheckAgreement[] {
  return query.apply(store.list());
}
