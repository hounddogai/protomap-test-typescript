import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingApprovalAgreement } from "./pending-approval-agreement.js";

/** Keeps pending approval agreements by code. */
export interface PendingApprovalAgreementStore {
  find(code: string): PendingApprovalAgreement | undefined;
  save(item: PendingApprovalAgreement): void;
  remove(code: string): boolean;
  list(): PendingApprovalAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingApprovalAgreementStore implements PendingApprovalAgreementStore {
  items: Map<string, PendingApprovalAgreement>;
  order: string[];

  constructor(items: Map<string, PendingApprovalAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingApprovalAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingApprovalAgreement): void {
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

  list(): PendingApprovalAgreement[] {
    const out: PendingApprovalAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingApprovalAgreementStore(): PendingApprovalAgreementStore {
  return new MemoryPendingApprovalAgreementStore(new Map<string, PendingApprovalAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingApprovalAgreementStore implements PendingApprovalAgreementStore {
  inner: PendingApprovalAgreementStore;
  cache: cache.TtlCache<PendingApprovalAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingApprovalAgreementStore,
    cacheValue: cache.TtlCache<PendingApprovalAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingApprovalAgreement | undefined {
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

  save(item: PendingApprovalAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingApprovalAgreement[] {
    return this.inner.list();
  }
}

export function newCachedPendingApprovalAgreementStore(inner: PendingApprovalAgreementStore, ttl: number, clockValue: clock.Clock): PendingApprovalAgreementStore {
  return new CachedPendingApprovalAgreementStore(
    inner,
    cache.newTtlCache<PendingApprovalAgreement>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending approval agreements. Empty fields match all. */
export class PendingApprovalAgreementQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingApprovalAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingApprovalAgreement[]): PendingApprovalAgreement[] {
    const matched = collections.filter(items, (candidate: PendingApprovalAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingApprovalAgreements(store: PendingApprovalAgreementStore, query: PendingApprovalAgreementQuery): PendingApprovalAgreement[] {
  return query.apply(store.list());
}
