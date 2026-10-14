import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedMacroEstimate } from "./capped-macro-estimate.js";

/** Keeps capped macro estimates by code. */
export interface CappedMacroEstimateStore {
  find(code: string): CappedMacroEstimate | undefined;
  save(item: CappedMacroEstimate): void;
  remove(code: string): boolean;
  list(): CappedMacroEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedMacroEstimateStore implements CappedMacroEstimateStore {
  items: Map<string, CappedMacroEstimate>;
  order: string[];

  constructor(items: Map<string, CappedMacroEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedMacroEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedMacroEstimate): void {
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

  list(): CappedMacroEstimate[] {
    const out: CappedMacroEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedMacroEstimateStore(): CappedMacroEstimateStore {
  return new MemoryCappedMacroEstimateStore(new Map<string, CappedMacroEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedMacroEstimateStore implements CappedMacroEstimateStore {
  inner: CappedMacroEstimateStore;
  cache: cache.TtlCache<CappedMacroEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedMacroEstimateStore,
    cacheValue: cache.TtlCache<CappedMacroEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedMacroEstimate | undefined {
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

  save(item: CappedMacroEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedMacroEstimate[] {
    return this.inner.list();
  }
}

export function newCachedCappedMacroEstimateStore(inner: CappedMacroEstimateStore, ttl: number, clockValue: clock.Clock): CappedMacroEstimateStore {
  return new CachedCappedMacroEstimateStore(inner, cache.newTtlCache<CappedMacroEstimate>(256, ttl, clockValue), 0, 0);
}

/** Selects capped macro estimates. Empty fields match all. */
export class CappedMacroEstimateQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedMacroEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedMacroEstimate[]): CappedMacroEstimate[] {
    const matched = collections.filter(items, (candidate: CappedMacroEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedMacroEstimates(store: CappedMacroEstimateStore, query: CappedMacroEstimateQuery): CappedMacroEstimate[] {
  return query.apply(store.list());
}
