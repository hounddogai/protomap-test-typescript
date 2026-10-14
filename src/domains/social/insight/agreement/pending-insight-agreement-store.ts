import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingInsightAgreement } from "./pending-insight-agreement.js";

/** Keeps pending insight agreements by code. */
export interface PendingInsightAgreementStore {
  find(code: string): PendingInsightAgreement | undefined;
  save(item: PendingInsightAgreement): void;
  remove(code: string): boolean;
  list(): PendingInsightAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingInsightAgreementStore implements PendingInsightAgreementStore {
  items: Map<string, PendingInsightAgreement>;
  order: string[];

  constructor(items: Map<string, PendingInsightAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingInsightAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingInsightAgreement): void {
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

  list(): PendingInsightAgreement[] {
    const out: PendingInsightAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingInsightAgreementStore(): PendingInsightAgreementStore {
  return new MemoryPendingInsightAgreementStore(new Map<string, PendingInsightAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingInsightAgreementStore implements PendingInsightAgreementStore {
  inner: PendingInsightAgreementStore;
  cache: cache.TtlCache<PendingInsightAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingInsightAgreementStore,
    cacheValue: cache.TtlCache<PendingInsightAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingInsightAgreement | undefined {
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

  save(item: PendingInsightAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingInsightAgreement[] {
    return this.inner.list();
  }
}

export function newCachedPendingInsightAgreementStore(inner: PendingInsightAgreementStore, ttl: number, clockValue: clock.Clock): PendingInsightAgreementStore {
  return new CachedPendingInsightAgreementStore(
    inner,
    cache.newTtlCache<PendingInsightAgreement>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending insight agreements. Empty fields match all. */
export class PendingInsightAgreementQuery {
  country: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCost: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingInsightAgreement): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingInsightAgreement[]): PendingInsightAgreement[] {
    const matched = collections.filter(items, (candidate: PendingInsightAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingInsightAgreements(store: PendingInsightAgreementStore, query: PendingInsightAgreementQuery): PendingInsightAgreement[] {
  return query.apply(store.list());
}
