import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionAgreement } from "./conversion-agreement.js";

/** Keeps conversion agreements by code. */
export interface ConversionAgreementStore {
  find(code: string): ConversionAgreement | undefined;
  save(item: ConversionAgreement): void;
  remove(code: string): boolean;
  list(): ConversionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionAgreementStore implements ConversionAgreementStore {
  items: Map<string, ConversionAgreement>;
  order: string[];

  constructor(items: Map<string, ConversionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionAgreement): void {
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

  list(): ConversionAgreement[] {
    const out: ConversionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionAgreementStore(): ConversionAgreementStore {
  return new MemoryConversionAgreementStore(new Map<string, ConversionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionAgreementStore implements ConversionAgreementStore {
  inner: ConversionAgreementStore;
  cache: cache.TtlCache<ConversionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionAgreementStore,
    cacheValue: cache.TtlCache<ConversionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionAgreement | undefined {
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

  save(item: ConversionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedConversionAgreementStore(inner: ConversionAgreementStore, ttl: number, clockValue: clock.Clock): ConversionAgreementStore {
  return new CachedConversionAgreementStore(inner, cache.newTtlCache<ConversionAgreement>(128, ttl, clockValue), 0, 0);
}

/** Selects conversion agreements. Empty fields match all. */
export class ConversionAgreementQuery {
  region: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRevision: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionAgreement): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionAgreement[]): ConversionAgreement[] {
    const matched = collections.filter(items, (candidate: ConversionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionAgreements(store: ConversionAgreementStore, query: ConversionAgreementQuery): ConversionAgreement[] {
  return query.apply(store.list());
}
