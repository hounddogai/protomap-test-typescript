import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchAgreement } from "./branch-agreement.js";

/** Keeps branch agreements by code. */
export interface BranchAgreementStore {
  find(code: string): BranchAgreement | undefined;
  save(item: BranchAgreement): void;
  remove(code: string): boolean;
  list(): BranchAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchAgreementStore implements BranchAgreementStore {
  items: Map<string, BranchAgreement>;
  order: string[];

  constructor(items: Map<string, BranchAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchAgreement): void {
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

  list(): BranchAgreement[] {
    const out: BranchAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchAgreementStore(): BranchAgreementStore {
  return new MemoryBranchAgreementStore(new Map<string, BranchAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchAgreementStore implements BranchAgreementStore {
  inner: BranchAgreementStore;
  cache: cache.TtlCache<BranchAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchAgreementStore,
    cacheValue: cache.TtlCache<BranchAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchAgreement | undefined {
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

  save(item: BranchAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchAgreement[] {
    return this.inner.list();
  }
}

export function newCachedBranchAgreementStore(inner: BranchAgreementStore, ttl: number, clockValue: clock.Clock): BranchAgreementStore {
  return new CachedBranchAgreementStore(inner, cache.newTtlCache<BranchAgreement>(256, ttl, clockValue), 0, 0);
}

/** Selects branch agreements. Empty fields match all. */
export class BranchAgreementQuery {
  region: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minScore: number, statuses: string[], limit: number) {
    this.region = region;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchAgreement): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchAgreement[]): BranchAgreement[] {
    const matched = collections.filter(items, (candidate: BranchAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchAgreements(store: BranchAgreementStore, query: BranchAgreementQuery): BranchAgreement[] {
  return query.apply(store.list());
}
