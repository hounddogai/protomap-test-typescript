import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

/** Keeps adaptive complaint agreements by code. */
export interface AdaptiveComplaintAgreementStore {
  find(code: string): AdaptiveComplaintAgreement | undefined;
  save(item: AdaptiveComplaintAgreement): void;
  remove(code: string): boolean;
  list(): AdaptiveComplaintAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveComplaintAgreementStore implements AdaptiveComplaintAgreementStore {
  items: Map<string, AdaptiveComplaintAgreement>;
  order: string[];

  constructor(items: Map<string, AdaptiveComplaintAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveComplaintAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveComplaintAgreement): void {
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

  list(): AdaptiveComplaintAgreement[] {
    const out: AdaptiveComplaintAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveComplaintAgreementStore(): AdaptiveComplaintAgreementStore {
  return new MemoryAdaptiveComplaintAgreementStore(new Map<string, AdaptiveComplaintAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveComplaintAgreementStore implements AdaptiveComplaintAgreementStore {
  inner: AdaptiveComplaintAgreementStore;
  cache: cache.TtlCache<AdaptiveComplaintAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveComplaintAgreementStore,
    cacheValue: cache.TtlCache<AdaptiveComplaintAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveComplaintAgreement | undefined {
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

  save(item: AdaptiveComplaintAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveComplaintAgreement[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveComplaintAgreementStore(inner: AdaptiveComplaintAgreementStore, ttl: number, clockValue: clock.Clock): AdaptiveComplaintAgreementStore {
  return new CachedAdaptiveComplaintAgreementStore(
    inner,
    cache.newTtlCache<AdaptiveComplaintAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive complaint agreements. Empty fields match all. */
export class AdaptiveComplaintAgreementQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveComplaintAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveComplaintAgreement[]): AdaptiveComplaintAgreement[] {
    const matched = collections.filter(items, (candidate: AdaptiveComplaintAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveComplaintAgreements(store: AdaptiveComplaintAgreementStore, query: AdaptiveComplaintAgreementQuery): AdaptiveComplaintAgreement[] {
  return query.apply(store.list());
}
