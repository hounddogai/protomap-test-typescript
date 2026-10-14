import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCreditAgreement } from "./seasonal-credit-agreement.js";

/** Keeps seasonal credit agreements by code. */
export interface SeasonalCreditAgreementStore {
  find(code: string): SeasonalCreditAgreement | undefined;
  save(item: SeasonalCreditAgreement): void;
  remove(code: string): boolean;
  list(): SeasonalCreditAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCreditAgreementStore implements SeasonalCreditAgreementStore {
  items: Map<string, SeasonalCreditAgreement>;
  order: string[];

  constructor(items: Map<string, SeasonalCreditAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCreditAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCreditAgreement): void {
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

  list(): SeasonalCreditAgreement[] {
    const out: SeasonalCreditAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCreditAgreementStore(): SeasonalCreditAgreementStore {
  return new MemorySeasonalCreditAgreementStore(new Map<string, SeasonalCreditAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCreditAgreementStore implements SeasonalCreditAgreementStore {
  inner: SeasonalCreditAgreementStore;
  cache: cache.TtlCache<SeasonalCreditAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCreditAgreementStore,
    cacheValue: cache.TtlCache<SeasonalCreditAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCreditAgreement | undefined {
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

  save(item: SeasonalCreditAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCreditAgreement[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCreditAgreementStore(inner: SeasonalCreditAgreementStore, ttl: number, clockValue: clock.Clock): SeasonalCreditAgreementStore {
  return new CachedSeasonalCreditAgreementStore(
    inner,
    cache.newTtlCache<SeasonalCreditAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal credit agreements. Empty fields match all. */
export class SeasonalCreditAgreementQuery {
  utmSource: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRevision: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCreditAgreement): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCreditAgreement[]): SeasonalCreditAgreement[] {
    const matched = collections.filter(items, (candidate: SeasonalCreditAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCreditAgreements(store: SeasonalCreditAgreementStore, query: SeasonalCreditAgreementQuery): SeasonalCreditAgreement[] {
  return query.apply(store.list());
}
