import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightAgreement } from "./flight-agreement.js";

/** Keeps flight agreements by code. */
export interface FlightAgreementStore {
  find(code: string): FlightAgreement | undefined;
  save(item: FlightAgreement): void;
  remove(code: string): boolean;
  list(): FlightAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightAgreementStore implements FlightAgreementStore {
  items: Map<string, FlightAgreement>;
  order: string[];

  constructor(items: Map<string, FlightAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightAgreement): void {
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

  list(): FlightAgreement[] {
    const out: FlightAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightAgreementStore(): FlightAgreementStore {
  return new MemoryFlightAgreementStore(new Map<string, FlightAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightAgreementStore implements FlightAgreementStore {
  inner: FlightAgreementStore;
  cache: cache.TtlCache<FlightAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightAgreementStore,
    cacheValue: cache.TtlCache<FlightAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightAgreement | undefined {
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

  save(item: FlightAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightAgreement[] {
    return this.inner.list();
  }
}

export function newCachedFlightAgreementStore(inner: FlightAgreementStore, ttl: number, clockValue: clock.Clock): FlightAgreementStore {
  return new CachedFlightAgreementStore(inner, cache.newTtlCache<FlightAgreement>(128, ttl, clockValue), 0, 0);
}

/** Selects flight agreements. Empty fields match all. */
export class FlightAgreementQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightAgreement[]): FlightAgreement[] {
    const matched = collections.filter(items, (candidate: FlightAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightAgreements(store: FlightAgreementStore, query: FlightAgreementQuery): FlightAgreement[] {
  return query.apply(store.list());
}
