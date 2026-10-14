import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionAgreement } from "./subscription-agreement.js";

/** Keeps subscription agreements by code. */
export interface SubscriptionAgreementStore {
  find(code: string): SubscriptionAgreement | undefined;
  save(item: SubscriptionAgreement): void;
  remove(code: string): boolean;
  list(): SubscriptionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionAgreementStore implements SubscriptionAgreementStore {
  items: Map<string, SubscriptionAgreement>;
  order: string[];

  constructor(items: Map<string, SubscriptionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionAgreement): void {
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

  list(): SubscriptionAgreement[] {
    const out: SubscriptionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionAgreementStore(): SubscriptionAgreementStore {
  return new MemorySubscriptionAgreementStore(new Map<string, SubscriptionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionAgreementStore implements SubscriptionAgreementStore {
  inner: SubscriptionAgreementStore;
  cache: cache.TtlCache<SubscriptionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionAgreementStore,
    cacheValue: cache.TtlCache<SubscriptionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionAgreement | undefined {
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

  save(item: SubscriptionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionAgreementStore(inner: SubscriptionAgreementStore, ttl: number, clockValue: clock.Clock): SubscriptionAgreementStore {
  return new CachedSubscriptionAgreementStore(
    inner,
    cache.newTtlCache<SubscriptionAgreement>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects subscription agreements. Empty fields match all. */
export class SubscriptionAgreementQuery {
  region: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minImpressions: number, statuses: string[], limit: number) {
    this.region = region;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionAgreement): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionAgreement[]): SubscriptionAgreement[] {
    const matched = collections.filter(items, (candidate: SubscriptionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionAgreements(store: SubscriptionAgreementStore, query: SubscriptionAgreementQuery): SubscriptionAgreement[] {
  return query.apply(store.list());
}
