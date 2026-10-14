import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionAgreement } from "./suppression-agreement.js";

/** Keeps suppression agreements by code. */
export interface SuppressionAgreementStore {
  find(code: string): SuppressionAgreement | undefined;
  save(item: SuppressionAgreement): void;
  remove(code: string): boolean;
  list(): SuppressionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionAgreementStore implements SuppressionAgreementStore {
  items: Map<string, SuppressionAgreement>;
  order: string[];

  constructor(items: Map<string, SuppressionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionAgreement): void {
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

  list(): SuppressionAgreement[] {
    const out: SuppressionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionAgreementStore(): SuppressionAgreementStore {
  return new MemorySuppressionAgreementStore(new Map<string, SuppressionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionAgreementStore implements SuppressionAgreementStore {
  inner: SuppressionAgreementStore;
  cache: cache.TtlCache<SuppressionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionAgreementStore,
    cacheValue: cache.TtlCache<SuppressionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionAgreement | undefined {
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

  save(item: SuppressionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionAgreementStore(inner: SuppressionAgreementStore, ttl: number, clockValue: clock.Clock): SuppressionAgreementStore {
  return new CachedSuppressionAgreementStore(inner, cache.newTtlCache<SuppressionAgreement>(64, ttl, clockValue), 0, 0);
}

/** Selects suppression agreements. Empty fields match all. */
export class SuppressionAgreementQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionAgreement): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionAgreement[]): SuppressionAgreement[] {
    const matched = collections.filter(items, (candidate: SuppressionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionAgreements(store: SuppressionAgreementStore, query: SuppressionAgreementQuery): SuppressionAgreement[] {
  return query.apply(store.list());
}
