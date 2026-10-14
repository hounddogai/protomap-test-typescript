import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryApprovalAgreement } from "./primary-approval-agreement.js";

/** Keeps primary approval agreements by code. */
export interface PrimaryApprovalAgreementStore {
  find(code: string): PrimaryApprovalAgreement | undefined;
  save(item: PrimaryApprovalAgreement): void;
  remove(code: string): boolean;
  list(): PrimaryApprovalAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryApprovalAgreementStore implements PrimaryApprovalAgreementStore {
  items: Map<string, PrimaryApprovalAgreement>;
  order: string[];

  constructor(items: Map<string, PrimaryApprovalAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryApprovalAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryApprovalAgreement): void {
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

  list(): PrimaryApprovalAgreement[] {
    const out: PrimaryApprovalAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryApprovalAgreementStore(): PrimaryApprovalAgreementStore {
  return new MemoryPrimaryApprovalAgreementStore(new Map<string, PrimaryApprovalAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryApprovalAgreementStore implements PrimaryApprovalAgreementStore {
  inner: PrimaryApprovalAgreementStore;
  cache: cache.TtlCache<PrimaryApprovalAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryApprovalAgreementStore,
    cacheValue: cache.TtlCache<PrimaryApprovalAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryApprovalAgreement | undefined {
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

  save(item: PrimaryApprovalAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryApprovalAgreement[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryApprovalAgreementStore(inner: PrimaryApprovalAgreementStore, ttl: number, clockValue: clock.Clock): PrimaryApprovalAgreementStore {
  return new CachedPrimaryApprovalAgreementStore(
    inner,
    cache.newTtlCache<PrimaryApprovalAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary approval agreements. Empty fields match all. */
export class PrimaryApprovalAgreementQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryApprovalAgreement): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryApprovalAgreement[]): PrimaryApprovalAgreement[] {
    const matched = collections.filter(items, (candidate: PrimaryApprovalAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryApprovalAgreements(store: PrimaryApprovalAgreementStore, query: PrimaryApprovalAgreementQuery): PrimaryApprovalAgreement[] {
  return query.apply(store.list());
}
