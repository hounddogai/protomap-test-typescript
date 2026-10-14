import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckDraft } from "./fraud-check-draft.js";

/** Keeps fraud check drafts by code. */
export interface FraudCheckDraftStore {
  find(code: string): FraudCheckDraft | undefined;
  save(item: FraudCheckDraft): void;
  remove(code: string): boolean;
  list(): FraudCheckDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckDraftStore implements FraudCheckDraftStore {
  items: Map<string, FraudCheckDraft>;
  order: string[];

  constructor(items: Map<string, FraudCheckDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckDraft): void {
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

  list(): FraudCheckDraft[] {
    const out: FraudCheckDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckDraftStore(): FraudCheckDraftStore {
  return new MemoryFraudCheckDraftStore(new Map<string, FraudCheckDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckDraftStore implements FraudCheckDraftStore {
  inner: FraudCheckDraftStore;
  cache: cache.TtlCache<FraudCheckDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckDraftStore,
    cacheValue: cache.TtlCache<FraudCheckDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckDraft | undefined {
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

  save(item: FraudCheckDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckDraft[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckDraftStore(inner: FraudCheckDraftStore, ttl: number, clockValue: clock.Clock): FraudCheckDraftStore {
  return new CachedFraudCheckDraftStore(inner, cache.newTtlCache<FraudCheckDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects fraud check drafts. Empty fields match all. */
export class FraudCheckDraftQuery {
  unit: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCapacity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckDraft): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckDraft[]): FraudCheckDraft[] {
    const matched = collections.filter(items, (candidate: FraudCheckDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckDrafts(store: FraudCheckDraftStore, query: FraudCheckDraftQuery): FraudCheckDraft[] {
  return query.apply(store.list());
}
