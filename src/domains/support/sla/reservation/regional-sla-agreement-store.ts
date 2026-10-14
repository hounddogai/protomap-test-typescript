import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSlaAgreement } from "./regional-sla-agreement.js";

/** Keeps regional sla agreements by code. */
export interface RegionalSlaAgreementStore {
  find(code: string): RegionalSlaAgreement | undefined;
  save(item: RegionalSlaAgreement): void;
  remove(code: string): boolean;
  list(): RegionalSlaAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSlaAgreementStore implements RegionalSlaAgreementStore {
  items: Map<string, RegionalSlaAgreement>;
  order: string[];

  constructor(items: Map<string, RegionalSlaAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSlaAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSlaAgreement): void {
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

  list(): RegionalSlaAgreement[] {
    const out: RegionalSlaAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSlaAgreementStore(): RegionalSlaAgreementStore {
  return new MemoryRegionalSlaAgreementStore(new Map<string, RegionalSlaAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSlaAgreementStore implements RegionalSlaAgreementStore {
  inner: RegionalSlaAgreementStore;
  cache: cache.TtlCache<RegionalSlaAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSlaAgreementStore,
    cacheValue: cache.TtlCache<RegionalSlaAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSlaAgreement | undefined {
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

  save(item: RegionalSlaAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSlaAgreement[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSlaAgreementStore(inner: RegionalSlaAgreementStore, ttl: number, clockValue: clock.Clock): RegionalSlaAgreementStore {
  return new CachedRegionalSlaAgreementStore(
    inner,
    cache.newTtlCache<RegionalSlaAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional sla agreements. Empty fields match all. */
export class RegionalSlaAgreementQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSlaAgreement): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSlaAgreement[]): RegionalSlaAgreement[] {
    const matched = collections.filter(items, (candidate: RegionalSlaAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSlaAgreements(store: RegionalSlaAgreementStore, query: RegionalSlaAgreementQuery): RegionalSlaAgreement[] {
  return query.apply(store.list());
}
