import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInAgreement } from "./double-opt-in-agreement.js";

/** Keeps double opt in agreements by code. */
export interface DoubleOptInAgreementStore {
  find(code: string): DoubleOptInAgreement | undefined;
  save(item: DoubleOptInAgreement): void;
  remove(code: string): boolean;
  list(): DoubleOptInAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInAgreementStore implements DoubleOptInAgreementStore {
  items: Map<string, DoubleOptInAgreement>;
  order: string[];

  constructor(items: Map<string, DoubleOptInAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInAgreement): void {
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

  list(): DoubleOptInAgreement[] {
    const out: DoubleOptInAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInAgreementStore(): DoubleOptInAgreementStore {
  return new MemoryDoubleOptInAgreementStore(new Map<string, DoubleOptInAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInAgreementStore implements DoubleOptInAgreementStore {
  inner: DoubleOptInAgreementStore;
  cache: cache.TtlCache<DoubleOptInAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInAgreementStore,
    cacheValue: cache.TtlCache<DoubleOptInAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInAgreement | undefined {
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

  save(item: DoubleOptInAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInAgreement[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInAgreementStore(inner: DoubleOptInAgreementStore, ttl: number, clockValue: clock.Clock): DoubleOptInAgreementStore {
  return new CachedDoubleOptInAgreementStore(inner, cache.newTtlCache<DoubleOptInAgreement>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in agreements. Empty fields match all. */
export class DoubleOptInAgreementQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInAgreement[]): DoubleOptInAgreement[] {
    const matched = collections.filter(items, (candidate: DoubleOptInAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInAgreements(store: DoubleOptInAgreementStore, query: DoubleOptInAgreementQuery): DoubleOptInAgreement[] {
  return query.apply(store.list());
}
