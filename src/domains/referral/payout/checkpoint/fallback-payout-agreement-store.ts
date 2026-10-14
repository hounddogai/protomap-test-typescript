import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPayoutAgreement } from "./fallback-payout-agreement.js";

/** Keeps fallback payout agreements by code. */
export interface FallbackPayoutAgreementStore {
  find(code: string): FallbackPayoutAgreement | undefined;
  save(item: FallbackPayoutAgreement): void;
  remove(code: string): boolean;
  list(): FallbackPayoutAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPayoutAgreementStore implements FallbackPayoutAgreementStore {
  items: Map<string, FallbackPayoutAgreement>;
  order: string[];

  constructor(items: Map<string, FallbackPayoutAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPayoutAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPayoutAgreement): void {
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

  list(): FallbackPayoutAgreement[] {
    const out: FallbackPayoutAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPayoutAgreementStore(): FallbackPayoutAgreementStore {
  return new MemoryFallbackPayoutAgreementStore(new Map<string, FallbackPayoutAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPayoutAgreementStore implements FallbackPayoutAgreementStore {
  inner: FallbackPayoutAgreementStore;
  cache: cache.TtlCache<FallbackPayoutAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPayoutAgreementStore,
    cacheValue: cache.TtlCache<FallbackPayoutAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPayoutAgreement | undefined {
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

  save(item: FallbackPayoutAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPayoutAgreement[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPayoutAgreementStore(inner: FallbackPayoutAgreementStore, ttl: number, clockValue: clock.Clock): FallbackPayoutAgreementStore {
  return new CachedFallbackPayoutAgreementStore(
    inner,
    cache.newTtlCache<FallbackPayoutAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback payout agreements. Empty fields match all. */
export class FallbackPayoutAgreementQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPayoutAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPayoutAgreement[]): FallbackPayoutAgreement[] {
    const matched = collections.filter(items, (candidate: FallbackPayoutAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPayoutAgreements(store: FallbackPayoutAgreementStore, query: FallbackPayoutAgreementQuery): FallbackPayoutAgreement[] {
  return query.apply(store.list());
}
