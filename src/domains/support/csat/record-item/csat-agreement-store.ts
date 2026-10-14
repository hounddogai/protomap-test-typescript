import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatAgreement } from "./csat-agreement.js";

/** Keeps csat agreements by code. */
export interface CsatAgreementStore {
  find(code: string): CsatAgreement | undefined;
  save(item: CsatAgreement): void;
  remove(code: string): boolean;
  list(): CsatAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatAgreementStore implements CsatAgreementStore {
  items: Map<string, CsatAgreement>;
  order: string[];

  constructor(items: Map<string, CsatAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatAgreement): void {
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

  list(): CsatAgreement[] {
    const out: CsatAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatAgreementStore(): CsatAgreementStore {
  return new MemoryCsatAgreementStore(new Map<string, CsatAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatAgreementStore implements CsatAgreementStore {
  inner: CsatAgreementStore;
  cache: cache.TtlCache<CsatAgreement>;
  hits: number;
  misses: number;

  constructor(inner: CsatAgreementStore, cacheValue: cache.TtlCache<CsatAgreement>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatAgreement | undefined {
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

  save(item: CsatAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatAgreement[] {
    return this.inner.list();
  }
}

export function newCachedCsatAgreementStore(inner: CsatAgreementStore, ttl: number, clockValue: clock.Clock): CsatAgreementStore {
  return new CachedCsatAgreementStore(inner, cache.newTtlCache<CsatAgreement>(512, ttl, clockValue), 0, 0);
}

/** Selects csat agreements. Empty fields match all. */
export class CsatAgreementQuery {
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

  matches(item: CsatAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatAgreement[]): CsatAgreement[] {
    const matched = collections.filter(items, (candidate: CsatAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatAgreements(store: CsatAgreementStore, query: CsatAgreementQuery): CsatAgreement[] {
  return query.apply(store.list());
}
