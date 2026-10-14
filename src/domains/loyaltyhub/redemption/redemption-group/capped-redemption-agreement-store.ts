import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedRedemptionAgreement } from "./capped-redemption-agreement.js";

/** Keeps capped redemption agreements by code. */
export interface CappedRedemptionAgreementStore {
  find(code: string): CappedRedemptionAgreement | undefined;
  save(item: CappedRedemptionAgreement): void;
  remove(code: string): boolean;
  list(): CappedRedemptionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedRedemptionAgreementStore implements CappedRedemptionAgreementStore {
  items: Map<string, CappedRedemptionAgreement>;
  order: string[];

  constructor(items: Map<string, CappedRedemptionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedRedemptionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedRedemptionAgreement): void {
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

  list(): CappedRedemptionAgreement[] {
    const out: CappedRedemptionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedRedemptionAgreementStore(): CappedRedemptionAgreementStore {
  return new MemoryCappedRedemptionAgreementStore(new Map<string, CappedRedemptionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedRedemptionAgreementStore implements CappedRedemptionAgreementStore {
  inner: CappedRedemptionAgreementStore;
  cache: cache.TtlCache<CappedRedemptionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedRedemptionAgreementStore,
    cacheValue: cache.TtlCache<CappedRedemptionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedRedemptionAgreement | undefined {
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

  save(item: CappedRedemptionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedRedemptionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedCappedRedemptionAgreementStore(inner: CappedRedemptionAgreementStore, ttl: number, clockValue: clock.Clock): CappedRedemptionAgreementStore {
  return new CachedCappedRedemptionAgreementStore(
    inner,
    cache.newTtlCache<CappedRedemptionAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped redemption agreements. Empty fields match all. */
export class CappedRedemptionAgreementQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedRedemptionAgreement): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedRedemptionAgreement[]): CappedRedemptionAgreement[] {
    const matched = collections.filter(items, (candidate: CappedRedemptionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedRedemptionAgreements(store: CappedRedemptionAgreementStore, query: CappedRedemptionAgreementQuery): CappedRedemptionAgreement[] {
  return query.apply(store.list());
}
