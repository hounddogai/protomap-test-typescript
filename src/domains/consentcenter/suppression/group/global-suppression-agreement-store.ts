import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSuppressionAgreement } from "./global-suppression-agreement.js";

/** Keeps global suppression agreements by code. */
export interface GlobalSuppressionAgreementStore {
  find(code: string): GlobalSuppressionAgreement | undefined;
  save(item: GlobalSuppressionAgreement): void;
  remove(code: string): boolean;
  list(): GlobalSuppressionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSuppressionAgreementStore implements GlobalSuppressionAgreementStore {
  items: Map<string, GlobalSuppressionAgreement>;
  order: string[];

  constructor(items: Map<string, GlobalSuppressionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSuppressionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSuppressionAgreement): void {
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

  list(): GlobalSuppressionAgreement[] {
    const out: GlobalSuppressionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSuppressionAgreementStore(): GlobalSuppressionAgreementStore {
  return new MemoryGlobalSuppressionAgreementStore(new Map<string, GlobalSuppressionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSuppressionAgreementStore implements GlobalSuppressionAgreementStore {
  inner: GlobalSuppressionAgreementStore;
  cache: cache.TtlCache<GlobalSuppressionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSuppressionAgreementStore,
    cacheValue: cache.TtlCache<GlobalSuppressionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSuppressionAgreement | undefined {
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

  save(item: GlobalSuppressionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSuppressionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSuppressionAgreementStore(inner: GlobalSuppressionAgreementStore, ttl: number, clockValue: clock.Clock): GlobalSuppressionAgreementStore {
  return new CachedGlobalSuppressionAgreementStore(
    inner,
    cache.newTtlCache<GlobalSuppressionAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global suppression agreements. Empty fields match all. */
export class GlobalSuppressionAgreementQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSuppressionAgreement): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSuppressionAgreement[]): GlobalSuppressionAgreement[] {
    const matched = collections.filter(items, (candidate: GlobalSuppressionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSuppressionAgreements(store: GlobalSuppressionAgreementStore, query: GlobalSuppressionAgreementQuery): GlobalSuppressionAgreement[] {
  return query.apply(store.list());
}
