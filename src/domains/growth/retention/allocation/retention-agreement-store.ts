import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionAgreement } from "./retention-agreement.js";

/** Keeps retention agreements by code. */
export interface RetentionAgreementStore {
  find(code: string): RetentionAgreement | undefined;
  save(item: RetentionAgreement): void;
  remove(code: string): boolean;
  list(): RetentionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionAgreementStore implements RetentionAgreementStore {
  items: Map<string, RetentionAgreement>;
  order: string[];

  constructor(items: Map<string, RetentionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionAgreement): void {
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

  list(): RetentionAgreement[] {
    const out: RetentionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionAgreementStore(): RetentionAgreementStore {
  return new MemoryRetentionAgreementStore(new Map<string, RetentionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionAgreementStore implements RetentionAgreementStore {
  inner: RetentionAgreementStore;
  cache: cache.TtlCache<RetentionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionAgreementStore,
    cacheValue: cache.TtlCache<RetentionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionAgreement | undefined {
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

  save(item: RetentionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedRetentionAgreementStore(inner: RetentionAgreementStore, ttl: number, clockValue: clock.Clock): RetentionAgreementStore {
  return new CachedRetentionAgreementStore(inner, cache.newTtlCache<RetentionAgreement>(512, ttl, clockValue), 0, 0);
}

/** Selects retention agreements. Empty fields match all. */
export class RetentionAgreementQuery {
  unit: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionAgreement): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionAgreement[]): RetentionAgreement[] {
    const matched = collections.filter(items, (candidate: RetentionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionAgreements(store: RetentionAgreementStore, query: RetentionAgreementQuery): RetentionAgreement[] {
  return query.apply(store.list());
}
