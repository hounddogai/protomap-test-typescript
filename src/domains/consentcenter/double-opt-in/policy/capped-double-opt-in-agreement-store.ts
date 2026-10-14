import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedDoubleOptInAgreement } from "./capped-double-opt-in-agreement.js";

/** Keeps capped double opt in agreements by code. */
export interface CappedDoubleOptInAgreementStore {
  find(code: string): CappedDoubleOptInAgreement | undefined;
  save(item: CappedDoubleOptInAgreement): void;
  remove(code: string): boolean;
  list(): CappedDoubleOptInAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedDoubleOptInAgreementStore implements CappedDoubleOptInAgreementStore {
  items: Map<string, CappedDoubleOptInAgreement>;
  order: string[];

  constructor(items: Map<string, CappedDoubleOptInAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedDoubleOptInAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedDoubleOptInAgreement): void {
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

  list(): CappedDoubleOptInAgreement[] {
    const out: CappedDoubleOptInAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedDoubleOptInAgreementStore(): CappedDoubleOptInAgreementStore {
  return new MemoryCappedDoubleOptInAgreementStore(new Map<string, CappedDoubleOptInAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedDoubleOptInAgreementStore implements CappedDoubleOptInAgreementStore {
  inner: CappedDoubleOptInAgreementStore;
  cache: cache.TtlCache<CappedDoubleOptInAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedDoubleOptInAgreementStore,
    cacheValue: cache.TtlCache<CappedDoubleOptInAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedDoubleOptInAgreement | undefined {
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

  save(item: CappedDoubleOptInAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedDoubleOptInAgreement[] {
    return this.inner.list();
  }
}

export function newCachedCappedDoubleOptInAgreementStore(inner: CappedDoubleOptInAgreementStore, ttl: number, clockValue: clock.Clock): CappedDoubleOptInAgreementStore {
  return new CachedCappedDoubleOptInAgreementStore(
    inner,
    cache.newTtlCache<CappedDoubleOptInAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped double opt in agreements. Empty fields match all. */
export class CappedDoubleOptInAgreementQuery {
  unit: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRevision: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedDoubleOptInAgreement): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedDoubleOptInAgreement[]): CappedDoubleOptInAgreement[] {
    const matched = collections.filter(items, (candidate: CappedDoubleOptInAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedDoubleOptInAgreements(store: CappedDoubleOptInAgreementStore, query: CappedDoubleOptInAgreementQuery): CappedDoubleOptInAgreement[] {
  return query.apply(store.list());
}
