import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySlaAgreement } from "./primary-sla-agreement.js";

/** Keeps primary sla agreements by code. */
export interface PrimarySlaAgreementStore {
  find(code: string): PrimarySlaAgreement | undefined;
  save(item: PrimarySlaAgreement): void;
  remove(code: string): boolean;
  list(): PrimarySlaAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySlaAgreementStore implements PrimarySlaAgreementStore {
  items: Map<string, PrimarySlaAgreement>;
  order: string[];

  constructor(items: Map<string, PrimarySlaAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySlaAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySlaAgreement): void {
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

  list(): PrimarySlaAgreement[] {
    const out: PrimarySlaAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySlaAgreementStore(): PrimarySlaAgreementStore {
  return new MemoryPrimarySlaAgreementStore(new Map<string, PrimarySlaAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySlaAgreementStore implements PrimarySlaAgreementStore {
  inner: PrimarySlaAgreementStore;
  cache: cache.TtlCache<PrimarySlaAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySlaAgreementStore,
    cacheValue: cache.TtlCache<PrimarySlaAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySlaAgreement | undefined {
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

  save(item: PrimarySlaAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySlaAgreement[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySlaAgreementStore(inner: PrimarySlaAgreementStore, ttl: number, clockValue: clock.Clock): PrimarySlaAgreementStore {
  return new CachedPrimarySlaAgreementStore(inner, cache.newTtlCache<PrimarySlaAgreement>(64, ttl, clockValue), 0, 0);
}

/** Selects primary sla agreements. Empty fields match all. */
export class PrimarySlaAgreementQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySlaAgreement): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySlaAgreement[]): PrimarySlaAgreement[] {
    const matched = collections.filter(items, (candidate: PrimarySlaAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySlaAgreements(store: PrimarySlaAgreementStore, query: PrimarySlaAgreementQuery): PrimarySlaAgreement[] {
  return query.apply(store.list());
}
