import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalAgreement } from "./approval-agreement.js";

/** Keeps approval agreements by code. */
export interface ApprovalAgreementStore {
  find(code: string): ApprovalAgreement | undefined;
  save(item: ApprovalAgreement): void;
  remove(code: string): boolean;
  list(): ApprovalAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalAgreementStore implements ApprovalAgreementStore {
  items: Map<string, ApprovalAgreement>;
  order: string[];

  constructor(items: Map<string, ApprovalAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalAgreement): void {
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

  list(): ApprovalAgreement[] {
    const out: ApprovalAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalAgreementStore(): ApprovalAgreementStore {
  return new MemoryApprovalAgreementStore(new Map<string, ApprovalAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalAgreementStore implements ApprovalAgreementStore {
  inner: ApprovalAgreementStore;
  cache: cache.TtlCache<ApprovalAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalAgreementStore,
    cacheValue: cache.TtlCache<ApprovalAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalAgreement | undefined {
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

  save(item: ApprovalAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalAgreement[] {
    return this.inner.list();
  }
}

export function newCachedApprovalAgreementStore(inner: ApprovalAgreementStore, ttl: number, clockValue: clock.Clock): ApprovalAgreementStore {
  return new CachedApprovalAgreementStore(inner, cache.newTtlCache<ApprovalAgreement>(512, ttl, clockValue), 0, 0);
}

/** Selects approval agreements. Empty fields match all. */
export class ApprovalAgreementQuery {
  segment: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMargin: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalAgreement): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalAgreement[]): ApprovalAgreement[] {
    const matched = collections.filter(items, (candidate: ApprovalAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalAgreements(store: ApprovalAgreementStore, query: ApprovalAgreementQuery): ApprovalAgreement[] {
  return query.apply(store.list());
}
