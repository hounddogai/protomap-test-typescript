import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientStreakAgreement } from "./lenient-streak-agreement.js";

/** Keeps lenient streak agreements by code. */
export interface LenientStreakAgreementStore {
  find(code: string): LenientStreakAgreement | undefined;
  save(item: LenientStreakAgreement): void;
  remove(code: string): boolean;
  list(): LenientStreakAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientStreakAgreementStore implements LenientStreakAgreementStore {
  items: Map<string, LenientStreakAgreement>;
  order: string[];

  constructor(items: Map<string, LenientStreakAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientStreakAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientStreakAgreement): void {
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

  list(): LenientStreakAgreement[] {
    const out: LenientStreakAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientStreakAgreementStore(): LenientStreakAgreementStore {
  return new MemoryLenientStreakAgreementStore(new Map<string, LenientStreakAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientStreakAgreementStore implements LenientStreakAgreementStore {
  inner: LenientStreakAgreementStore;
  cache: cache.TtlCache<LenientStreakAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientStreakAgreementStore,
    cacheValue: cache.TtlCache<LenientStreakAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientStreakAgreement | undefined {
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

  save(item: LenientStreakAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientStreakAgreement[] {
    return this.inner.list();
  }
}

export function newCachedLenientStreakAgreementStore(inner: LenientStreakAgreementStore, ttl: number, clockValue: clock.Clock): LenientStreakAgreementStore {
  return new CachedLenientStreakAgreementStore(
    inner,
    cache.newTtlCache<LenientStreakAgreement>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient streak agreements. Empty fields match all. */
export class LenientStreakAgreementQuery {
  utmSource: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRatio: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientStreakAgreement): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientStreakAgreement[]): LenientStreakAgreement[] {
    const matched = collections.filter(items, (candidate: LenientStreakAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientStreakAgreements(store: LenientStreakAgreementStore, query: LenientStreakAgreementQuery): LenientStreakAgreement[] {
  return query.apply(store.list());
}
