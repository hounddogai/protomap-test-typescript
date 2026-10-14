import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBidRuleAgreement } from "./manual-bid-rule-agreement.js";

/** Keeps manual bid rule agreements by code. */
export interface ManualBidRuleAgreementStore {
  find(code: string): ManualBidRuleAgreement | undefined;
  save(item: ManualBidRuleAgreement): void;
  remove(code: string): boolean;
  list(): ManualBidRuleAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBidRuleAgreementStore implements ManualBidRuleAgreementStore {
  items: Map<string, ManualBidRuleAgreement>;
  order: string[];

  constructor(items: Map<string, ManualBidRuleAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBidRuleAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBidRuleAgreement): void {
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

  list(): ManualBidRuleAgreement[] {
    const out: ManualBidRuleAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBidRuleAgreementStore(): ManualBidRuleAgreementStore {
  return new MemoryManualBidRuleAgreementStore(new Map<string, ManualBidRuleAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBidRuleAgreementStore implements ManualBidRuleAgreementStore {
  inner: ManualBidRuleAgreementStore;
  cache: cache.TtlCache<ManualBidRuleAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBidRuleAgreementStore,
    cacheValue: cache.TtlCache<ManualBidRuleAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBidRuleAgreement | undefined {
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

  save(item: ManualBidRuleAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBidRuleAgreement[] {
    return this.inner.list();
  }
}

export function newCachedManualBidRuleAgreementStore(inner: ManualBidRuleAgreementStore, ttl: number, clockValue: clock.Clock): ManualBidRuleAgreementStore {
  return new CachedManualBidRuleAgreementStore(
    inner,
    cache.newTtlCache<ManualBidRuleAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual bid rule agreements. Empty fields match all. */
export class ManualBidRuleAgreementQuery {
  country: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMaximum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBidRuleAgreement): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBidRuleAgreement[]): ManualBidRuleAgreement[] {
    const matched = collections.filter(items, (candidate: ManualBidRuleAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBidRuleAgreements(store: ManualBidRuleAgreementStore, query: ManualBidRuleAgreementQuery): ManualBidRuleAgreement[] {
  return query.apply(store.list());
}
