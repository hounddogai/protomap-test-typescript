import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

/** Keeps lenient suppression agreements by code. */
export interface LenientSuppressionAgreementStore {
  find(code: string): LenientSuppressionAgreement | undefined;
  save(item: LenientSuppressionAgreement): void;
  remove(code: string): boolean;
  list(): LenientSuppressionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSuppressionAgreementStore implements LenientSuppressionAgreementStore {
  items: Map<string, LenientSuppressionAgreement>;
  order: string[];

  constructor(items: Map<string, LenientSuppressionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSuppressionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSuppressionAgreement): void {
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

  list(): LenientSuppressionAgreement[] {
    const out: LenientSuppressionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSuppressionAgreementStore(): LenientSuppressionAgreementStore {
  return new MemoryLenientSuppressionAgreementStore(new Map<string, LenientSuppressionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSuppressionAgreementStore implements LenientSuppressionAgreementStore {
  inner: LenientSuppressionAgreementStore;
  cache: cache.TtlCache<LenientSuppressionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSuppressionAgreementStore,
    cacheValue: cache.TtlCache<LenientSuppressionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSuppressionAgreement | undefined {
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

  save(item: LenientSuppressionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSuppressionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedLenientSuppressionAgreementStore(inner: LenientSuppressionAgreementStore, ttl: number, clockValue: clock.Clock): LenientSuppressionAgreementStore {
  return new CachedLenientSuppressionAgreementStore(
    inner,
    cache.newTtlCache<LenientSuppressionAgreement>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient suppression agreements. Empty fields match all. */
export class LenientSuppressionAgreementQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSuppressionAgreement): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSuppressionAgreement[]): LenientSuppressionAgreement[] {
    const matched = collections.filter(items, (candidate: LenientSuppressionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSuppressionAgreements(store: LenientSuppressionAgreementStore, query: LenientSuppressionAgreementQuery): LenientSuppressionAgreement[] {
  return query.apply(store.list());
}
