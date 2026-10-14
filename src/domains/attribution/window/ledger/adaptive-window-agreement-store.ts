import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveWindowAgreement } from "./adaptive-window-agreement.js";

/** Keeps adaptive window agreements by code. */
export interface AdaptiveWindowAgreementStore {
  find(code: string): AdaptiveWindowAgreement | undefined;
  save(item: AdaptiveWindowAgreement): void;
  remove(code: string): boolean;
  list(): AdaptiveWindowAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveWindowAgreementStore implements AdaptiveWindowAgreementStore {
  items: Map<string, AdaptiveWindowAgreement>;
  order: string[];

  constructor(items: Map<string, AdaptiveWindowAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveWindowAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveWindowAgreement): void {
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

  list(): AdaptiveWindowAgreement[] {
    const out: AdaptiveWindowAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveWindowAgreementStore(): AdaptiveWindowAgreementStore {
  return new MemoryAdaptiveWindowAgreementStore(new Map<string, AdaptiveWindowAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveWindowAgreementStore implements AdaptiveWindowAgreementStore {
  inner: AdaptiveWindowAgreementStore;
  cache: cache.TtlCache<AdaptiveWindowAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveWindowAgreementStore,
    cacheValue: cache.TtlCache<AdaptiveWindowAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveWindowAgreement | undefined {
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

  save(item: AdaptiveWindowAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveWindowAgreement[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveWindowAgreementStore(inner: AdaptiveWindowAgreementStore, ttl: number, clockValue: clock.Clock): AdaptiveWindowAgreementStore {
  return new CachedAdaptiveWindowAgreementStore(
    inner,
    cache.newTtlCache<AdaptiveWindowAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive window agreements. Empty fields match all. */
export class AdaptiveWindowAgreementQuery {
  category: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDiscount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveWindowAgreement): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveWindowAgreement[]): AdaptiveWindowAgreement[] {
    const matched = collections.filter(items, (candidate: AdaptiveWindowAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveWindowAgreements(store: AdaptiveWindowAgreementStore, query: AdaptiveWindowAgreementQuery): AdaptiveWindowAgreement[] {
  return query.apply(store.list());
}
