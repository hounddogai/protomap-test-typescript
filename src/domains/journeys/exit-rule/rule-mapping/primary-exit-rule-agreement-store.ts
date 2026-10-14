import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryExitRuleAgreement } from "./primary-exit-rule-agreement.js";

/** Keeps primary exit rule agreements by code. */
export interface PrimaryExitRuleAgreementStore {
  find(code: string): PrimaryExitRuleAgreement | undefined;
  save(item: PrimaryExitRuleAgreement): void;
  remove(code: string): boolean;
  list(): PrimaryExitRuleAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryExitRuleAgreementStore implements PrimaryExitRuleAgreementStore {
  items: Map<string, PrimaryExitRuleAgreement>;
  order: string[];

  constructor(items: Map<string, PrimaryExitRuleAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryExitRuleAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryExitRuleAgreement): void {
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

  list(): PrimaryExitRuleAgreement[] {
    const out: PrimaryExitRuleAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryExitRuleAgreementStore(): PrimaryExitRuleAgreementStore {
  return new MemoryPrimaryExitRuleAgreementStore(new Map<string, PrimaryExitRuleAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryExitRuleAgreementStore implements PrimaryExitRuleAgreementStore {
  inner: PrimaryExitRuleAgreementStore;
  cache: cache.TtlCache<PrimaryExitRuleAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryExitRuleAgreementStore,
    cacheValue: cache.TtlCache<PrimaryExitRuleAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryExitRuleAgreement | undefined {
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

  save(item: PrimaryExitRuleAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryExitRuleAgreement[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryExitRuleAgreementStore(inner: PrimaryExitRuleAgreementStore, ttl: number, clockValue: clock.Clock): PrimaryExitRuleAgreementStore {
  return new CachedPrimaryExitRuleAgreementStore(
    inner,
    cache.newTtlCache<PrimaryExitRuleAgreement>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary exit rule agreements. Empty fields match all. */
export class PrimaryExitRuleAgreementQuery {
  segment: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMinimum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryExitRuleAgreement): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryExitRuleAgreement[]): PrimaryExitRuleAgreement[] {
    const matched = collections.filter(items, (candidate: PrimaryExitRuleAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryExitRuleAgreements(store: PrimaryExitRuleAgreementStore, query: PrimaryExitRuleAgreementQuery): PrimaryExitRuleAgreement[] {
  return query.apply(store.list());
}
