import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

/** Keeps adaptive approval agreements by code. */
export interface AdaptiveApprovalAgreementStore {
  find(code: string): AdaptiveApprovalAgreement | undefined;
  save(item: AdaptiveApprovalAgreement): void;
  remove(code: string): boolean;
  list(): AdaptiveApprovalAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveApprovalAgreementStore implements AdaptiveApprovalAgreementStore {
  items: Map<string, AdaptiveApprovalAgreement>;
  order: string[];

  constructor(items: Map<string, AdaptiveApprovalAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveApprovalAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveApprovalAgreement): void {
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

  list(): AdaptiveApprovalAgreement[] {
    const out: AdaptiveApprovalAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveApprovalAgreementStore(): AdaptiveApprovalAgreementStore {
  return new MemoryAdaptiveApprovalAgreementStore(new Map<string, AdaptiveApprovalAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveApprovalAgreementStore implements AdaptiveApprovalAgreementStore {
  inner: AdaptiveApprovalAgreementStore;
  cache: cache.TtlCache<AdaptiveApprovalAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveApprovalAgreementStore,
    cacheValue: cache.TtlCache<AdaptiveApprovalAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveApprovalAgreement | undefined {
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

  save(item: AdaptiveApprovalAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveApprovalAgreement[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveApprovalAgreementStore(inner: AdaptiveApprovalAgreementStore, ttl: number, clockValue: clock.Clock): AdaptiveApprovalAgreementStore {
  return new CachedAdaptiveApprovalAgreementStore(
    inner,
    cache.newTtlCache<AdaptiveApprovalAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive approval agreements. Empty fields match all. */
export class AdaptiveApprovalAgreementQuery {
  country: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minLimit: number, statuses: string[], limit: number) {
    this.country = country;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveApprovalAgreement): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveApprovalAgreement[]): AdaptiveApprovalAgreement[] {
    const matched = collections.filter(items, (candidate: AdaptiveApprovalAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveApprovalAgreements(store: AdaptiveApprovalAgreementStore, query: AdaptiveApprovalAgreementQuery): AdaptiveApprovalAgreement[] {
  return query.apply(store.list());
}
