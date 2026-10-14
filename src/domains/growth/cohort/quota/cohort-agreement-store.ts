import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortAgreement } from "./cohort-agreement.js";

/** Keeps cohort agreements by code. */
export interface CohortAgreementStore {
  find(code: string): CohortAgreement | undefined;
  save(item: CohortAgreement): void;
  remove(code: string): boolean;
  list(): CohortAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortAgreementStore implements CohortAgreementStore {
  items: Map<string, CohortAgreement>;
  order: string[];

  constructor(items: Map<string, CohortAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortAgreement): void {
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

  list(): CohortAgreement[] {
    const out: CohortAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortAgreementStore(): CohortAgreementStore {
  return new MemoryCohortAgreementStore(new Map<string, CohortAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortAgreementStore implements CohortAgreementStore {
  inner: CohortAgreementStore;
  cache: cache.TtlCache<CohortAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortAgreementStore,
    cacheValue: cache.TtlCache<CohortAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortAgreement | undefined {
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

  save(item: CohortAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortAgreement[] {
    return this.inner.list();
  }
}

export function newCachedCohortAgreementStore(inner: CohortAgreementStore, ttl: number, clockValue: clock.Clock): CohortAgreementStore {
  return new CachedCohortAgreementStore(inner, cache.newTtlCache<CohortAgreement>(256, ttl, clockValue), 0, 0);
}

/** Selects cohort agreements. Empty fields match all. */
export class CohortAgreementQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortAgreement[]): CohortAgreement[] {
    const matched = collections.filter(items, (candidate: CohortAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortAgreements(store: CohortAgreementStore, query: CohortAgreementQuery): CohortAgreement[] {
  return query.apply(store.list());
}
