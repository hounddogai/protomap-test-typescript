import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

/** Keeps strict bid rule agreements by code. */
export interface StrictBidRuleAgreementStore {
  find(code: string): StrictBidRuleAgreement | undefined;
  save(item: StrictBidRuleAgreement): void;
  remove(code: string): boolean;
  list(): StrictBidRuleAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictBidRuleAgreementStore implements StrictBidRuleAgreementStore {
  items: Map<string, StrictBidRuleAgreement>;
  order: string[];

  constructor(items: Map<string, StrictBidRuleAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictBidRuleAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictBidRuleAgreement): void {
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

  list(): StrictBidRuleAgreement[] {
    const out: StrictBidRuleAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictBidRuleAgreementStore(): StrictBidRuleAgreementStore {
  return new MemoryStrictBidRuleAgreementStore(new Map<string, StrictBidRuleAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictBidRuleAgreementStore implements StrictBidRuleAgreementStore {
  inner: StrictBidRuleAgreementStore;
  cache: cache.TtlCache<StrictBidRuleAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictBidRuleAgreementStore,
    cacheValue: cache.TtlCache<StrictBidRuleAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictBidRuleAgreement | undefined {
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

  save(item: StrictBidRuleAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictBidRuleAgreement[] {
    return this.inner.list();
  }
}

export function newCachedStrictBidRuleAgreementStore(inner: StrictBidRuleAgreementStore, ttl: number, clockValue: clock.Clock): StrictBidRuleAgreementStore {
  return new CachedStrictBidRuleAgreementStore(
    inner,
    cache.newTtlCache<StrictBidRuleAgreement>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict bid rule agreements. Empty fields match all. */
export class StrictBidRuleAgreementQuery {
  source: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBatchSize: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictBidRuleAgreement): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictBidRuleAgreement[]): StrictBidRuleAgreement[] {
    const matched = collections.filter(items, (candidate: StrictBidRuleAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictBidRuleAgreements(store: StrictBidRuleAgreementStore, query: StrictBidRuleAgreementQuery): StrictBidRuleAgreement[] {
  return query.apply(store.list());
}
