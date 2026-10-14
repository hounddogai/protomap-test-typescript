import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyAgreement } from "./journey-agreement.js";

/** Keeps journey agreements by code. */
export interface JourneyAgreementStore {
  find(code: string): JourneyAgreement | undefined;
  save(item: JourneyAgreement): void;
  remove(code: string): boolean;
  list(): JourneyAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyAgreementStore implements JourneyAgreementStore {
  items: Map<string, JourneyAgreement>;
  order: string[];

  constructor(items: Map<string, JourneyAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyAgreement): void {
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

  list(): JourneyAgreement[] {
    const out: JourneyAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyAgreementStore(): JourneyAgreementStore {
  return new MemoryJourneyAgreementStore(new Map<string, JourneyAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyAgreementStore implements JourneyAgreementStore {
  inner: JourneyAgreementStore;
  cache: cache.TtlCache<JourneyAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneyAgreementStore,
    cacheValue: cache.TtlCache<JourneyAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyAgreement | undefined {
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

  save(item: JourneyAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyAgreement[] {
    return this.inner.list();
  }
}

export function newCachedJourneyAgreementStore(inner: JourneyAgreementStore, ttl: number, clockValue: clock.Clock): JourneyAgreementStore {
  return new CachedJourneyAgreementStore(inner, cache.newTtlCache<JourneyAgreement>(256, ttl, clockValue), 0, 0);
}

/** Selects journey agreements. Empty fields match all. */
export class JourneyAgreementQuery {
  category: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minLimit: number, statuses: string[], limit: number) {
    this.category = category;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyAgreement): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyAgreement[]): JourneyAgreement[] {
    const matched = collections.filter(items, (candidate: JourneyAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyAgreements(store: JourneyAgreementStore, query: JourneyAgreementQuery): JourneyAgreement[] {
  return query.apply(store.list());
}
