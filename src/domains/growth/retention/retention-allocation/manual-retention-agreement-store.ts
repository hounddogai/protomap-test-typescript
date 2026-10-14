import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRetentionAgreement } from "./manual-retention-agreement.js";

/** Keeps manual retention agreements by code. */
export interface ManualRetentionAgreementStore {
  find(code: string): ManualRetentionAgreement | undefined;
  save(item: ManualRetentionAgreement): void;
  remove(code: string): boolean;
  list(): ManualRetentionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRetentionAgreementStore implements ManualRetentionAgreementStore {
  items: Map<string, ManualRetentionAgreement>;
  order: string[];

  constructor(items: Map<string, ManualRetentionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRetentionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRetentionAgreement): void {
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

  list(): ManualRetentionAgreement[] {
    const out: ManualRetentionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRetentionAgreementStore(): ManualRetentionAgreementStore {
  return new MemoryManualRetentionAgreementStore(new Map<string, ManualRetentionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRetentionAgreementStore implements ManualRetentionAgreementStore {
  inner: ManualRetentionAgreementStore;
  cache: cache.TtlCache<ManualRetentionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRetentionAgreementStore,
    cacheValue: cache.TtlCache<ManualRetentionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRetentionAgreement | undefined {
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

  save(item: ManualRetentionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRetentionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedManualRetentionAgreementStore(inner: ManualRetentionAgreementStore, ttl: number, clockValue: clock.Clock): ManualRetentionAgreementStore {
  return new CachedManualRetentionAgreementStore(
    inner,
    cache.newTtlCache<ManualRetentionAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual retention agreements. Empty fields match all. */
export class ManualRetentionAgreementQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRetentionAgreement): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRetentionAgreement[]): ManualRetentionAgreement[] {
    const matched = collections.filter(items, (candidate: ManualRetentionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRetentionAgreements(store: ManualRetentionAgreementStore, query: ManualRetentionAgreementQuery): ManualRetentionAgreement[] {
  return query.apply(store.list());
}
