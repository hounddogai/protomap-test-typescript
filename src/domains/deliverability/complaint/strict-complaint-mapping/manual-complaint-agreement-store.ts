import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualComplaintAgreement } from "./manual-complaint-agreement.js";

/** Keeps manual complaint agreements by code. */
export interface ManualComplaintAgreementStore {
  find(code: string): ManualComplaintAgreement | undefined;
  save(item: ManualComplaintAgreement): void;
  remove(code: string): boolean;
  list(): ManualComplaintAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualComplaintAgreementStore implements ManualComplaintAgreementStore {
  items: Map<string, ManualComplaintAgreement>;
  order: string[];

  constructor(items: Map<string, ManualComplaintAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualComplaintAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualComplaintAgreement): void {
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

  list(): ManualComplaintAgreement[] {
    const out: ManualComplaintAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualComplaintAgreementStore(): ManualComplaintAgreementStore {
  return new MemoryManualComplaintAgreementStore(new Map<string, ManualComplaintAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualComplaintAgreementStore implements ManualComplaintAgreementStore {
  inner: ManualComplaintAgreementStore;
  cache: cache.TtlCache<ManualComplaintAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualComplaintAgreementStore,
    cacheValue: cache.TtlCache<ManualComplaintAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualComplaintAgreement | undefined {
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

  save(item: ManualComplaintAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualComplaintAgreement[] {
    return this.inner.list();
  }
}

export function newCachedManualComplaintAgreementStore(inner: ManualComplaintAgreementStore, ttl: number, clockValue: clock.Clock): ManualComplaintAgreementStore {
  return new CachedManualComplaintAgreementStore(
    inner,
    cache.newTtlCache<ManualComplaintAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual complaint agreements. Empty fields match all. */
export class ManualComplaintAgreementQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualComplaintAgreement): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualComplaintAgreement[]): ManualComplaintAgreement[] {
    const matched = collections.filter(items, (candidate: ManualComplaintAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualComplaintAgreements(store: ManualComplaintAgreementStore, query: ManualComplaintAgreementQuery): ManualComplaintAgreement[] {
  return query.apply(store.list());
}
