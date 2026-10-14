import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteAgreement } from "./invite-agreement.js";

/** Keeps invite agreements by code. */
export interface InviteAgreementStore {
  find(code: string): InviteAgreement | undefined;
  save(item: InviteAgreement): void;
  remove(code: string): boolean;
  list(): InviteAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteAgreementStore implements InviteAgreementStore {
  items: Map<string, InviteAgreement>;
  order: string[];

  constructor(items: Map<string, InviteAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteAgreement): void {
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

  list(): InviteAgreement[] {
    const out: InviteAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteAgreementStore(): InviteAgreementStore {
  return new MemoryInviteAgreementStore(new Map<string, InviteAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteAgreementStore implements InviteAgreementStore {
  inner: InviteAgreementStore;
  cache: cache.TtlCache<InviteAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteAgreementStore,
    cacheValue: cache.TtlCache<InviteAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteAgreement | undefined {
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

  save(item: InviteAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteAgreement[] {
    return this.inner.list();
  }
}

export function newCachedInviteAgreementStore(inner: InviteAgreementStore, ttl: number, clockValue: clock.Clock): InviteAgreementStore {
  return new CachedInviteAgreementStore(inner, cache.newTtlCache<InviteAgreement>(256, ttl, clockValue), 0, 0);
}

/** Selects invite agreements. Empty fields match all. */
export class InviteAgreementQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteAgreement): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteAgreement[]): InviteAgreement[] {
    const matched = collections.filter(items, (candidate: InviteAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteAgreements(store: InviteAgreementStore, query: InviteAgreementQuery): InviteAgreement[] {
  return query.apply(store.list());
}
