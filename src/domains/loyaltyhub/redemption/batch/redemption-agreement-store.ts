import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionAgreement } from "./redemption-agreement.js";

/** Keeps redemption agreements by code. */
export interface RedemptionAgreementStore {
  find(code: string): RedemptionAgreement | undefined;
  save(item: RedemptionAgreement): void;
  remove(code: string): boolean;
  list(): RedemptionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionAgreementStore implements RedemptionAgreementStore {
  items: Map<string, RedemptionAgreement>;
  order: string[];

  constructor(items: Map<string, RedemptionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionAgreement): void {
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

  list(): RedemptionAgreement[] {
    const out: RedemptionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionAgreementStore(): RedemptionAgreementStore {
  return new MemoryRedemptionAgreementStore(new Map<string, RedemptionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionAgreementStore implements RedemptionAgreementStore {
  inner: RedemptionAgreementStore;
  cache: cache.TtlCache<RedemptionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionAgreementStore,
    cacheValue: cache.TtlCache<RedemptionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionAgreement | undefined {
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

  save(item: RedemptionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionAgreementStore(inner: RedemptionAgreementStore, ttl: number, clockValue: clock.Clock): RedemptionAgreementStore {
  return new CachedRedemptionAgreementStore(inner, cache.newTtlCache<RedemptionAgreement>(512, ttl, clockValue), 0, 0);
}

/** Selects redemption agreements. Empty fields match all. */
export class RedemptionAgreementQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionAgreement): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionAgreement[]): RedemptionAgreement[] {
    const matched = collections.filter(items, (candidate: RedemptionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionAgreements(store: RedemptionAgreementStore, query: RedemptionAgreementQuery): RedemptionAgreement[] {
  return query.apply(store.list());
}
