import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentAgreement } from "./enrollment-agreement.js";

/** Keeps enrollment agreements by code. */
export interface EnrollmentAgreementStore {
  find(code: string): EnrollmentAgreement | undefined;
  save(item: EnrollmentAgreement): void;
  remove(code: string): boolean;
  list(): EnrollmentAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentAgreementStore implements EnrollmentAgreementStore {
  items: Map<string, EnrollmentAgreement>;
  order: string[];

  constructor(items: Map<string, EnrollmentAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentAgreement): void {
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

  list(): EnrollmentAgreement[] {
    const out: EnrollmentAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentAgreementStore(): EnrollmentAgreementStore {
  return new MemoryEnrollmentAgreementStore(new Map<string, EnrollmentAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentAgreementStore implements EnrollmentAgreementStore {
  inner: EnrollmentAgreementStore;
  cache: cache.TtlCache<EnrollmentAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentAgreementStore,
    cacheValue: cache.TtlCache<EnrollmentAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentAgreement | undefined {
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

  save(item: EnrollmentAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentAgreement[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentAgreementStore(inner: EnrollmentAgreementStore, ttl: number, clockValue: clock.Clock): EnrollmentAgreementStore {
  return new CachedEnrollmentAgreementStore(inner, cache.newTtlCache<EnrollmentAgreement>(512, ttl, clockValue), 0, 0);
}

/** Selects enrollment agreements. Empty fields match all. */
export class EnrollmentAgreementQuery {
  utmSource: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDiscount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentAgreement): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentAgreement[]): EnrollmentAgreement[] {
    const matched = collections.filter(items, (candidate: EnrollmentAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentAgreements(store: EnrollmentAgreementStore, query: EnrollmentAgreementQuery): EnrollmentAgreement[] {
  return query.apply(store.list());
}
