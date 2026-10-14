import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalApprovalAgreement } from "./regional-approval-agreement.js";

/** Keeps regional approval agreements by code. */
export interface RegionalApprovalAgreementStore {
  find(code: string): RegionalApprovalAgreement | undefined;
  save(item: RegionalApprovalAgreement): void;
  remove(code: string): boolean;
  list(): RegionalApprovalAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalApprovalAgreementStore implements RegionalApprovalAgreementStore {
  items: Map<string, RegionalApprovalAgreement>;
  order: string[];

  constructor(items: Map<string, RegionalApprovalAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalApprovalAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalApprovalAgreement): void {
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

  list(): RegionalApprovalAgreement[] {
    const out: RegionalApprovalAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalApprovalAgreementStore(): RegionalApprovalAgreementStore {
  return new MemoryRegionalApprovalAgreementStore(new Map<string, RegionalApprovalAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalApprovalAgreementStore implements RegionalApprovalAgreementStore {
  inner: RegionalApprovalAgreementStore;
  cache: cache.TtlCache<RegionalApprovalAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalApprovalAgreementStore,
    cacheValue: cache.TtlCache<RegionalApprovalAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalApprovalAgreement | undefined {
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

  save(item: RegionalApprovalAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalApprovalAgreement[] {
    return this.inner.list();
  }
}

export function newCachedRegionalApprovalAgreementStore(inner: RegionalApprovalAgreementStore, ttl: number, clockValue: clock.Clock): RegionalApprovalAgreementStore {
  return new CachedRegionalApprovalAgreementStore(
    inner,
    cache.newTtlCache<RegionalApprovalAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional approval agreements. Empty fields match all. */
export class RegionalApprovalAgreementQuery {
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

  matches(item: RegionalApprovalAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalApprovalAgreement[]): RegionalApprovalAgreement[] {
    const matched = collections.filter(items, (candidate: RegionalApprovalAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalApprovalAgreements(store: RegionalApprovalAgreementStore, query: RegionalApprovalAgreementQuery): RegionalApprovalAgreement[] {
  return query.apply(store.list());
}
