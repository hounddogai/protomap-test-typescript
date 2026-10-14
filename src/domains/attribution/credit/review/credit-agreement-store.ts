import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditAgreement } from "./credit-agreement.js";

/** Keeps credit agreements by code. */
export interface CreditAgreementStore {
  find(code: string): CreditAgreement | undefined;
  save(item: CreditAgreement): void;
  remove(code: string): boolean;
  list(): CreditAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditAgreementStore implements CreditAgreementStore {
  items: Map<string, CreditAgreement>;
  order: string[];

  constructor(items: Map<string, CreditAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditAgreement): void {
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

  list(): CreditAgreement[] {
    const out: CreditAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditAgreementStore(): CreditAgreementStore {
  return new MemoryCreditAgreementStore(new Map<string, CreditAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditAgreementStore implements CreditAgreementStore {
  inner: CreditAgreementStore;
  cache: cache.TtlCache<CreditAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditAgreementStore,
    cacheValue: cache.TtlCache<CreditAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditAgreement | undefined {
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

  save(item: CreditAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditAgreement[] {
    return this.inner.list();
  }
}

export function newCachedCreditAgreementStore(inner: CreditAgreementStore, ttl: number, clockValue: clock.Clock): CreditAgreementStore {
  return new CachedCreditAgreementStore(inner, cache.newTtlCache<CreditAgreement>(1024, ttl, clockValue), 0, 0);
}

/** Selects credit agreements. Empty fields match all. */
export class CreditAgreementQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditAgreement[]): CreditAgreement[] {
    const matched = collections.filter(items, (candidate: CreditAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditAgreements(store: CreditAgreementStore, query: CreditAgreementQuery): CreditAgreement[] {
  return query.apply(store.list());
}
