import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementAgreement } from "./placement-agreement.js";

/** Keeps placement agreements by code. */
export interface PlacementAgreementStore {
  find(code: string): PlacementAgreement | undefined;
  save(item: PlacementAgreement): void;
  remove(code: string): boolean;
  list(): PlacementAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementAgreementStore implements PlacementAgreementStore {
  items: Map<string, PlacementAgreement>;
  order: string[];

  constructor(items: Map<string, PlacementAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementAgreement): void {
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

  list(): PlacementAgreement[] {
    const out: PlacementAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementAgreementStore(): PlacementAgreementStore {
  return new MemoryPlacementAgreementStore(new Map<string, PlacementAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementAgreementStore implements PlacementAgreementStore {
  inner: PlacementAgreementStore;
  cache: cache.TtlCache<PlacementAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementAgreementStore,
    cacheValue: cache.TtlCache<PlacementAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementAgreement | undefined {
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

  save(item: PlacementAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementAgreement[] {
    return this.inner.list();
  }
}

export function newCachedPlacementAgreementStore(inner: PlacementAgreementStore, ttl: number, clockValue: clock.Clock): PlacementAgreementStore {
  return new CachedPlacementAgreementStore(inner, cache.newTtlCache<PlacementAgreement>(64, ttl, clockValue), 0, 0);
}

/** Selects placement agreements. Empty fields match all. */
export class PlacementAgreementQuery {
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

  matches(item: PlacementAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementAgreement[]): PlacementAgreement[] {
    const matched = collections.filter(items, (candidate: PlacementAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementAgreements(store: PlacementAgreementStore, query: PlacementAgreementQuery): PlacementAgreement[] {
  return query.apply(store.list());
}
