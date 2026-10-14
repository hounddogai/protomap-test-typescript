import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDoubleOptInAgreement } from "./scheduled-double-opt-in-agreement.js";

/** Keeps scheduled double opt in agreements by code. */
export interface ScheduledDoubleOptInAgreementStore {
  find(code: string): ScheduledDoubleOptInAgreement | undefined;
  save(item: ScheduledDoubleOptInAgreement): void;
  remove(code: string): boolean;
  list(): ScheduledDoubleOptInAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDoubleOptInAgreementStore implements ScheduledDoubleOptInAgreementStore {
  items: Map<string, ScheduledDoubleOptInAgreement>;
  order: string[];

  constructor(items: Map<string, ScheduledDoubleOptInAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDoubleOptInAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDoubleOptInAgreement): void {
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

  list(): ScheduledDoubleOptInAgreement[] {
    const out: ScheduledDoubleOptInAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDoubleOptInAgreementStore(): ScheduledDoubleOptInAgreementStore {
  return new MemoryScheduledDoubleOptInAgreementStore(new Map<string, ScheduledDoubleOptInAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDoubleOptInAgreementStore implements ScheduledDoubleOptInAgreementStore {
  inner: ScheduledDoubleOptInAgreementStore;
  cache: cache.TtlCache<ScheduledDoubleOptInAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDoubleOptInAgreementStore,
    cacheValue: cache.TtlCache<ScheduledDoubleOptInAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDoubleOptInAgreement | undefined {
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

  save(item: ScheduledDoubleOptInAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDoubleOptInAgreement[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDoubleOptInAgreementStore(inner: ScheduledDoubleOptInAgreementStore, ttl: number, clockValue: clock.Clock): ScheduledDoubleOptInAgreementStore {
  return new CachedScheduledDoubleOptInAgreementStore(
    inner,
    cache.newTtlCache<ScheduledDoubleOptInAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled double opt in agreements. Empty fields match all. */
export class ScheduledDoubleOptInAgreementQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDoubleOptInAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDoubleOptInAgreement[]): ScheduledDoubleOptInAgreement[] {
    const matched = collections.filter(items, (candidate: ScheduledDoubleOptInAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDoubleOptInAgreements(store: ScheduledDoubleOptInAgreementStore, query: ScheduledDoubleOptInAgreementQuery): ScheduledDoubleOptInAgreement[] {
  return query.apply(store.list());
}
